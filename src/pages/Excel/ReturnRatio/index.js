import React from 'react'
import Modal from '../../../components/Modal'
import './index.scss'

function Index(props) {
	const { close, list } = props
	const sortByTotal = Object.entries(list).sort(([, a], [, b]) => b.total - a.total)

	return (
		<Modal close={close} style={{ width: '920px', height: '602px' }}>
			<div className="return">
				<div className="return-item">
					<div className="return-item-col-1 black white-line">
						<p>宝贝</p>
					</div>
					<div className="return-item-col-2 black white-line">
						<p>净销量</p>
					</div>
					<div className="return-item-col-3 black white-line">
						<p>退货量</p>
					</div>
					<div className="return-item-col-4 black">
						<p>退货率</p>
					</div>
				</div>
				{
					sortByTotal.map((item, index) =>
						<div key={index} className="return-item">
							<div className="return-item-col-1">
								<p>{item[1].title}</p>
							</div>
							<div className="return-item-col-2">
								<p>{item[1].succeed}</p>
							</div>
							<div className="return-item-col-3">
								<p>{item[1].closed}</p>
							</div>
							<div className="return-item-col-4">
								<p>{`${(item[1].closed / item[1].total * 100).toFixed(2)}%`}</p>
							</div>
						</div>
					)
				}
			</div>
		</Modal>
	)
}

export default Index


