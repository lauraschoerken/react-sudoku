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

					{user ? (
						<>
							<NavLink to='/daily' className={({ isActive }) => (isActive ? active : 'link')}>
								Diario
							</NavLink>
							<NavLink to='/dashboard' className={({ isActive }) => (isActive ? active : 'link')}>
								Stats
							</NavLink>
							<NavLink to='/settings' className={({ isActive }) => (isActive ? active : 'link')}>
								{t('settings')}
							</NavLink>
							<details className='nav-more'>
								<summary className='btn'>Herramientas</summary>
								<div className='nav-more__menu'>
									<NavLink to='/print' className={({ isActive }) => (isActive ? active : 'link')}>
										Imprimir
									</NavLink>
								</div>
							</details>
							<NavLink
								to='/account'
								className={({ isActive }) =>
									isActive ? `${active} user-avatar` : 'link user-avatar'
								}>
								{user.avatar ?? user.username.slice(0, 1).toUpperCase()}
							</NavLink>
						</>
					) : (
						<NavLink
							to='/account'
							className={({ isActive }) => (isActive ? active : 'link btn primary btn--sm')}>
							Iniciar sesión
						</NavLink>
					)}

					<ThemeToggle />
					<LanguageSelect />
				</nav>
			</div>
		</header>
	)
}
