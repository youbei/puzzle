import './index.scss'
import React, { useState } from 'react'
import Header from '../../components/Header'
import Container from '../../components/Container'
import MissingSku from './MissingSku'
import MissingSkuOrder from './MissingSkuOrder'
import ReturnRatio from './ReturnRatio'
import XLSX from 'xlsx'

function Index() {
	const [isDropOver, setIsDropOver] = useState(false)
	const [hasFiles, setHasFiles] = useState(false)
	const [sum, setSum] = useState(0)
	const [succeed, setSucceed] = useState(0)
	const [closed, setClosed] = useState(0)
	const [orderDetail, setOrderDetail] = useState({})
	const [fake, setFake] = useState(0)
	const [fakeSum, setFakeSum] = useState(0)
	const [totalCost, setTotalCost] = useState(0)
	const [missingSku, setMissingSku] = useState(0)
	const [missingSkuOrder, setMissingSkuOrder] = useState(0)
	const [showMissingSku, setShowMissingSku] = useState(false)
	const [showMissingSkuOrder, setShowMissingSkuOrder] = useState(false)
	const [showReturnRatio, setShowReturnRatio] = useState(false)

	function dropHandler(e) {
		e.preventDefault()
		setIsDropOver(false)

		if (e.dataTransfer.items.length !== 3) {
			return
		}

		readFiles(e.dataTransfer.items)
	}

	function dragOverHandler(e) {
		e.preventDefault()
		setIsDropOver(true)
	}

	function dragLeaveHandler(e) {
		e.preventDefault()
		setIsDropOver(false)
	}

	function readFiles(files) {
		let sku, order, product
		for (let i = 0; i < files.length; i++) {
			if (files[i].kind === 'file') {
				const file = files[i].getAsFile()
				if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
					if (file.name === 'sku.xlsx') {
						sku = file
					} else if (file.name === 'order.xlsx') {
						order = file
					} else if (file.name === 'product.xlsx') {
						product = file
					}
				}
			}
		}

		if (!sku || !order || !product) {
			return
		}

		const p = [
			readFile(sku),
			readFile(order),
			readFile(product),
		]

		Promise.all(p).then((values) => {
			setHasFiles(true)
			calc(values[0], values[1], values[2])
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

	function calc(sku, order, product) {
		let sum = 0
		let succeed = 0
		let closed = 0
		let fake = 0
		let fakeSum = 0
		let fakeOrder = {}
		let missingSkuOrder = {}
		let missingSku = {}
		let totalCost = 0
		let products = {}
		let orderDetail = {}

		for (let i = 0; i < order.length; i++) {
			if (order[i]['订单状态'] === '交易成功') {
				if (isFakeOrder(order[i]['商家备忘'])) {
					fakeOrder[order[i]['订单编号']] = true
				}
			}
		}

		for (let k = 0; k < sku.length; k++) {
			const sskkuu = String(sku[k]['商品编码'])
			if (sskkuu !== 'undefined') {
				const cost = sku[k]['进价']
				const shipping = sku[k]['运费'] || 7
				if (cost) {
					products[sskkuu] = {
						cost: cost + shipping,
						title: sku[k]['商品简称']
					}
				} else {
					missingSku[sskkuu] = sku[k]['商品简称']
				}
			}
		}

		for (let j = 0; j < product.length; j++) {
			const id = product[j]['主订单编号']
			let sku = String(product[j]['商家编码'])
			const payment = Number(product[j]['买家实际支付金额'])
			const title = product[j]['标题']

			if (fakeOrder[id]) { // 刷单
				fakeSum = fakeSum + payment
				fake = fake + 1
			} else { // 真实成交
				if (sku === 'null') {
					if (missingSkuOrder[id]) {
						missingSkuOrder[id].push(title)
					} else {
						missingSkuOrder[id] = [title]
					}
				} else {
					sku = sku.split('-')[0]

					if (!orderDetail[sku]) {
						orderDetail[sku] = {
							total: 0,
							succeed: 0,
							closed: 0,
							title: products[sku] ? products[sku].title : title
						}
					}

					if (product[j]['订单状态'] === '交易成功') {

						// 成交总额
						sum = sum + payment

						// 宝贝成交数量
						succeed = succeed + 1
						orderDetail[sku].succeed = orderDetail[sku].succeed + 1
						orderDetail[sku].total = orderDetail[sku].total + 1

						// 计算成本
						if (products[sku]) {
							totalCost = totalCost + products[sku].cost
						} else {
							missingSku[sku] = product[j]['标题']
						}
					} else {
						closed = closed + 1
						orderDetail[sku].closed = orderDetail[sku].closed + 1
						orderDetail[sku].total = orderDetail[sku].total + 1
					}
				}
			}
		}

		setOrderDetail(orderDetail)
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
					<p className="excel-container-left-item-value">{sum.toFixed(2)} </p>
				</div>
				<div className="excel-container-left-item">
					<p className="excel-container-left-item-title">刷单金额</p>
					<p className="excel-container-left-item-value">{fakeSum.toFixed(2)}</p>
				</div>
				<div className="excel-container-left-item">
					<p className="excel-container-left-item-title">衣物成本 + 运费</p>
					<p className="excel-container-left-item-value">{totalCost.toFixed(2)}</p>
				</div>
				<div className="excel-container-left-item">
					<p className="excel-container-left-item-title">毛利</p>
					<p className="excel-container-left-item-value">{(sum - totalCost).toFixed(2)}</p>
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
					<p className="excel-container-left-item-title">缺失的 sku</p>
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
					<p className="excel-container-left-item-title">含有缺失 sku 的订单</p>
					<p
						className={`excel-container-left-item-value${Object.keys(missingSkuOrder).length > 0 ? ' excel-container-left-item-hover' : ''}`}
						onClick={() => {
							if (Object.keys(missingSkuOrder).length > 0) {
								setShowMissingSkuOrder(true)
							}
						}}
					>{Object.keys(missingSkuOrder).length}</p>
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
							<p>把三个文件拖到这里:</p>
							<p>淘宝上下载的两个原始表格</p>
							<p>1. xlsx 后缀的表格重命名为 order.xlsx</p>
							<p>2. csv 后缀的表格导出到 xlsx 并重命名为 product.xlsx</p>
							<p>3. 命名为 sku.xlsx 的 sku 表格</p>
						</div>
					</div>
				</div>
			</Container>
		</div>
	)
}

export default Index