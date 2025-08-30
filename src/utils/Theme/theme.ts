import type { Theme } from '@/models/utils/Theme'

const STORAGE_KEY = 'theme'

export const getInitialTheme = (): Theme => {
	const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
	if (stored) return stored
	const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
	return prefersDark ? 'dark' : 'light'
}

export const applyTheme = (theme: Theme) => {
	const root = document.documentElement
	if (theme === 'dark') root.classList.add('theme-dark')
	else root.classList.remove('theme-dark')
	localStorage.setItem(STORAGE_KEY, theme)
}
