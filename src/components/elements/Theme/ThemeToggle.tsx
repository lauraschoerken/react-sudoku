import './ThemeToggle.scss'

import { useTheme } from '@/hooks/settings/useTheme'

import { MoonIcon, SunIcon } from './icons'

export const ThemeToggle = () => {
	const { theme, toggleTheme } = useTheme()

	return (
		<button className={`theme-toggle ${theme}`} onClick={toggleTheme} aria-label='Cambiar tema'>
			<span className='icon'>{theme === 'light' ? <SunIcon /> : <MoonIcon />}</span>
		</button>
	)
}
