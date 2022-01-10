import './index.scss'
import React, {useState, useContext} from 'react'
import {
	Link,
} from 'react-router-dom'
import Login from './Login'
import { UserContext } from '../../context/user'

function Index() {
	const [showLogin, setShowLogin] = useState(false)
	const {user, setUser} = useContext(UserContext)
	const {isLogin, name} = user

	return (
		<div className="header">
			{showLogin && <Login close={() => setShowLogin(false)} />}
			<div className="header-logo">
				<Link to="/">PUZZLE</Link>
			</div>
			{
				isLogin ? 
					<p onClick={() => setUser({isLogin: false, n: ''})} className="header-login">{name}</p> : 
					<p onClick={() => setShowLogin(true)} className="header-login">登陆</p>
			}
		</div>
	)
}

export default Index
