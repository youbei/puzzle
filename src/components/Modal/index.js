import './index.scss'
import React from 'react'

function Index(props) {
	const { close, style, children } = props
	return (
		<div className="modal">
			<div className="modal-overlay" onClick={() => close()}>
				<div className="modal-container" onClick={(e) => { e.stopPropagation() }} style={style}>
					{children}
				</div>
			</div>
		</div>
	)
}

export default Index
