import './index.scss'
import React from 'react'
import Header from '../../components/Header'
import Container from '../../components/Container'

const TOTAL_WIDTH = 750
const COLUMN = 3 
const PADDING = 10 

class Index extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			isDropOver: false, 
			totalWidth: TOTAL_WIDTH,
			column: COLUMN,
			padding: PADDING
		}
		this.imageList = []
	}

	dropHandler(e) {
		e.preventDefault()
		this.setState({isDropOver: false})
		this.imageList = []

		if(!this.validate()) {
			this.reset()
			return
		}

		this.removeCanvas()

		const length = e.dataTransfer.items.length
		for (let i = 0; i < length; i++) {
			if (e.dataTransfer.items[i].kind === 'file' && e.dataTransfer.items[i].type.match('^image/')) {
				const file = e.dataTransfer.items[i].getAsFile()
				const reader = new FileReader()
				reader.readAsDataURL(file)
				reader.addEventListener('load', () => {
					const img = new Image()
					img.src = reader.result
					img.onload = () => {
						this.imageList.push(img)
						if (i === length -1) {
							this.merge()
						}
					}
				}, false)
			}
		}
	}

	merge() {
		if (this.imageList.length === 0) {
			return
		}

		if (!this.validate()) {
			return
		}

		const totalWidth = Number(this.state.totalWidth)
		const column = Number(this.state.column)
		const padding = Number(this.state.padding)

		// 找出所有图片中的最小宽度和高度
		const width = this.imageList.reduce((prev, current) => (prev.width < current.width) ? prev : current).width
		const height = this.imageList.reduce((prev, current) => (prev.height < current.height) ? prev : current).height

		// 计算有多少行
		const row = Math.ceil(this.imageList.length / column)

		// 调整后的图片尺寸
		const adjustedWidth = (totalWidth - (column - 1) * padding) / column
		const adjustedHeight = adjustedWidth * height / width 

		const canvas = document.getElementById('canvas')
		const context = canvas.getContext('2d')
		canvas.width = totalWidth 
		canvas.height = adjustedHeight * row + padding * (row - 1)

		this.imageList.forEach((item, i) => {
			context.drawImage(
				item, 
				0, // x轴，从左侧多少像素开始裁切图片 
				0, // y轴，从顶部多少像素开始裁切图片 
				width, // 裁切的图片的宽度 
				height, // 裁切图片的高度 
				i % column * (adjustedWidth + padding), // x轴，当前图片离左侧多少像素
				Math.floor(i / column) * (adjustedHeight + padding), // y轴，当前图片离顶部多少像素
				adjustedWidth, // 图片宽度缩小至多少像素 
				adjustedHeight // 图片高度缩小至多少像素
			)
		})
	}

	validate() {
		const {totalWidth, column, padding} = this.state
		if(
			Number(totalWidth) < 1 
			|| Number(totalWidth) > 9999 
			|| Number(column) < 1 
			|| Number(column) > 9
			|| Number(padding) < 0
			|| Number(padding) > 20 
		) {
			return false
		}

		return true
	}

	reset() {
		this.setState({totalWidth: TOTAL_WIDTH, column: COLUMN, padding: PADDING}, () => this.merge())
	}

	removeCanvas() {
		const canvas = document.getElementById('canvas')
		const context = canvas.getContext('2d')
		context.clearRect(0, 0, canvas.width, canvas.height)
	}

	dragOverHandler(e) {
		this.setState({isDropOver: true})
		e.preventDefault()
	}

	dragLeaveHandler(e) {
		this.setState({isDropOver: false})
		e.preventDefault()
	}

	render() {
		const {isDropOver, totalWidth, column, padding} =this.state
		return (
			<div className="merge-images">
				<Header />
				<Container>
					<div className="merge-images-container">
						<div className="merge-images-container-left">
							<canvas id="canvas"></canvas>
						</div>
						<div className="merge-images-container-right">
							<div className="merge-images-container-right-top">
								<div className="merge-images-container-right-top-item">
									<p>图片宽度</p>
									<input 
										type='number'
										value={totalWidth}
										onChange={(e) => {this.setState({totalWidth: e.target.value}, () => this.merge())}}
									/>
								</div>
								<div className="merge-images-container-right-top-item">
									<p>每行个数</p>
									<input 
										type='number'
										value={column}
										onChange={(e) => {this.setState({column: e.target.value}, () => this.merge())}}
									/>
								</div>
								<div className="merge-images-container-right-top-item">
									<p>图片间隔</p>
									<input 
										type='number'
										value={padding}
										onChange={(e) => {this.setState({padding: e.target.value}, () => this.merge())}}
									/>
								</div>
								<button 
									onClick={() => this.reset()}
									className="merge-images-container-right-top-item"
								>重置</button>
							</div>
							<div 
								className="merge-images-container-right-bottom"
								style={isDropOver ? { backgroundColor: 'rgba(170, 172, 247,.8)', color: '#fff'} : {}}
								onDrop={(e) => this.dropHandler(e)} 
								onDragOver={(e) => this.dragOverHandler(e)}
								onDragLeave={(e) => this.dragLeaveHandler(e)}
							>
								<h1>把图片拖到这里</h1>
							</div>
						</div>
					</div>
				</Container>
			</div>
		)
	}
}

export default Index
