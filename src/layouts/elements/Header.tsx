import '../layout.scss'

import { useTranslation } from 'react-i18next'
import { Link, NavLink } from 'react-router-dom'

import LanguageSelect from '@/components/elements/Languague/LanguagueSelect'
import { ThemeToggle } from '@/components/elements/Theme/ThemeToggle'
import { useAppSelector } from '@/store/hooks'
import { APP_NAME } from '@/utils/constants'

export const Header = () => {
	const active = 'link-active'
	const { t } = useTranslation(['layout'])
	const user = useAppSelector((s) => s.auth.user)

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
					<NavLink to='/daily' className={({ isActive }) => (isActive ? active : 'link')}>
						Diario
					</NavLink>
					<NavLink to='/dashboard' className={({ isActive }) => (isActive ? active : 'link')}>
						Stats
					</NavLink>
					<NavLink to='/print' className={({ isActive }) => (isActive ? active : 'link')}>
						Imprimir
					</NavLink>
					<NavLink to='/settings' className={({ isActive }) => (isActive ? active : 'link')}>
						{t('settings')}
					</NavLink>
					<NavLink to='/account' className={({ isActive }) => (isActive ? active : 'link')}>
						{user?.username ?? 'Cuenta'}
					</NavLink>
					<ThemeToggle />
					<LanguageSelect />
				</nav>
			</div>
		</header>
	)
}
