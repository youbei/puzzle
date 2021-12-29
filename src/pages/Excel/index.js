import './index.scss'
import React, { useState } from 'react'
import Header from '../../components/Header'
import Container from '../../components/Container'
import MissingSku from './MissingSku'
import MissingSkuOrder from './MissingSkuOrder'
import MissingSkuProduct from './MissingSkuProduct'
import ReturnRatio from './ReturnRatio'
import UnpaidOrder from './UnpaidOrder'
import XLSX from 'xlsx'

function Index() {
	const [isDropOver, setIsDropOver] = useState(false)
	const [hasFiles, setHasFiles] = useState(false)
	const [sum, setSum] = useState(0)
	const [succeed, setSucceed] = useState(0)
	const [closed, setClosed] = useState(0)
	const [orderDetail, setOrderDetail] = useState({})
	const [unpaidOrder, setUnpaidOrder] = useState({})
	const [fake, setFake] = useState(0)
	const [fakeSum, setFakeSum] = useState(0)
	const [totalCost, setTotalCost] = useState(0)
	const [missingSku, setMissingSku] = useState({})
	const [missingSkuOrder, setMissingSkuOrder] = useState({})
	const [missingSkuProduct, setMissingSkuProduct] = useState({})
	const [showMissingSku, setShowMissingSku] = useState(false)
	const [showMissingSkuOrder, setShowMissingSkuOrder] = useState(false)
	const [showMissingSkuProduct, setShowMissingSkuProduct] = useState(false)
	const [showReturnRatio, setShowReturnRatio] = useState(false)
	const [showUnpaidOrder, setShowUnpaidOrder] = useState(false)

	function dropHandler(e) {
		e.preventDefault()
		setIsDropOver(false)

		if (e.dataTransfer.items.length !== 4) {
			return
		}

		readFiles(e.dataTransfer.items)
	}

	function dragOverHandler(e) {
		e.preventDefault()
		setIsDropOver(true)
		setHasFiles(false)

	}

	function dragLeaveHandler(e) {
		e.preventDefault()
		setIsDropOver(false)
	}

	function readFiles(files) {
		let skuSheet, orderSheet, productSheet, returnSheet
		for (let i = 0; i < files.length; i++) {
			if (files[i].kind === 'file') {
				const file = files[i].getAsFile()
				if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
					if (file.name === 'sku.xlsx') {
						skuSheet = file
					} else if (file.name === 'order.xlsx') {
						orderSheet = file
					} else if (file.name === 'product.xlsx') {
						productSheet = file
					} else if (file.name === 'return.xlsx') {
						returnSheet = file
					}
				}
			}
		}

		if (!skuSheet || !orderSheet || !productSheet || !returnSheet) {
			return
		}

		const p = [
			readFile(skuSheet),
			readFile(orderSheet),
			readFile(productSheet),
			readFile(returnSheet),
		]

		Promise.all(p).then((values) => {
			setHasFiles(true)
			calc(values[0], values[1], values[2], values[3])
		})
	}

	function readFile(file) {
		return new Promise(resolve => {
			const reader = new FileReader()
			reader.addEventListener('load', (e) => {
				const workbook = XLSX.read(new Uint8Array(e.target.result), { type: 'array' })
				const xlsxData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]])
				resolve(xlsxData)
			}, false)
			reader.readAsArrayBuffer(file)
		})
	}

	function calc(skuSheet, orderSheet, productSheet, returnSheet) {
		let sum = 0
		let succeed = 0
		let closed = 0
		let fake = 0
		let fakeSum = 0
		let fakeOrder = {}
		let missingSkuOrder = {}
		let missingSku = {}
		let missingSkuProduct = {}
		let totalCost = 0
		let products = {}
		let unpaidOrder = {}
		let orderDetail = {}
		let returnDetail = {}

		for (let i = 0; i < orderSheet.length; i++) {
			const id = orderSheet[i]['订单编号']

			if (isFakeOrder(orderSheet[i]['商家备忘'])) {
				fakeOrder[id] = true
			}

			if (orderSheet[i]['订单关闭原因'] === '买家未付款') {
				unpaidOrder[id] = orderSheet[i]
			}
		}

		for (let l = 0; l < returnSheet.length; l++) {
			const title = returnSheet[l]['宝贝标题']
			returnDetail[returnSheet[l]['订单编号']] = {
				payment: returnSheet[l]['买家实际支付金额'],
				title,
				return: returnSheet[l]['买家退款金额'],
				sku: title.slice(title.length - 5)
			}
		}


		for (let k = 0; k < skuSheet.length; k++) {
			const sku = String(skuSheet[k]['商品编码'])
			if (sku !== 'undefined') {
				const cost = skuSheet[k]['进价']
				const shipping = skuSheet[k]['运费'] || 7
				if (cost) {
					products[sku] = {
						cost: cost + shipping,
						title: skuSheet[k]['商品简称']
					}
				} else {
					missingSku[sku] = skuSheet[k]['商品简称']
				}
			}
		}

		for (let j = 0; j < productSheet.length; j++) {
			const id = productSheet[j]['主订单编号']
			let longSku = String(productSheet[j]['商家编码'])
			let sku = String(productSheet[j]['商家编码']).split('-')[0]
			const payment = Number(productSheet[j]['买家实际支付金额'])
			const title = productSheet[j]['标题']

			if (fakeOrder[id]) { // 刷单
				fakeSum = fakeSum + payment
				fake = fake + 1
			} else { // 真实成交
				if (longSku === 'null') {
					if (missingSkuOrder[id]) {
						missingSkuOrder[id].push(title)
					} else {
						missingSkuOrder[id] = [title]
					}
					missingSkuProduct[title] = true

					const s = title.slice(title.length - 5)
					if (isNaN(Number(s))) { // 商品标题无sku
						sku = null
					} else { // 获取到商品标题上的sku
						sku = s
					}
				}

				if (sku) {
					if (!orderDetail[sku]) {
						orderDetail[sku] = {
							total: 0,
							succeed: 0,
							closed: 0,
							title: products[sku] ? products[sku].title : title
						}
					}

					if (productSheet[j]['订单状态'] === '交易成功') {
						// 在退款表里再筛选一遍
						if (returnDetail[id]) {
							const sku = returnDetail[id].sku
							if (!orderDetail[sku]) {
								orderDetail[sku] = {
									total: 0,
									succeed: 0,
									closed: 0,
									title: products[sku] ? products[sku].title : title
								}
							}
							closed = closed + 1
							orderDetail[sku].closed = orderDetail[sku].closed + 1
							orderDetail[sku].total = orderDetail[sku].total + 1
						} else {
							// 成交总额
							sum = sum + payment

							// 宝贝成交数量
							succeed = succeed + 1
							orderDetail[sku].succeed = orderDetail[sku].succeed + 1
							orderDetail[sku].total = orderDetail[sku].total + 1

							// 计算成本
							if (products[sku]) {
								totalCost = totalCost + products[sku].cost
							} else if (products[longSku]) {
								totalCost = totalCost + products[longSku].cost
							} else {
								missingSku[sku] = productSheet[j]['标题']
								missingSkuProduct[productSheet[j]['标题']] = true
							}
						}
					} else {
						closed = closed + 1
						orderDetail[sku].closed = orderDetail[sku].closed + 1
						orderDetail[sku].total = orderDetail[sku].total + 1
					}
				}
			}
		}

		setMissingSkuProduct(missingSkuProduct)
		setOrderDetail(orderDetail)
		setUnpaidOrder(unpaidOrder)
		setSum(sum)
		setSucceed(succeed)
		setClosed(closed)
		setFake(fake)
		setFakeSum(fakeSum)
		setTotalCost(totalCost)
		setMissingSku(missingSku)
		setMissingSkuOrder(missingSkuOrder)
	}

	function isFakeOrder(mark) {
		if (mark) {
			if (mark === '1' || mark === '2' || mark.indexOf('微博') > -1) {
				return true
			}
		}

		return false
	}

	function buildResults() {
		if (!hasFiles) {
			return null
		}

		let returnRatio = ''
		if (succeed + closed > 0) {
			returnRatio = `${(closed / (succeed + closed) * 100).toFixed(2)}%`
		}

		return (
			<>
				<div className="excel-container-left-item">
					<p className="excel-container-left-item-title">成交宝贝数量</p>
					<p className="excel-container-left-item-value">{succeed}</p>
				</div>
				<div className="excel-container-left-item">
					<p className="excel-container-left-item-title">关闭宝贝数量</p>
					<p className="excel-container-left-item-value">{closed}</p>
				</div>
				<div className="excel-container-left-item">
					<p className="excel-container-left-item-title">刷单宝贝数量</p>
					<p className="excel-container-left-item-value">{fake}</p>
				</div>
				<div className="excel-container-left-item">
					<p className="excel-container-left-item-title">真实成交金额</p>
					<p className="excel-container-left-item-value">{sum.toFixed(0)} </p>
				</div>
				<div className="excel-container-left-item">
					<p className="excel-container-left-item-title">刷单金额</p>
					<p className="excel-container-left-item-value">{fakeSum.toFixed(0)}</p>
				</div>
				<div className="excel-container-left-item">
					<p className="excel-container-left-item-title">衣物成本 + 运费</p>
					<p className="excel-container-left-item-value">{totalCost.toFixed(0)}</p>
				</div>
				<div className="excel-container-left-item">
					<p className="excel-container-left-item-title">毛利</p>
					<p className="excel-container-left-item-value">{(sum - totalCost).toFixed(0)}</p>
				</div>
				<div className="excel-container-left-item">
					<p className="excel-container-left-item-title">退货率</p>
					<p
						className={`excel-container-left-item-value${returnRatio ? ' excel-container-left-item-hover' : ''}`}
						onClick={() => {
							if (returnRatio) {
								setShowReturnRatio(true)
							}
						}}
					>{returnRatio}</p>
				</div>
				<div className="excel-container-left-item">
					<p className="excel-container-left-item-title">拍下未支付的订单</p>
					<p
						className={`excel-container-left-item-value${Object.keys(unpaidOrder).length > 0 ? ' excel-container-left-item-hover' : ''}`}
						onClick={() => {
							if (Object.keys(unpaidOrder).length > 0) {
								setShowUnpaidOrder(true)
							}
						}}
					>{Object.keys(unpaidOrder).length}</p>
				</div>
				<div className="excel-container-left-item">
					<p className="excel-container-left-item-title">错误或没有价格的 sku</p>
					<p
						className={`excel-container-left-item-value${Object.keys(missingSku).length > 0 ? ' excel-container-left-item-hover' : ''}`}
						onClick={() => {
							if (Object.keys(missingSku).length > 0) {
								setShowMissingSku(true)
							}
						}}
					>{Object.keys(missingSku).length}</p>
				</div>
				<div className="excel-container-left-item">
					<p className="excel-container-left-item-title">含有错误 sku 的订单</p>
					<p
						className={`excel-container-left-item-value${Object.keys(missingSkuOrder).length > 0 ? ' excel-container-left-item-hover' : ''}`}
						onClick={() => {
							if (Object.keys(missingSkuOrder).length > 0) {
								setShowMissingSkuOrder(true)
							}
						}}
					>{Object.keys(missingSkuOrder).length}</p>
				</div>
				<div className="excel-container-left-item">
					<p className="excel-container-left-item-title">含有错误 sku 的宝贝</p>
					<p
						className={`excel-container-left-item-value${Object.keys(missingSkuProduct).length > 0 ? ' excel-container-left-item-hover' : ''}`}
						onClick={() => {
							if (Object.keys(missingSkuProduct).length > 0) {
								setShowMissingSkuProduct(true)
							}
						}}
					>{Object.keys(missingSkuProduct).length}</p>
				</div>
			</>
		)
	}

	return (
		<div className="excel">
			<Header />
			<Container>
				{showReturnRatio && <ReturnRatio list={orderDetail} close={() => setShowReturnRatio(false)} />}
				{showMissingSku && <MissingSku list={missingSku} close={() => setShowMissingSku(false)} />}
				{showMissingSkuOrder && <MissingSkuOrder list={missingSkuOrder} close={() => setShowMissingSkuOrder(false)} />}
				{showMissingSkuProduct && <MissingSkuProduct list={missingSkuProduct} close={() => setShowMissingSkuProduct(false)} />}
				{showUnpaidOrder && <UnpaidOrder list={unpaidOrder} close={() => setShowUnpaidOrder(false)} />}
				<div className="excel-container">
					<div className="excel-container-left">
						{buildResults()}
					</div>
					<div className="excel-container-right">
						<div
							style={isDropOver ? { backgroundColor: 'rgba(170, 172, 247,.8)', color: '#fff' } : {}}
							className="excel-container-right-upload"
							onDrop={(e) => dropHandler(e)}
							onDragOver={(e) => dragOverHandler(e)}
							onDragLeave={(e) => dragLeaveHandler(e)}
						>
							<p>把四个个文件拖到这里:</p>
							<p>淘宝上下载的三个原始表格</p>
							<p>1. 重命名为 order.xlsx 的订单表格（去掉密码）</p>
							<p>2. 重命名为 product.xlsx 的宝贝表格（将 csv 转成 xlsx）</p>
							<p>3. 重命名为 return.xlsx 的退款表格（将 xls 转成 xlsx）</p>
							<p>和命名为 sku.xlsx 的 sku 表格</p>
						</div>
					</div>
				</div>
			</Container>
		</div>
	)
}

export default Index