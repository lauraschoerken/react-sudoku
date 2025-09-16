// src/utils/Theme/theme.ts
import type { Theme } from '@/models/utils/Theme'

const STORAGE_KEY = 'theme'

export function resolveSystemTheme(): 'light' | 'dark' {
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const getInitialTheme = (): Theme => {
	const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
	if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
	return 'system'
}

/**
 * Aplica el tema. Si el tema es 'system', resuelve a 'light'/'dark' dinámicamente.
 * Siempre persiste el valor lógico (light|dark|system), NO el efectivo.
 */
export const applyTheme = (theme: Theme) => {
	const effective = theme === 'system' ? resolveSystemTheme() : theme
	const root = document.documentElement

	root.dataset.theme = effective
	root.classList.toggle('theme-dark', effective === 'dark')
	root.classList.toggle('theme-light', effective === 'light')

	try {
		localStorage.setItem(STORAGE_KEY, theme)
	} catch {
		//
	}
}

/**
 * Escucha cambios del sistema SOLO si el tema lógico es 'system'.
 * Devuelve una función para desuscribirse.
 */
export const subscribeSystemTheme = (onChange: (effective: 'light' | 'dark') => void) => {
	const mql = window.matchMedia('(prefers-color-scheme: dark)')
	const handler = () => onChange(mql.matches ? 'dark' : 'light')

	mql.addEventListener?.('change', handler)
	mql.addListener?.(handler)

	return () => {
		mql.removeEventListener?.('change', handler)
		mql.removeListener?.(handler)
	}
}
