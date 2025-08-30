export const APP_NAME = import.meta.env.VITE_APP_NAME

export interface Lang {
	code: string
	label: string
}
export const AVAILABLE_LANGS: Lang[] = [
	{ code: 'es', label: 'ES · Español' },
	{ code: 'en', label: 'EN · English' },
	// { code: 'de', label: 'DE · Deutsch' },
	// { code: 'fr', label: 'FR · Français' },
]
