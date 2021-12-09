import './index.scss'
import React from 'react'
import Header from '../../components/Header'
import Container from '../../components/Container'

const TOTAL_WIDTH = 750
const COLUMN = 3 

class Index extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			isDropOver: false, 
			totalWidth: TOTAL_WIDTH,
			column: COLUMN
		}
	}

	dropHandler(e) {
		e.preventDefault()
		this.setState({isDropOver: false})

		const {totalWidth, column} = this.state
		if(Number(totalWidth) < 1 || Number(totalWidth) > 9999 || Number(column) < 1 || Number(column) > 9) {
			this.reset()
			return
		}

		this.removeCanvas()

		const imageList = []
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
						imageList.push(img)
						if (i === length -1) {
							const minWidth = imageList.reduce((prev, current) => (prev.width < current.width) ? prev : current)
							const minHeight = imageList.reduce((prev, current) => (prev.height < current.height) ? prev : current)
							this.merge(imageList, minWidth.width, minHeight.height)
						}
					}
				}, false)
			}
		}
	}

	merge(imageList, width, height) {
		const {totalWidth, column} = this.state
		const canvas = document.getElementById('canvas')
		const context = canvas.getContext('2d')
		const adjustedWidth = totalWidth / column
		const adjustedHeight = adjustedWidth * height / width 
		const row = Math.ceil(imageList.length / column)
		canvas.width = totalWidth 
		canvas.height = adjustedHeight * row

		imageList.forEach((item, i) => {
			console.log(i)
			context.drawImage(
				item, 
				0, // x轴，从左侧多少像素开始裁切图片 
				0, // y轴，从顶部多少像素开始裁切图片 
				width, // 裁切的图片的宽度 
				height, // 裁切图片的高度 
				i % column * adjustedWidth, // x轴，当前图片离左侧多少像素
				Math.floor(i / column) * adjustedHeight, // y轴，当前图片离顶部多少像素
				adjustedWidth, // 图片宽度缩小至多少像素 
				adjustedHeight // 图片高度缩小至多少像素
			)
		})
	}

	reset() {
		this.removeCanvas()
		this.setState({totalWidth: TOTAL_WIDTH, column: COLUMN})
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
		const {isDropOver, totalWidth, column} =this.state
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
										min='1'
										max='9999'
										value={totalWidth}
										onChange={(e) => {this.setState({totalWidth: e.target.value})}}
									/>
								</div>
								<div className="merge-images-container-right-top-item">
									<p>每行个数</p>
									<input 
										type='number'
										min='1'
										max='9'
										value={column}
										onChange={(e) => {this.setState({column: e.target.value})}}
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
