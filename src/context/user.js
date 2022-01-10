import React from 'react'

export const DefaultUser = {
	isLogin: false, 
	name: '',
	update: () => {},
}

export const UserContext = React.createContext(DefaultUser)