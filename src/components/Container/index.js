import './index.scss'
import React from 'react'
import Nav from '../Nav'

function Index(props) {
	return (
		<div className="container">
			<Nav />
			{props.children}
		</div>
	) 
}

export default Index
