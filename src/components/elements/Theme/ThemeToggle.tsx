import './ThemeToggle.scss'

import { useContext } from 'react'

import { ThemeContext } from '@/utils/Theme/theme-context'

import { MoonIcon,SunIcon } from './icons'

export const ThemeToggle = () => {
	const { theme, toggle } = useContext(ThemeContext)

	return (
		<button className={`theme-toggle ${theme}`} onClick={toggle} aria-label='Cambiar tema'>
			<span className='icon'>{theme === 'light' ? <SunIcon /> : <MoonIcon />}</span>
		</button>
	)
}
