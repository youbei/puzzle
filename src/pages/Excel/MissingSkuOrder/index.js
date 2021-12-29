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
					keys.map((order, index) =>
						<div key={index} className="missing-sku-order-item">
							{
								list[order].map((item, index) =>
									<div className="missing-sku-order-subitem" key={index}>
										<div className="missing-sku-order-item-left">
											{
												index === 0 &&
												<p>{order}</p>
											}
										</div>
										<div className="missing-sku-order-item-right">
											<p>{item}</p>
										</div>
									</div>
								)
							}
						</div>
					)
				}
			</div>
		</Modal>
	)
}

export default Index


