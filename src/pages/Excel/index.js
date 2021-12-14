import './index.scss'
import React from 'react'
import Header from '../../components/Header'
import Container from '../../components/Container'
import XLSX from 'xlsx'

class Index extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			isDropOver: false,
			sum: 0,
			succeed: 0,
			closed: 0,
			fake: 0,
			fakeSum: 0
		}
	}

	dropHandler(e) {
		e.preventDefault()
		this.setState({isDropOver: false})

		if(e.dataTransfer.items.length !== 3) {
			return
		}

		this.readFiles(e.dataTransfer.items)
	}

	dragOverHandler(e) {
		this.setState({isDropOver: true})
		e.preventDefault()
	}

	dragLeaveHandler(e) {
		this.setState({isDropOver: false})
		e.preventDefault()
	}

	readFiles(files) {
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
			this.readFile(sku),
			this.readFile(order),
			this.readFile(product),
		]

		Promise.all(p).then((values) => {
			this.calc(values[0], values[1], values[2])
		})
	}

	readFile(file) {
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

	calc(sku, order, product) {
		console.log(sku)
		if (order.length > 0) {
			let sum = 0
			let succeed = 0
			let closed = 0
			let fake = 0
			let fakeSum = 0
			let o = {} 
			for (let i = 0; i < order.length; i++) { 
				if (order[i]['订单状态'] === '交易成功') {
					if (this.fake(order[i]['商家备忘'])) {
						fakeSum = fakeSum + Number(order[i]['买家实际支付金额'])
						fake = fake + 1 
					} else { // 成功订单
						o[order[i]['订单编号']] = [] 
						sum = sum + Number(order[i]['买家实际支付金额'])
						succeed = succeed + 1 
					}
				} else {
					closed = closed + 1 
				}
			}

			for (let j = 0; j < product.length; j++) { 
				console.log(product[j])
				// 确认为真实且成功的订单
				if (o[product[j]['主订单编号']]) {
					console.log(product[j]['商家编码'])
					o[product[j]['主订单编号']].push(product[j]['商家编码'])
				}
			}
			//console.log(o)


			this.setState({sum, succeed, closed, fake, fakeSum})
		}
	}

	fake(mark) {
		if (mark) {
			if(mark === '1' || mark === '2' || mark.indexOf('微博') > -1) {
				return true
			}
		}

		return false
	}

	render() {
		const { isDropOver, sum, succeed, closed, fake, fakeSum } = this.state
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
						</div>
						<div className="excel-container-right">
							{
								/*
							<label className="excel-container-right-upload">
								<input 
									onChange={(e) => this.readFile(e)}
									type="file"
									accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
								/>
							选择文件
							</label>
								*/
							}
							<div 
								style={isDropOver ? { backgroundColor: 'rgba(170, 172, 247,.8)', color: '#fff'} : {}}
								className="excel-container-right-upload"
								onDrop={(e) => this.dropHandler(e)} 
								onDragOver={(e) => this.dragOverHandler(e)}
								onDragLeave={(e) => this.dragLeaveHandler(e)}
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
}

export default Index