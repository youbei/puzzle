import React from 'react'
import Modal from '../../../components/Modal'
import './index.scss'

function Index(props) {
	const { close, list } = props
	const keys = Object.keys(list)
	return (
		<Modal close={close} style={{ width: '820px', height: keys.length >= 10 ? '602px' : `${keys.length * 60 + 2}px` }}>
			<div className="missing-sku-order">
				<div className="missing-sku-order-item">
					<div className="missing-sku-order-item-col black">
						<p>买家会员名</p>
					</div>
					<div className="missing-sku-order-item-col black">
						<p>收货人姓名</p>
					</div>
					<div className="missing-sku-order-item-col black">
						<p>联系手机</p>
					</div>
				</div>
				{
					keys.map((item, index) =>
						<div key={index} className="missing-sku-order-item">
							<div className="missing-sku-order-item-col">
								<p>{list[item]['买家会员名']}</p>
							</div>
							<div className="missing-sku-order-item-col">
								<p>{list[item]['收货人姓名']}</p>
							</div>
							<div className="missing-sku-order-item-col">
								<p>{list[item]['联系手机']}</p>
							</div>
						</div>
					)
				}
			</div>
		</Modal>
	)
}

export default Index


