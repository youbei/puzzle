import React from 'react'
import Modal from '../../../components/Modal'
import './index.scss'

function Index(props) {
	const { close, list } = props
	const keys = Object.keys(list)
	const names = keys.map((item) => list[item]['买家会员名']).join(',')
	const mobiles = keys.map((item) => list[item]['联系手机'].slice(1)).join(',')

	function select(e) {
		e.target.select()
	}

	return (
		<Modal close={close} style={{ width: '820px', height: '602px'}}>
			<div className="missing-sku-order">
				<div className="missing-sku-order-title">
					<p className="missing-sku-order-title-left">买家会员名</p>
					<p className="missing-sku-order-title-right">联系手机</p>
				</div>
				<div className="missing-sku-order-content">
					<div className="missing-sku-order-content-left">
						<textarea readOnly value={names} onClick={(e) => select(e)}></textarea>
					</div>
					<div className="missing-sku-order-content-right">
						<textarea readOnly value={mobiles} onClick={(e) => select(e)}></textarea>
					</div>
				</div>
			</div>
		</Modal>
	)
}

export default Index


