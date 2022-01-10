import React, {useState, useMemo} from 'react'
import './index.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MergeImages from './pages/MergeImages'
import CropImages from './pages/CropImages'
import Excel from './pages/Excel'
import Home from './pages/Home'
import { UserContext, DefaultUser } from './context/user'

function Index() {
	const [user, setUser] = useState(DefaultUser)
	const value = useMemo(
		() => ({ user, setUser }), 
		[user]
	)

	return (
		<UserContext.Provider value={value}>
			<BrowserRouter>
				<Routes>
					<Route path="/">
						<Route index element={<Home />} />
						<Route path="/merge" element={<MergeImages />} />
						<Route path="/crop" element={<CropImages />} />
						<Route path="/excel" element={<Excel />} />
					</Route>
				</Routes>
			</BrowserRouter>
		</UserContext.Provider>
	)
}

export default Index
