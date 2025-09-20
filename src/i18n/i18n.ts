import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import type { Language } from '@/models/utils/Lang'
import { AVAILABLE_LANGS } from '@/utils/constants'

import en from './en'
import es from './es'

const STORAGE_KEY = 'settings'
const SUPPORTED = new Set(AVAILABLE_LANGS.map((l) => l.code))

function normalize(lang?: string | null) {
	return (lang || '').toLowerCase().split('-')[0]
}

function detectInitialLang(): 'en' | 'es' {
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (raw) {
			const parsed = JSON.parse(raw) as { language?: string } | null
			const saved = normalize(parsed?.language) as Language | null
			if (saved && SUPPORTED.has(saved)) return saved as 'en' | 'es'
		}

		const legacy = normalize(localStorage.getItem('lang')) as Language
		if (legacy && SUPPORTED.has(legacy)) return legacy as 'en' | 'es'
	} catch {
		// ignore
	}

	const nav =
		(normalize(navigator.languages?.[0]) as Language) || normalize(navigator.language) || 'en'
	return (SUPPORTED.has(nav) ? nav : 'en') as 'en' | 'es'
}

const detected = detectInitialLang()

void i18n.use(initReactI18next).init({
	resources: { en, es },
	lng: detected,
	fallbackLng: 'en', // ← fallback global en inglés como pediste
	defaultNS: ['common', 'demo'], // puedes dejar array si lo usas así
	ns: Array.from(new Set([...Object.keys(en), ...Object.keys(es)])),
	interpolation: { escapeValue: false },
	returnEmptyString: false,
})

export default i18n
