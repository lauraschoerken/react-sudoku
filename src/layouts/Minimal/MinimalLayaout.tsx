import '../layout.scss'

import { Outlet } from 'react-router-dom'

import { Footer } from '../elements/Footer'
import { Header } from './Header'

export const MinimalLayout = () => {
	return (
		<div className='main-layout'>
			<Header />
			<main className='main container'>
				<Outlet />
			</main>
			<Footer />
		</div>
	)
}
