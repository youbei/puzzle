import './index.scss'
import React, {useState, useContext} from 'react'
import Modal from '../../Modal'
import { UserContext } from '../../../context/user'

function Index(props) {
	const { close } = props
	const [n, setN] = useState('')
	const [p, setP] = useState('')

	function login(e) {
		e.preventDefault()
		e.stopPropagation()

		if (n === 'jinyoubei' && p === 'aaabbbcccddd') {
			setUser({isLogin: true, name: n})
			close()
		}
	}

	const {setUser} = useContext(UserContext)

	return (
		<Modal close={close} style={{ width: '420px', height: '180px'}}>
			<form className="login" onSubmit={(e) => login(e)}>
				<input 
					placeholder="用户名"
					type='text'
					value={n}
					onChange={(e) => setN(e.target.value)}
				/>
				<input 
					placeholder="密码"
					type='password'
					value={p}
					onChange={(e) => setP(e.target.value)}
				/>
				<input className='submit' type="submit"></input>
			</form>
		</Modal>
	)
}

export default Index
