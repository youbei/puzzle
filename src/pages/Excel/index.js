import './index.scss'
import React, { useState, useEffect, useContext } from 'react'
import Header from '../../components/Header'
import Container from '../../components/Container'
import MissingSku from './MissingSku'
import IncompleteSku from './IncompleteSku'
import ReturnRatio from './ReturnRatio'
import OrderInfo from './OrderInfo'
import XLSX from 'xlsx'
import { UserContext } from '../../context/user'

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
				if (file.name.indexOf('.xlsx') > -1) {
					orderSheet = file
				} else if (file.name.indexOf('.xls') > -1) {
					returnSheet = file
				} else if (file.name.indexOf('.csv') > -1) {
					productSheet = file
				} else {
					console.log('wrong file')
				}
			}
		}

		if (!orderSheet || !productSheet || !returnSheet) {
			return
		}

		const p = [
			readFile(orderSheet),
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
				// ?????????Uint8Array???????????????Unicode?????????Unicode??????????????????
				let bytes = new Uint8Array(e.target.result)
				var length = bytes.byteLength
				for (let i = 0; i < length; i++) {
					binary += String.fromCharCode(bytes[i])
				}
				const workbook = XLSX.read(binary, isCsv ? { type: 'binary', codepage: 936 } : { type: 'binary' })
				const xlsxData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]])
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

		for (let i = 0; i < orderSheet.length; i++) {
			const id = orderSheet[i]['????????????']

			if (isFakeOrder(orderSheet[i]['????????????'])) {
				fakeOrder[id] = true
			} else {
				if (orderSheet[i]['??????????????????'] === '???????????????') {
					unpaidOrder[id] = orderSheet[i]
				} else if (orderSheet[i]['????????????'] === 'null') {
					paidAndCancelled[id] = orderSheet[i]
				} else {
					validOrder[id] = orderSheet[i]
				}
			}
		}

		for (let l = 0; l < returnSheet.length; l++) {
			const title = returnSheet[l]['????????????']
			returnDetail[returnSheet[l]['????????????']] = {
				payment: returnSheet[l]['????????????????????????'],
				title,
				return: returnSheet[l]['??????????????????'],
				sku: title.slice(title.length - 5)
			}
		}

		for (let k = 0; k < skuSheet.length; k++) {
			const sku = String(skuSheet[k]['????????????'])
			const cost = skuSheet[k]['??????']
			const shipping = skuSheet[k]['??????']
			if (sku && sku !== 'undefined') {
				if (!isNaN(cost) && !isNaN(shipping)) {
					products[sku] = {
						cost: cost + shipping,
						title: skuSheet[k]['????????????']
					}
				} else {
					incompleteSku[skuSheet[k]['????????????']] = sku
				}
			}
		}

		for (let j = 0; j < productSheet.length; j++) {
			const id = productSheet[j]['???????????????']
			let longSku = String(productSheet[j]['????????????'])
			let sku = String(productSheet[j]['????????????']).split('-')[0]
			const payment = Number(productSheet[j]['????????????????????????'])
			const title = productSheet[j]['??????']

			if (fakeOrder[id]) { // ??????
				fakeSum = fakeSum + payment
				fake = fake + 1
			} else if (!paidAndCancelled[id]) {
				// ??????????????????????????????????????????????????????, ????????????????????????????????????????????????????????????????????????
				if (longSku === 'null') {
					const s = title.slice(title.length - 5)
					if (isNaN(Number(s))) { // ???????????????sku
						sku = null
					} else { // ???????????????????????????sku
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

					if (productSheet[j]['????????????'] === '????????????') {
						// ??????????????????????????????
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
							// ????????????
							sum = sum + payment

							// ??????????????????
							succeed = succeed + 1
							orderDetail[sku].succeed = orderDetail[sku].succeed + 1
							orderDetail[sku].total = orderDetail[sku].total + 1

							// ????????????
							if (products[sku]) {
								totalCost = totalCost + products[sku].cost
							} else if (products[longSku]) {
								totalCost = totalCost + products[longSku].cost
							} else { // sku ?????????????????? sku
								if (missingSku[id]) {
									missingSku[id].push({ title, sku, reason: 'sku ???????????????' })
								} else {
									missingSku[id] = [{ title, sku, reason: 'sku ???????????????' }]
								}
							}
						}
					} else {
						closed = closed + 1
						orderDetail[sku].closed = orderDetail[sku].closed + 1
						orderDetail[sku].total = orderDetail[sku].total + 1
					}
				} else { // ??????sku?????????
					if (missingSku[id]) {
						missingSku[id].push({ title, sku, reason: '????????? sku' })
					} else {
						missingSku[id] = [{ title, sku, reason: '????????? sku' }]
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
		setTotalCost(totalCost)
		setIncompleteSku(incompleteSku)
		setMissingSku(missingSku)
	}

	function isFakeOrder(mark) {
		if (mark) {
			if (mark === '1' || mark === '2' || mark.indexOf('??????') > -1) {
				return true
			}
		}

		return false
	}

	function buildResults() {
		if (!hasFiles) {
			return null
		}

		const returnRatio = `${(closed / (succeed + closed) * 100).toFixed(2)}%`

		const { isLogin } = user

		return (
			<>
				<div className="excel-container-left-item">
					<p className="excel-container-left-item-title">??????????????????</p>
					<p className="excel-container-left-item-value">{succeed}</p>
				</div>
				<div className="excel-container-left-item">
					<p className="excel-container-left-item-title">??????????????????</p>
					<p className="excel-container-left-item-value">{closed}</p>
				</div>
				<div className="excel-container-left-item">
					<p className="excel-container-left-item-title">??????????????????</p>
					<p className="excel-container-left-item-value">{fake}</p>
				</div>
				<div className="excel-container-left-item excel-container-left-item-important">
					<p className="excel-container-left-item-title">????????????</p>
					<p className="excel-container-left-item-value">{fakeSum.toFixed(0)}</p>
				</div>
				<div className="excel-container-left-item excel-container-left-item-important">
					<p className="excel-container-left-item-title">??????????????????</p>
					<p className="excel-container-left-item-value">{sum.toFixed(0)} </p>
				</div>
				{
					isLogin &&
					<>
						<div className="excel-container-left-item excel-container-left-item-important">
							<p className="excel-container-left-item-title">???????????? + ??????</p>
							<p className="excel-container-left-item-value">{totalCost.toFixed(0)}</p>
						</div>
						<div className="excel-container-left-item excel-container-left-item-important">
							<p className="excel-container-left-item-title">??????</p>
							<p className="excel-container-left-item-value">{(sum - totalCost).toFixed(0)}</p>
						</div>
					</>
				}
				<div className="excel-container-left-item">
					<p className="excel-container-left-item-title">?????????</p>
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
					<p className="excel-container-left-item-title">????????????</p>
					<p
						className={`excel-container-left-item-value${Object.keys(unpaidOrder).length > 0 ? ' excel-container-left-item-hover' : ''}`}
						onClick={() => {
							if (Object.keys({ ...unpaidOrder, ...paidAndCancelled }).length > 0) {
								setShowUnpaidOrder(true)
							}
						}}
					>???????????????: {Object.keys(unpaidOrder).length}, ?????????: {Object.keys(paidAndCancelled).length}</p>
				</div>
				<div className="excel-container-left-item">
					<p className="excel-container-left-item-title">????????????(?????????)</p>
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
					<p className="excel-container-left-item-title">sku ????????????????????? sku</p>
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
					<p className="excel-container-left-item-title">???????????????????????????</p>
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
									<p>????????? sku ?????????????????????: {hasSku}</p> :
									<p>???????????? sku ??????</p>
							}
							<p>??? sku ?????????????????????</p>
						</div>
						<div
							style={isTaobaoDropOver ? { backgroundColor: 'rgba(170, 172, 247,.8)', color: '#fff' } : {}}
							onDrop={(e) => taobaoDropHandler(e)}
							onDragOver={(e) => taobaoDragOverHandler(e)}
							onDragLeave={(e) => taobaoDragLeaveHandler(e)}
							className="excel-container-right-taobao"
						>
							<p>???????????????????????????????????????</p>
							<p>1. ??????????????????????????????</p>
							<p>2. ????????????</p>
							<p>3. ????????????</p>
						</div>
					</div>
				</div>
			</Container>
		</div>
	)
}

export default Index