import { useCallback } from 'react'

import type { Theme } from '@/models/utils/Theme'
import { setTheme } from '@/store/features/settings/settingsSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

/**
 * Hook para leer y cambiar el tema (light/dark).
 * Se encarga también de aplicarlo al <html>.
 */
export function useTheme() {
	const dispatch = useAppDispatch()
	const theme = useAppSelector((s) => s.settings.theme)

	const toggleTheme = useCallback(() => {
		const next: Theme = theme === 'dark' ? 'light' : 'dark'
		dispatch(setTheme(next))
	}, [dispatch, theme])

	const set = useCallback(
		(t: Theme) => {
			dispatch(setTheme(t))
		},
		[dispatch]
	)

	return { theme, toggleTheme, setTheme: set }
}
