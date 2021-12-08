import './index.scss'
import React from 'react'
import {
	Link,
	useMatch,
	useResolvedPath
} from 'react-router-dom'

function CustomLink({ children, to, ...props }) {
	let resolved = useResolvedPath(to)
	let match = useMatch({ path: resolved.pathname, end: true })

	return (
		<div>
			<Link
				style={ match ? { backgroundColor: 'rgba(170, 172, 247,.8)', color: '#fff'} : {backgroundColor: '#fff', color: '#000'}}
				to={to}
				{...props}
			>
				{children}
			</Link>
		</div>
	)
}

function Index() {
	return (
		<div className="nav">
			<CustomLink to="/merge" className="nav-item">合并图片</CustomLink>
			<CustomLink to="/crop" className="nav-item">裁切图片</CustomLink>
			<p>{new Date().getFullYear()} 金又北</p>
		</div>
	)
}

export default Index
