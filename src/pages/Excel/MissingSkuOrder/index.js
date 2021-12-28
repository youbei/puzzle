import React from 'react'
import Modal from '../../../components/Modal'
import './index.scss'

function Index(props) {
	const { close, list } = props
	const keys = Object.keys(list)
	return (
		<Modal close={close} style={{ width: '820px', height: keys.length >= 10 ? '602px' : `${keys.length * 60 + 2}px` }}>
			<div className="missing-sku-order">
				{
					keys.map((item, index) =>
						<div key={index} className="missing-sku-order-item">
							<div className="missing-sku-order-item-left">
								<p>{item}</p>
							</div>
							<div className="missing-sku-order-item-right">
								<p>{list[item]}</p>
							</div>
						</div>
					)
				}
			</div>
		</Modal>
	)
}

export default Index


