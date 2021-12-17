import './index.scss'
import React , {useState}from 'react'
import Header from '../../components/Header'
import Container from '../../components/Container'
import XLSX from 'xlsx'

function Index() {
	const [isDropOver, setIsDropOver] = useState(false)
	const [sum, setSum] = useState(0)
	const [succeed, setSucceed] = useState(0)
	const [closed, setClosed] = useState(0)
	const [fake, setFake] = useState(0)
	const [fakeSum, setFakeSum] = useState(0)
	const [totalCost, setTotalCost] = useState(0)

	function dropHandler(e) {
		e.preventDefault()
		setIsDropOver(false)

		if(e.dataTransfer.items.length !== 3) {
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
					} else if (file.name === 'order.xlsx'){
						order = file
					} else if (file.name === 'product.xlsx')  {
						product = file
					}
				}
			}
		}

		if(!sku || !order || !product) {
			return
		}

		const p = [
			readFile(sku),
			readFile(order),
			readFile(product),
		]

		Promise.all(p).then((values) => {
			calc(values[0], values[1], values[2])
		})
	}

	function readFile(file) {
		return new Promise(resolve => {
			const reader = new FileReader()
			reader.addEventListener('load', (e) => {
				const workbook = XLSX.read(new Uint8Array(e.target.result), {type: 'array'})
				const xlsxData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]])
				resolve(xlsxData)
			}, false)
			reader.readAsArrayBuffer(file)
		})
	}

	function calc(sku, order, product) {
		if (order.length > 0) {
			let sum = 0
			let succeed = 0
			let closed = 0
			let fake = 0
			let fakeSum = 0
			let error = {}
			let missingSku = {} 
			let validOrder = {} 
			let totalCost = 0
			let s = {} 

			for (let i = 0; i < order.length; i++) { 
				if (order[i]['订单状态'] === '交易成功') {
					if (isFakeOrder(order[i]['商家备忘'])) {
						fakeSum = fakeSum + Number(order[i]['买家实际支付金额'])
						fake = fake + 1 
					} else { // 成功订单
						validOrder[order[i]['订单编号']] = true  
						sum = sum + Number(order[i]['买家实际支付金额'])
						succeed = succeed + 1 
					}
				} else {
					closed = closed + 1 
				}
			}

			for (let k = 0; k < sku.length; k++) { 
				const sskkuu = String(sku[k]['商品编码'])
				if (sskkuu !== 'undefined') {
					const cost = sku[k]['进价'] 
					const shipping = sku[k]['运费'] || 7
					if(cost) {
						s[sskkuu] = cost + shipping 
					} else {
						missingSku[sskkuu] = true
					}
				}
			}

			for (let j = 0; j < product.length; j++) { 
				const id = product[j]['主订单编号']
				// 确认为真实且成功的订单
				if (validOrder[id]) {
					let sku = String(product[j]['商家编码'])
					if (sku === 'null') {
						error[id] = true
					} else {
						sku = sku.split('-')[0]
						if(s[sku]) {
							totalCost = totalCost + s[sku]
						} else {
							missingSku[sku] = true
						}
					}
				}
			}
			console.log(missingSku)
			console.log(error)

			setSum(sum)
			setSucceed(succeed)
			setClosed(closed)
			setFake(fake)
			setFakeSum(fakeSum)
			setTotalCost(totalCost)
		}
	}

	function isFakeOrder(mark) {
		if (mark) {
			if(mark === '1' || mark === '2' || mark.indexOf('微博') > -1) {
				return true
			}
		}

		return false
	}

	return (
		<div className="excel">
			<Header />
			<Container>
				<div className="excel-container">
					<div className="excel-container-left">
						<div className="excel-container-left-item">
							<p className="excel-container-left-item-title">真实成交金额</p>
							<p className="excel-container-left-item-value">{sum.toFixed(2)} </p>
						</div>
						<div className="excel-container-left-item">
							<p className="excel-container-left-item-title">订单成交数量</p>
							<p className="excel-container-left-item-value">{succeed}</p>
						</div>
						<div className="excel-container-left-item">
							<p className="excel-container-left-item-title">订单关闭数量</p>
							<p className="excel-container-left-item-value">{closed}</p>
						</div>
						<div className="excel-container-left-item">
							<p className="excel-container-left-item-title">刷单数量</p>
							<p className="excel-container-left-item-value">{fake}</p>
						</div>
						<div className="excel-container-left-item">
							<p className="excel-container-left-item-title">刷单金额</p>
							<p className="excel-container-left-item-value">{fakeSum}</p>
						</div>
						<div className="excel-container-left-item">
							<p className="excel-container-left-item-title">衣物成本 + 运费</p>
							<p className="excel-container-left-item-value">{totalCost.toFixed(2)}</p>
						</div>
					</div>
					<div className="excel-container-right">
						<div 
							style={isDropOver ? { backgroundColor: 'rgba(170, 172, 247,.8)', color: '#fff'} : {}}
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