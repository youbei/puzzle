import './index.scss'
import React, { useState, useEffect, useContext } from 'react'
import Header from '../../components/Header'
import Container from '../../components/Container'
import MissingSku from './MissingSku'
import IncompleteSku from './IncompleteSku'
import ReturnRatio from './ReturnRatio'
import OrderInfo from './OrderInfo'
import { read, utils, writeFile } from 'xlsx'
import { UserContext } from '../../context/user'

const RETURN_INSURANCE = 3

function Index() {
	const { user } = useContext(UserContext)
	const [isSkuDropOver, setIsSkuDropOver] = useState(false)
	const [isTaobaoDropOver, setIsTaobaoDropOver] = useState(false)
	const [hasFiles, setHasFiles] = useState(false)
	const [hasSku, setHasSku] = useState('')
	const [sum, setSum] = useState(0)
	const [succeed, setSucceed] = useState(0)
	const [closed, setClosed] = useState(0)
	const [orderDetail, setOrderDetail] = useState({})
	const [unpaidOrder, setUnpaidOrder] = useState({})
	const [paidAndCancelled, setPaidAndCancelled] = useState({})
	const [validOrder, setValidOrder] = useState({})
	const [fake, setFake] = useState(0)
	const [fakeSum, setFakeSum] = useState(0)
	const [totalCost, setTotalCost] = useState(0)
	const [incompleteSku, setIncompleteSku] = useState({})
	const [missingSku, setMissingSku] = useState({})
	const [showIncompleteSku, setShowIncompleteSku] = useState(false)
	const [showMissingSku, setShowMissingSku] = useState(false)
	const [showReturnRatio, setShowReturnRatio] = useState(false)
	const [showUnpaidOrder, setShowUnpaidOrder] = useState(false)
	const [showValidOrder, setShowValidOrder] = useState(false)

	function skuDropHandler(e) {
		e.preventDefault()
		setIsSkuDropOver(false)
		if (e.dataTransfer.items.length !== 1) {
			return
		}
		readSku(e.dataTransfer.items)
	}

	function skuDragOverHandler(e) {
		e.preventDefault()
		setIsSkuDropOver(true)
	}

	function skuDragLeaveHandler(e) {
		e.preventDefault()
		setIsSkuDropOver(false)
	}

	function taobaoDropHandler(e) {
		e.preventDefault()
		setIsTaobaoDropOver(false)
		if (e.dataTransfer.items.length !== 3 || !hasSku) {
			return
		}
		readFiles(e.dataTransfer.items)
	}

	function taobaoDragOverHandler(e) {
		e.preventDefault()
		setIsTaobaoDropOver(true)
		setHasFiles(false)
	}

	function taobaoDragLeaveHandler(e) {
		e.preventDefault()
		setIsTaobaoDropOver(false)
	}

	function readSku(files) {
		const file = files[0].getAsFile()
		if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
			readFile(file).then((value) => {
				const update = `${new Date().toLocaleDateString()} ${new Date().toTimeString().split(' ')[0]}`
				localStorage.setItem('sku', JSON.stringify(value))
				localStorage.setItem('update', update)
				setHasSku('update', update)
			})
		}
	}

	function readFiles(files) {
		let orderSheet, productSheet, returnSheet
		for (let i = 0; i < files.length; i++) {
			if (files[i].kind === 'file') {
				const file = files[i].getAsFile()
				if (file.name.indexOf('ExportOrderList') > -1) {
					orderSheet = file  // 订单报表 
				} else if (file.name.indexOf('.xls') > -1) {
					returnSheet = file // 退货表
				} else if (file.name.indexOf('ExportOrderDetailList') > -1) {
					productSheet = file // 宝贝报表
				} else {
					console.log('wrong file')
				}
			}
		}

		if (!orderSheet || !productSheet || !returnSheet) {
			return
		}

		const p = [
			readFile(orderSheet, true),
			readFile(productSheet, true),
			readFile(returnSheet),
		]

		const skuSheet = JSON.parse(localStorage.getItem('sku'))

		Promise.all(p).then((values) => {
			setHasFiles(true)
			calc(values[0], values[1], values[2], skuSheet)
		})
	}

	function readFile(file, isCsv = false) {
		return new Promise(resolve => {
			const reader = new FileReader()
			reader.addEventListener('load', (e) => {
				let binary = ''
				// 读取成Uint8Array，再转换为Unicode编码（Unicode占两个字节）
				let bytes = new Uint8Array(e.target.result)
				var length = bytes.byteLength
				for (let i = 0; i < length; i++) {
					binary += String.fromCharCode(bytes[i])
				}
				const workbook = read(binary, isCsv ? { type: 'binary', codepage: 936 } : { type: 'binary' })
				const xlsxData = utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]])
				resolve(xlsxData)
			}, false)
			reader.readAsArrayBuffer(file)
		})
	}

	function calc(orderSheet, productSheet, returnSheet, skuSheet) {
		let sum = 0
		let succeed = 0
		let closed = 0
		let fake = 0
		let fakeSum = 0
		let fakeOrder = {}
		let incompleteSku = {}
		let missingSku = {}
		let totalCost = 0
		let products = {}
		let unpaidOrder = {}
		let paidAndCancelled = {}
		let validOrder = {}
		let orderDetail = {}
		let returnDetail = {}

		/* 
			处理订单报表
			fakeOrder: 刷单
			unpaidOrder: 拍下未付款
			paidAndCancelled: 付款未发货就取消订单
			validOrder: 正常付款发货订单
		*/
		for (let i = 0; i < orderSheet.length; i++) {
			const id = orderSheet[i]['订单编号']

			if (isFakeOrder(orderSheet[i]['商家备忘'])) {
				fakeOrder[id] = true
			} else {
				if (orderSheet[i]['订单关闭原因'] === '买家未付款') {
					unpaidOrder[id] = orderSheet[i]
				} else if (orderSheet[i]['发货时间'] === 'null') {
					paidAndCancelled[id] = orderSheet[i]
				} else {
					validOrder[id] = orderSheet[i]
				}
			}
		}

		/* 
			处理退货表
		*/
		for (let l = 0; l < returnSheet.length; l++) {
			const title = returnSheet[l]['宝贝标题']
			const id = returnSheet[l]['订单编号']
			if (returnDetail[id]) {
				returnDetail[id].push({
					payment: returnSheet[l]['买家实际支付金额'],
					title,
					return: returnSheet[l]['买家退款金额'],
					sku: title.slice(title.length - 5)
				})
			} else {
				returnDetail[id] = [{
					payment: returnSheet[l]['买家实际支付金额'],
					title,
					return: returnSheet[l]['买家退款金额'],
					sku: title.slice(title.length - 5)
				}]
			}
		}

		/* 
			处理 sku 表	
			products: sku 对应的价格和商品简称
			incompleteSku: sku 表中没有写价格或邮费
		*/
		for (let k = 0; k < skuSheet.length; k++) {
			const sku = String(skuSheet[k]['商品编码'])
			const cost = skuSheet[k]['进价']
			const shipping = skuSheet[k]['邮费']
			if (sku && sku !== 'undefined') {
				if (!isNaN(cost) && !isNaN(shipping)) {
					products[sku] = {
						cost: cost + shipping,
						title: skuSheet[k]['商品简称']
					}
				} else {
					incompleteSku[skuSheet[k]['商品简称']] = sku
				}
			}
		}

		/* 
			处理宝贝报表	
		*/
		for (let j = 0; j < productSheet.length; j++) {
			const id = productSheet[j]['主订单编号']
			let longSku = String(productSheet[j]['商家编码'])
			let sku = String(productSheet[j]['商家编码']).split('-')[0]
			const payment = Number(productSheet[j]['买家实际支付金额'])
			const title = productSheet[j]['标题']

			if (fakeOrder[id]) { // 刷单
				fakeSum = fakeSum + payment
				fake = fake + 1
			} else if (!paidAndCancelled[id]) {
				// 真实成交并且不是付款了未发货就退款的, 宝贝表里不包含未支付的宝贝所以不考虑未支付的情况
				if (longSku === 'null') {
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
						if (returnDetail[id] && returnDetail[id].find(o => o.sku === sku)) {
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
							} else { // sku 表里找不到该 sku
								if (missingSku[id]) {
									missingSku[id].push({ title, sku, reason: 'sku 表里找不到' })
								} else {
									missingSku[id] = [{ title, sku, reason: 'sku 表里找不到' }]
								}
							}
						}
					} else {
						closed = closed + 1
						orderDetail[sku].closed = orderDetail[sku].closed + 1
						orderDetail[sku].total = orderDetail[sku].total + 1
					}
				} else { // 没有sku的情况
					if (missingSku[id]) {
						missingSku[id].push({ title, sku, reason: '宝贝无 sku' })
					} else {
						missingSku[id] = [{ title, sku, reason: '宝贝无 sku' }]
					}
				}
			}
		}

		setOrderDetail(orderDetail)
		setUnpaidOrder(unpaidOrder)
		setPaidAndCancelled(paidAndCancelled)
		setValidOrder(validOrder)
		setSum(sum)
		setSucceed(succeed)
		setClosed(closed)
		setFake(fake)
		setFakeSum(fakeSum)
		setTotalCost(totalCost + Object.keys(returnDetail).length * RETURN_INSURANCE)
		setIncompleteSku(incompleteSku)
		setMissingSku(missingSku)
	}

	const fakeMark = {
		'1': true,
		'2': true,
		'微博': true,
		'豆瓣': true,
		'阳七': true,
		'彤彤啊': true,
		'闹闹': true,
		'竹哥儿': true,
		'司徒': true,
		'小红书': true,
	}

	function isFakeOrder(mark) {
		if (mark) {
			if (fakeMark[mark]) {
				return true
			}
		}

		return false
	}

	function buildResults() {
		if (!hasFiles) {
			return null
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
				<div className="excel-container-left-item excel-container-left-item-important">
					<p className="excel-container-left-item-title">刷单金额</p>
					<p className="excel-container-left-item-value">{fakeSum.toFixed(0)}</p>
				</div>
				<div className="excel-container-left-item excel-container-left-item-important">
					<p className="excel-container-left-item-title">真实成交金额</p>
					<p className="excel-container-left-item-value">{sum.toFixed(0)} </p>
				</div>
				{
					isLogin &&
					<>
						<div className="excel-container-left-item excel-container-left-item-important">
							<p className="excel-container-left-item-title">衣物成本 + 运费 + 运费险</p>
							<p className="excel-container-left-item-value">{totalCost.toFixed(0)}</p>
						</div>
						<div className="excel-container-left-item excel-container-left-item-important">
							<p className="excel-container-left-item-title">毛利</p>
							<p className="excel-container-left-item-value">{(sum - totalCost).toFixed(0)}</p>
						</div>
					</>
				}
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
					<p className="excel-container-left-item-title">无效订单</p>
					<p
						className={`excel-container-left-item-value${Object.keys(unpaidOrder).length > 0 ? ' excel-container-left-item-hover' : ''}`}
						onClick={() => {
							if (Object.keys({ ...unpaidOrder, ...paidAndCancelled }).length > 0) {
								setShowUnpaidOrder(true)
							}
						}}
					>拍下未支付: {Object.keys(unpaidOrder).length}, 仅退款: {Object.keys(paidAndCancelled).length}</p>
				</div>
				<div className="excel-container-left-item">
					<p className="excel-container-left-item-title">有效订单(含退货)</p>
					<p
						className={`excel-container-left-item-value${Object.keys(validOrder).length > 0 ? ' excel-container-left-item-hover' : ''}`}
						onClick={() => {
							if (Object.keys(validOrder).length > 0) {
								setShowValidOrder(true)
							}
						}}
					>{Object.keys(validOrder).length}</p>
				</div>
				<div className="excel-container-left-item">
					<p className="excel-container-left-item-title">sku 表里没有价格的 sku</p>
					<p
						className={`excel-container-left-item-value${Object.keys(incompleteSku).length > 0 ? ' excel-container-left-item-hover' : ''}`}
						onClick={() => {
							if (Object.keys(incompleteSku).length > 0) {
								setShowIncompleteSku(true)
							}
						}}
					>{Object.keys(incompleteSku).length}</p>
				</div>
				<div className="excel-container-left-item">
					<p className="excel-container-left-item-title">没有计算成本的宝贝</p>
					<p
						className={`excel-container-left-item-value${Object.keys(missingSku).length > 0 ? ' excel-container-left-item-hover' : ''}`}
						onClick={() => {
							if (Object.keys(missingSku).length > 0) {
								setShowMissingSku(true)
							}
						}}
					>{Object.keys(missingSku).length}</p>
				</div>
			</>
		)
	}

	useEffect(() => {
		const hasSku = localStorage.getItem('update') ? localStorage.getItem('update') : ''
		setHasSku(hasSku)
	}, [hasSku])

	function download() {
		const defaultSheet = [
			{
				'刷单金额': fakeSum.toFixed(0),
				'真实成交金额': sum.toFixed(0),
				'衣物成本+运费+运费险': totalCost.toFixed(0),
				'毛利': (sum - totalCost).toFixed(0),
				'退货率': returnRatio,
				'拍下未支付': Object.keys(unpaidOrder).length,
				'仅退款': Object.keys(paidAndCancelled).length,
				'有效订单(含退货)': Object.keys(validOrder).length
			},
		]

		const returnRatioSheet = []
		for (const key in orderDetail) {
			returnRatioSheet.push({
				'sku': key,
				'宝贝': orderDetail[key].title,
				'净销量': orderDetail[key].succeed,
				'退货量': orderDetail[key].closed,
				'退货率': `${(orderDetail[key].closed / orderDetail[key].total * 100).toFixed(2)}%`,
			})
		}

		const keys = Object.keys(missingSku)
		let products = {}
		keys.forEach((key) => {
			missingSku[key].forEach((item) => {
				if (products[item.title]) {
					products[item.title].number = products[item.title].number + 1
				} else {
					products[item.title] = { sku: item.sku, number: 1, reason: item.reason }
				}
			})
		})
		const missingSheet = []
		for (const key in products) {
			missingSheet.push({
				'宝贝': key,
				'数量': products[key].number,
				'原因': products[key].reason,
				'sku': products[key].sku,
			})
		}


		const ws1 = utils.json_to_sheet(defaultSheet)
		const ws2 = utils.json_to_sheet(returnRatioSheet)
		const ws3 = utils.json_to_sheet(missingSheet)
		const wb = utils.book_new()
		utils.book_append_sheet(wb, ws1, '毛利')
		utils.book_append_sheet(wb, ws2, '退货率')
		utils.book_append_sheet(wb, ws3, '没有计算成本')
		writeFile(wb, '结算.xlsx')
	}

	const { isLogin } = user
	const returnRatio = `${(closed / (succeed + closed) * 100).toFixed(2)}%`
	return (
		<div className="excel">
			<Header />
			<Container>
				{showReturnRatio && <ReturnRatio list={orderDetail} close={() => setShowReturnRatio(false)} />}
				{showIncompleteSku && <IncompleteSku list={incompleteSku} close={() => setShowIncompleteSku(false)} />}
				{showMissingSku && <MissingSku list={missingSku} close={() => setShowMissingSku(false)} />}
				{showUnpaidOrder && <OrderInfo list={{ ...unpaidOrder, ...paidAndCancelled }} close={() => setShowUnpaidOrder(false)} />}
				{showValidOrder && <OrderInfo list={validOrder} close={() => setShowValidOrder(false)} />}
				<div className="excel-container">
					<div className="excel-container-left">
						{buildResults()}
					</div>
					<div className="excel-container-right">
						<div
							style={isSkuDropOver ? { backgroundColor: 'rgba(170, 172, 247,.8)', color: '#fff' } : {}}
							onDrop={(e) => skuDropHandler(e)}
							onDragOver={(e) => skuDragOverHandler(e)}
							onDragLeave={(e) => skuDragLeaveHandler(e)}
							className="excel-container-right-sku"
						>
							{
								hasSku ?
									<p>已读取 sku 表格，上次更新: {hasSku}</p> :
									<p>没有找到 sku 表格</p>
							}
							<p>将 sku 表拖入这里更新</p>
						</div>
						<div
							style={isTaobaoDropOver ? { backgroundColor: 'rgba(170, 172, 247,.8)', color: '#fff' } : {}}
							onDrop={(e) => taobaoDropHandler(e)}
							onDragOver={(e) => taobaoDragOverHandler(e)}
							onDragLeave={(e) => taobaoDragLeaveHandler(e)}
							className="excel-container-right-taobao"
						>
							<p>拖入淘宝下载的三个原始表格</p>
							<p>1. 订单报表</p>
							<p>2. 宝贝报表</p>
							<p>3. 退款表格</p>
						</div>
						{
							hasSku && hasFiles && user.isLogin &&
							<div className="excel-container-right-download" onClick={() => download()}>
								<p>下载表格</p>
							</div>
						}
					</div>
				</div>
			</Container>
		</div>
	)
}

export default Index