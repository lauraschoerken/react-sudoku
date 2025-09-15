import './ThemeToggle.scss'

import { useContext } from 'react'

import MoonIcon from '@/assets/svgs/moon.svg?react'
import SunIcon from '@/assets/svgs/sun.svg?react'
import { ThemeContext } from '@/utils/Theme/theme-context'

export const ThemeToggle = () => {
	const { theme, toggle } = useContext(ThemeContext)

	return (
		<button className={`theme-toggle ${theme}`} onClick={toggle} aria-label='Cambiar tema'>
			<span className='icon'>{theme === 'light' ? <SunIcon /> : <MoonIcon />}</span>
		</button>
	)
}
