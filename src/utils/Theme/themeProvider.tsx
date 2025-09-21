// src/components/providers/ThemeReduxSync.tsx
import { useEffect } from 'react'

import type { Theme } from '@/models/utils/Theme'
import { useAppSelector } from '@/store/hooks'
import { applyTheme, subscribeSystemTheme } from '@/utils/Theme/theme'

export default function ThemeReduxSync() {
	const theme: Theme = useAppSelector((s) => s.settings.theme)

	useEffect(() => {
		applyTheme(theme)
	}, [theme])

	useEffect(() => {
		if (theme !== 'system') return
		const dispose = subscribeSystemTheme(() => applyTheme('system'))
		return dispose
	}, [theme])

	return null
}
