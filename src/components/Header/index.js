import './index.scss'
import React from 'react'
import {
	Link,
} from 'react-router-dom'

function Index() {
	return (
		<div className="header">
			<div className="header-logo">
				<Link to="/">PUZZLE</Link>
			</div>
		</div>
	)
}

export default Index
