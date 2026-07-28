import '../layout.scss'

import { useTranslation } from 'react-i18next'
import { Link, NavLink } from 'react-router-dom'

import LanguageSelect from '@/components/elements/Languague/LanguagueSelect'
import { ThemeToggle } from '@/components/elements/Theme/ThemeToggle'
import { useAppSelector } from '@/store/hooks'
import { APP_NAME } from '@/utils/constants'

export const Header = () => {
	const active = 'link-active'
	const { t } = useTranslation(['layout', 'common'])
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
								{t('daily', { ns: 'common' })}
							</NavLink>
							<NavLink to='/dashboard' className={({ isActive }) => (isActive ? active : 'link')}>
								{t('stats', { ns: 'common' })}
							</NavLink>
							<details className='nav-more'>
								<summary className='btn'>{t('tools', { ns: 'common' })}</summary>
								<div className='nav-more__menu'>
									<NavLink to='/print' className={({ isActive }) => (isActive ? active : 'link')}>
										{t('print', { ns: 'common' })}
									</NavLink>
								</div>
							</details>
							<details className='user-menu'>
								<summary className='user-avatar' aria-label={t('account', { ns: 'common' })}>
									{user.avatar ?? user.username.slice(0, 1).toUpperCase()}
								</summary>
								<div className='user-menu__menu'>
									<NavLink to='/account' className={({ isActive }) => (isActive ? active : 'link')}>
										{t('account', { ns: 'common' })}
									</NavLink>
									<NavLink to='/settings' className={({ isActive }) => (isActive ? active : 'link')}>
										{t('settings', { ns: 'layout' })}
									</NavLink>
								</div>
							</details>
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
