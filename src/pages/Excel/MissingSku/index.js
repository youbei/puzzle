import React from 'react'
import Modal from '../../../components/Modal'
import './index.scss'

function Index(props) {
	const { close, list } = props
	const keys = Object.keys(list)
	let products = {}

	keys.forEach((key) => {
		list[key].forEach((item) => {
			if (products[item.title]) {
				products[item.title].number = products[item.title].number + 1
			} else {
				products[item.title] = { sku: item.sku, number: 1, reason: item.reason }
			}
		})
	})

	const productsKeys = Object.keys(products)

	return (
		<Modal close={close} style={{ width: '920px', height: productsKeys.length >= 10 ? '602px' : `${productsKeys.length * 60 + 62}px` }}>
			<div className="missing-sku">
				<div className="missing-sku-item missing-sku-item-black">
					<div className="missing-sku-item-col-0 missing-sku-item-white-line">
						<p>宝贝名称</p>
					</div>
					<div className="missing-sku-item-col-1 missing-sku-item-white-line">
						<p>sku</p>
					</div>
					<div className="missing-sku-item-col-2 missing-sku-item-white-line">
						<p>数量</p>
					</div>
					<div className="missing-sku-item-col-3">
						<p>原因</p>
					</div>
				</div>
				{
					productsKeys.map((item, index) =>
						<div key={index} className="missing-sku-item">
							<div className="missing-sku-item-col-0 missing-sku-item-black-line">
								<p>{item}</p>
							</div>
							<div className="missing-sku-item-col-1 missing-sku-item-black-line">
								<p>{products[item].sku}</p>
							</div>
							<div className="missing-sku-item-col-2 missing-sku-item-black-line">
								<p>{products[item].number}</p>
							</div>
							<div className="missing-sku-item-col-3">
								<p>{products[item].reason}</p>
							</div>
						</div>
					)
				}
			</div>
		</Modal>
	)
}

export default Index


