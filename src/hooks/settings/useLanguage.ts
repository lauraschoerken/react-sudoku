import { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import type { Language } from '@/models/utils/Lang'
import { setLanguage } from '@/store/features/settings/settingsSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

/**
 * Hook de idioma. Cambia Redux y (por defecto) i18next.
 * @param syncI18n si true, hace i18n.changeLanguage automáticamente (por defecto true)
 */
export function useLanguage(syncI18n: boolean = true) {
	const dispatch = useAppDispatch()
	const { i18n } = useTranslation()
	const language = useAppSelector((s) => s.settings.language)

	// Sincroniza con i18next al montar o cuando cambie language (opcional)
	useEffect(() => {
		if (!syncI18n) return
		i18n.changeLanguage(language).catch(() => {})
	}, [language, syncI18n, i18n])

	const set = useCallback(
		(lang: Language) => {
			dispatch(setLanguage(lang))
			if (syncI18n) {
				// también puedes persistir aquí si lo prefieres
				try {
					localStorage.setItem('lang', lang)
				} catch {
					//
				}
			}
		},
		[dispatch, syncI18n]
	)

	return { language, setLanguage: set }
}
