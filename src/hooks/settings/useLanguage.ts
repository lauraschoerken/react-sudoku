import { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import type { Language } from '@/models/utils/Lang'
import { setLanguage } from '@/store/features/settings/settingsSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

/**
 * Language hook. Updates Redux and (optionally) i18next.
 * @param syncI18n if true, calls i18n.changeLanguage automatically (default true)
 */
export function useLanguage(syncI18n: boolean = true) {
	const dispatch = useAppDispatch()
	const { i18n } = useTranslation()
	const language = useAppSelector((s) => s.settings.language)

	useEffect(() => {
		if (!syncI18n) return
		i18n.changeLanguage(language).catch(() => {})
	}, [language, syncI18n, i18n])

	const set = useCallback(
		(lang: Language) => {
			dispatch(setLanguage(lang))
			// No escribimos 'lang' por separado; el estado completo se persiste en STORAGE_KEY.
		},
		[dispatch]
	)

	return { language, setLanguage: set }
}
