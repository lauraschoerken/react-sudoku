import '../layout.scss'

import { useTranslation } from 'react-i18next'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'

import LanguageSelect from '@/components/elements/Languague/LanguagueSelect'
import { ThemeToggle } from '@/components/elements/Theme/ThemeToggle'
import { useAppSelector } from '@/store/hooks'
import { APP_NAME } from '@/utils/constants'

export const Header = () => {
	const active = 'link-active'
	const { t } = useTranslation(['layout', 'common'])
	const user = useAppSelector((s) => s.auth.user)
	const location = useLocation()
	const navRef = useRef<HTMLElement>(null)
	const [openMenu, setOpenMenu] = useState<'tools' | 'user' | null>(null)
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

	useEffect(() => {
		setOpenMenu(null)
		setMobileMenuOpen(false)
	}, [location.pathname])

	useEffect(() => {
		const closeOutside = (event: PointerEvent) => {
			if (!navRef.current?.contains(event.target as Node)) {
				setOpenMenu(null)
				setMobileMenuOpen(false)
			}
		}
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setOpenMenu(null)
				setMobileMenuOpen(false)
			}
		}
		document.addEventListener('pointerdown', closeOutside)
		document.addEventListener('keydown', closeOnEscape)
		return () => {
			document.removeEventListener('pointerdown', closeOutside)
			document.removeEventListener('keydown', closeOnEscape)
		}
	}, [])

	return (
		<header className='header'>
			<div className='container header__inner'>
				<Link to='/' className='link brand'>
					{APP_NAME}
				</Link>
				<nav className='nav' ref={navRef}>
					<div className='nav__desktop'>
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
							<div className='nav-more'>
								<button
									aria-expanded={openMenu === 'tools'}
									className='btn'
									onClick={() => setOpenMenu((current) => current === 'tools' ? null : 'tools')}
									type='button'>
									{t('tools', { ns: 'common' })}
								</button>
								{openMenu === 'tools' && (
								<div className='nav-more__menu'>
									<NavLink to='/print' className={({ isActive }) => (isActive ? active : 'link')}>
										{t('print', { ns: 'common' })}
									</NavLink>
								</div>
								)}
							</div>
							<div className='user-menu'>
								<button
									aria-expanded={openMenu === 'user'}
									className='user-avatar'
									onClick={() => setOpenMenu((current) => current === 'user' ? null : 'user')}
									type='button'
									aria-label={t('account', { ns: 'common' })}>
									{user.avatar ?? user.username.slice(0, 1).toUpperCase()}
								</button>
								{openMenu === 'user' && (
								<div className='user-menu__menu'>
									<NavLink to='/account' className={({ isActive }) => (isActive ? active : 'link')}>
										{t('account', { ns: 'common' })}
									</NavLink>
									<NavLink to='/settings' className={({ isActive }) => (isActive ? active : 'link')}>
										{t('settings', { ns: 'layout' })}
									</NavLink>
								</div>
								)}
							</div>
						</>
					) : (
						<NavLink
							to='/account'
							className={({ isActive }) => (isActive ? active : 'link btn primary btn--sm')}>
							Iniciar sesión
						</NavLink>
					)}
					</div>

					<div className='nav__utilities'>
						<ThemeToggle />
						<LanguageSelect />
						<button
							aria-expanded={mobileMenuOpen}
							aria-label={mobileMenuOpen ? 'Cerrar navegación' : 'Abrir navegación'}
							className='mobile-nav-toggle'
							onClick={() => setMobileMenuOpen((current) => !current)}
							type='button'>
							<span aria-hidden='true'>{mobileMenuOpen ? '×' : '☰'}</span>
						</button>
					</div>

					{mobileMenuOpen && (
						<div className='mobile-nav-panel'>
							<NavLink to='/' end className={({ isActive }) => (isActive ? active : 'link')}>{t('sudoku')}</NavLink>
							<NavLink to='/explication' className={({ isActive }) => (isActive ? active : 'link')}>{t('explication')}</NavLink>
							{user ? <>
								<NavLink to='/daily' className={({ isActive }) => (isActive ? active : 'link')}>{t('daily', { ns: 'common' })}</NavLink>
								<NavLink to='/dashboard' className={({ isActive }) => (isActive ? active : 'link')}>{t('stats', { ns: 'common' })}</NavLink>
								<NavLink to='/print' className={({ isActive }) => (isActive ? active : 'link')}>{t('print', { ns: 'common' })}</NavLink>
								<NavLink to='/settings' className={({ isActive }) => (isActive ? active : 'link')}>{t('settings', { ns: 'layout' })}</NavLink>
								<NavLink to='/account' className={({ isActive }) => (isActive ? active : 'link')}>{t('account', { ns: 'common' })}</NavLink>
							</> : <NavLink to='/account' className={({ isActive }) => (isActive ? active : 'link')}>Iniciar sesión</NavLink>}
						</div>
					)}
				</nav>
			</div>
		</header>
	)
}
