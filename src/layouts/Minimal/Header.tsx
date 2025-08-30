import '../layout.scss'

import { useTranslation } from 'react-i18next'
import { Link, NavLink } from 'react-router-dom'

import { APP_NAME } from '@/utils/constants'

export const Header = () => {
	const active = 'link-active'
	const { t } = useTranslation()

	return (
		<header className='header'>
			<div className='container header__inner'>
				<Link to='/' className='link brand'>
					{APP_NAME}
				</Link>
				<nav className='nav'>
					<NavLink to='/' end className={({ isActive }) => (isActive ? active : 'link')}>
						{t('sudoku')}
					</NavLink>
					<NavLink to='/explication' className={({ isActive }) => (isActive ? active : 'link')}>
						{t('explication')}
					</NavLink>
				</nav>
			</div>
		</header>
	)
}
