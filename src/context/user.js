import React from 'react'

export const DefaultUser = {
	isLogin: true,
	name: 'jinyoubei',
	update: () => { },
}

export const UserContext = React.createContext(DefaultUser)