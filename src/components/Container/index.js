import './index.scss'
import React from 'react'
import Nav from '../Nav'

class Index extends React.Component {
	render() {
		return (
			<div className="container">
				<Nav />
				{this.props.children}
			</div>
		) 
	}
}

export default Index
