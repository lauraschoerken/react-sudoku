import './ThemeToggle.scss'

import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setTheme } from '@/store/settingsSlice'

import { MoonIcon, SunIcon } from './icons'

export const ThemeToggle = () => {
	const dispatch = useAppDispatch()
	const theme = useAppSelector((s) => s.settings.theme) 

	const toggle = () => {
		const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
		dispatch(setTheme(next))
	}

	return (
		<button className={`theme-toggle ${theme}`} onClick={toggle} aria-label='Cambiar tema'>
			<span className='icon'>{theme === 'light' ? <SunIcon /> : <MoonIcon />}</span>
		</button>
	)
}
