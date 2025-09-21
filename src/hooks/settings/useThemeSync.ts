import { useEffect } from 'react'

import type { Theme } from '@/models/utils/Theme'
import { useAppSelector } from '@/store/hooks'

const resolveSystem = () =>
	window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

export function useThemeSync() {
	const theme: Theme = useAppSelector((s) => s.settings.theme)

	useEffect(() => {
		const apply = (t: Theme) => {
			const effective = t === 'system' ? resolveSystem() : t
			const root = document.documentElement
			root.dataset.theme = effective
			root.classList.toggle('theme-dark', effective === 'dark')
			root.classList.toggle('theme-light', effective === 'light')

		}

		apply(theme)

		if (theme !== 'system') return
		const mql = window.matchMedia('(prefers-color-scheme: dark)')
		const handler = () => apply('system')
		mql.addEventListener?.('change', handler)
		mql.addListener?.(handler)
		return () => {
			mql.removeEventListener?.('change', handler)
			mql.removeListener?.(handler)
		}
	}, [theme])
}
