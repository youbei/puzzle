import './index.scss'
import React, {useState, useEffect} from 'react'
import Header from '../../components/Header'
import Container from '../../components/Container'

const TOTAL_WIDTH = 750
const COLUMN = 3 
const PADDING = 10 
let imageList = [] 

function Index() {
	const [isDropOver, setIsDropOver] = useState(false)
	const [totalWidth, setTotalWidth] = useState(TOTAL_WIDTH)
	const [column, setColumn] = useState(COLUMN)
	const [padding, setPadding] = useState(PADDING)
	useEffect(() => merge(), [totalWidth, column, padding])

	function dropHandler(e) {
		e.preventDefault()
		setIsDropOver(false)
		imageList = [] 
		let p = []

		if(!validate()) {
			reset()
			return
		}

		removeCanvas()

		for (let i = 0; i < e.dataTransfer.items.length; i++) {
			if (e.dataTransfer.items[i].kind === 'file' && e.dataTransfer.items[i].type.match('^image/')) {
				const file = e.dataTransfer.items[i].getAsFile()
				p.push(processImages(file))
			}
		}

		Promise.all(p).then((list) => {
			imageList = list 
			merge()
		})
	}

	function processImages(file) {
		return new Promise(resolve => {
			const reader = new FileReader()
			reader.addEventListener('load', () => {
				const img = new Image()
				img.src = reader.result
				img.addEventListener('load', () => {
					resolve(img)
				})
			}, false)
			reader.readAsDataURL(file)
		})
	}

	function merge() {
		console.log(imageList)
		if (imageList.length === 0) {
			return
		}

		if (!validate()) {
			return
		}

		const tw = Number(totalWidth)
		const c = Number(column)
		const p = Number(padding)

		// 找出所有图片中的最小宽度和高度
		const width = imageList.reduce((prev, current) => (prev.width < current.width) ? prev : current).width
		const height = imageList.reduce((prev, current) => (prev.height < current.height) ? prev : current).height

		// 计算有多少行
		const row = Math.ceil(imageList.length / c)

		// 调整后的图片尺寸
		const adjustedWidth = (tw - (c - 1) * p) / c
		const adjustedHeight = adjustedWidth * height / width 

		const canvas = document.getElementById('canvas')
		const context = canvas.getContext('2d')
		canvas.width = tw
		canvas.height = adjustedHeight * row + p * (row - 1)

		imageList.forEach((item, i) => {
			context.drawImage(
				item, 
				0, // x轴，从左侧多少像素开始裁切图片 
				0, // y轴，从顶部多少像素开始裁切图片 
				width, // 裁切的图片的宽度 
				height, // 裁切图片的高度 
				i % c * (adjustedWidth + p), // x轴，当前图片离左侧多少像素
				Math.floor(i / c) * (adjustedHeight + p), // y轴，当前图片离顶部多少像素
				adjustedWidth, // 图片宽度缩小至多少像素 
				adjustedHeight // 图片高度缩小至多少像素
			)
		})
	}

	function validate() {
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

	function reset() {
		setTotalWidth(TOTAL_WIDTH)
		setColumn(COLUMN)
		setPadding(PADDING)
	}

	function removeCanvas() {
		const canvas = document.getElementById('canvas')
		const context = canvas.getContext('2d')
		context.clearRect(0, 0, canvas.width, canvas.height)
	}

	function dragOverHandler(e) {
		setIsDropOver(true)
		e.preventDefault()
	}

	function dragLeaveHandler(e) {
		setIsDropOver(false)
		e.preventDefault()
	}

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
									onChange={(e) => setTotalWidth(e.target.value) }
								/>
							</div>
							<div className="merge-images-container-right-top-item">
								<p>每行个数</p>
								<input 
									type='number'
									value={column}
									onChange={(e) => setColumn(e.target.value)}
								/>
							</div>
							<div className="merge-images-container-right-top-item">
								<p>图片间隔</p>
								<input 
									type='number'
									value={padding}
									onChange={(e) => setPadding(e.target.value)}
								/>
							</div>
							<button 
								onClick={() => reset()}
								className="merge-images-container-right-top-item"
							>重置</button>
						</div>
						<div 
							className="merge-images-container-right-bottom"
							style={isDropOver ? { backgroundColor: 'rgba(170, 172, 247,.8)', color: '#fff'} : {}}
							onDrop={(e) => dropHandler(e)} 
							onDragOver={(e) => dragOverHandler(e)}
							onDragLeave={(e) => dragLeaveHandler(e)}
						>
							<h1>把图片拖到这里</h1>
						</div>
					</div>
				</div>
			</Container>
		</div>
	)
}

export default Index
