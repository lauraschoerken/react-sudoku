import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './en' // <- objeto: { common: {...}, demo: {...}, ... }
import es from './es'

const LANGUAGE_KEY = 'lang'
const detected =
	(localStorage.getItem(LANGUAGE_KEY) as string | null) ??
	(navigator.language?.startsWith('es') ? 'es' : 'en')

void i18n.use(initReactI18next).init({
	resources: {
		en,
		es,
	},
	lng: detected,
	fallbackLng: 'es',

	// 👇 aquí pones varios
	defaultNS: ['common', 'demo'],

	// 👇 y aquí defines todos los namespaces disponibles
	ns: Array.from(new Set([...Object.keys(en), ...Object.keys(es)])),

	interpolation: { escapeValue: false },
	returnEmptyString: false,
})

i18n.on('languageChanged', (lng) => {
	try {
		localStorage.setItem(LANGUAGE_KEY, lng)
	} catch {
		//
	}
})

export default i18n
