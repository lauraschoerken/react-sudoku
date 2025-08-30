import { useState } from 'react'

import HomeComponent from '../components/HomeComponent'

export const Home = () => {
	const title = 'Home'
	const [counter, setCounter] = useState<number>(1)
	const [name, setName] = useState<string>(`${title} ${counter}`)

	const changeCounter = (delta: number) => {
		setCounter((prev) => {
			const newValue = prev + delta
			setName(`${title} ${newValue}`)
			return newValue
		})
	}

	return <HomeComponent name={name} onChangeCounter={changeCounter} />
}
