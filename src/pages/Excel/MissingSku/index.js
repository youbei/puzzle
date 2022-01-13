import React from 'react'
import Modal from '../../../components/Modal'
import './index.scss'

function Index(props) {
	const { close, list } = props
	console.log(list)
	const keys = Object.keys(list)
	let products = {}

	keys.forEach((key) => {
		list[key].forEach((item) => {
			if (products[item]) {
				products[item] = products[item] + 1
			} else {
				products[item] = 1
			}
		})
	})

	const productsKeys = Object.keys(products)

	return (
		<Modal close={close} style={{ width: '820px', height: productsKeys.length >= 10 ? '602px' : `${productsKeys.length * 60 + 62}px` }}>
			<div className="missing-sku">
				<div className="missing-sku-item missing-sku-item-black">
					<div className="missing-sku-item-col-0">
						<p>宝贝名称</p>
					</div>
					<div className="missing-sku-item-col-1">
						<p>sku</p>
					</div>
					<div className="missing-sku-item-col-2">
						<p>数量</p>
					</div>
				</div>
				{
					productsKeys.map((item, index) =>
						<div key={index} className="missing-sku-item">
							<div className="missing-sku-item-col-0">
								<p>{item}</p>
							</div>
							<div className="missing-sku-item-col-1">
								<p>sku</p>
							</div>
							<div className="missing-sku-item-col-2">
								<p>{products[item]}</p>
							</div>
						</div>
					)
				}
			</div>
		</Modal>
	)
}

export default Index


