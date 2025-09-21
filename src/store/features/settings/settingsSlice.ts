import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

import type { Language } from '@/models/utils/Lang'
import type { Theme } from '@/models/utils/Theme'
import { AVAILABLE_LANGS } from '@/utils/constants'

// ------------------------------
// Types & State
// ------------------------------
interface SettingsState {
	theme: Theme
	language: Language
	errorsActive: boolean
	timerEnabled: boolean
	timerMode: 'countdown' | 'normal'
	timerSeconds: number
	errorsLimiterEnabled: boolean
	errorsLimit: number
}

const DEFAULT_STATE: SettingsState = {
	theme: 'dark',
	language: 'en',
	errorsActive: false,
	timerEnabled: false,
	timerMode: 'countdown',
	timerSeconds: 600,
	errorsLimiterEnabled: false,
	errorsLimit: 5,
}

const STORAGE_KEY = 'settings'

// ------------------------------
// Helpers
// ------------------------------

function isTheme(x: unknown): x is Theme {
	return x === 'light' || x === 'dark' || x === 'system'
}
function isTimerMode(x: unknown): x is 'countdown' | 'normal' {
	return x === 'countdown' || x === 'normal'
}
function isPositiveInt(x: unknown): x is number {
	return typeof x === 'number' && Number.isInteger(x) && x >= 1
}

const SUPPORTED_CODES: Set<Language> = new Set(AVAILABLE_LANGS.map((l) => l.code))

function isLanguage(x: string | null): x is Language {
	return !!x && SUPPORTED_CODES.has(x as Language)
}

function normalizeLang(input?: string | null): string | null {
	if (!input) return null
	return input.toLowerCase().split('-')[0] || null
}

function getDefaultLanguageFromAvailable(): Language {
	if (typeof navigator === 'undefined') return 'en'
	const preferredStr =
		normalizeLang(navigator.languages?.[0]) ?? normalizeLang(navigator.language) ?? 'en'
	return isLanguage(preferredStr) ? preferredStr : 'en'
}

function loadInitialState(): SettingsState {
	try {
		if (typeof window === 'undefined') return DEFAULT_STATE

		const raw = localStorage.getItem(STORAGE_KEY)

		if (!raw) {
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

			let initialLanguage: Language = getDefaultLanguageFromAvailable()
			try {
				const legacy = localStorage.getItem('lang')
				if (isLanguage(legacy)) {
					initialLanguage = legacy
				}
			} catch {
				// ignore
			}

			return {
				...DEFAULT_STATE,
				theme: prefersDark ? 'dark' : 'light',
				language: initialLanguage,
			}
		}

		const parsed = JSON.parse(raw) as Partial<SettingsState> | null
		if (!parsed) return DEFAULT_STATE

		const parsedLang = typeof parsed.language === 'string' ? parsed.language : null

		return {
			theme: isTheme(parsed.theme) ? parsed.theme : DEFAULT_STATE.theme,
			language: isLanguage(parsedLang) ? parsedLang : getDefaultLanguageFromAvailable(),
			errorsActive:
				typeof parsed.errorsActive === 'boolean' ? parsed.errorsActive : DEFAULT_STATE.errorsActive,
			timerEnabled:
				typeof parsed.timerEnabled === 'boolean' ? parsed.timerEnabled : DEFAULT_STATE.timerEnabled,
			timerMode: isTimerMode(parsed.timerMode) ? parsed.timerMode : DEFAULT_STATE.timerMode,
			timerSeconds: isPositiveInt(parsed.timerSeconds)
				? parsed.timerSeconds
				: DEFAULT_STATE.timerSeconds,
			errorsLimiterEnabled:
				typeof parsed.errorsLimiterEnabled === 'boolean'
					? parsed.errorsLimiterEnabled
					: DEFAULT_STATE.errorsLimiterEnabled,
			errorsLimit: isPositiveInt(parsed.errorsLimit)
				? parsed.errorsLimit
				: DEFAULT_STATE.errorsLimit,
		}
	} catch {
		return DEFAULT_STATE
	}
}

// ------------------------------
// Slice
// ------------------------------
const initialState: SettingsState = loadInitialState()

const settingsSlice = createSlice({
	name: 'settings',
	initialState,
	reducers: {
		setTheme: (s, a: PayloadAction<Theme>) => {
			s.theme = a.payload
		},
		setLanguage: (s, a: PayloadAction<Language>) => {
			s.language = a.payload
		},

		toggleErrorsActive: (s) => {
			s.errorsActive = !s.errorsActive
		},

		setTimerEnabled: (s, a: PayloadAction<boolean>) => {
			s.timerEnabled = a.payload
		},
		setTimerMode: (s, a: PayloadAction<'countdown' | 'normal'>) => {
			s.timerMode = a.payload
		},
		setTimerSeconds: (s, a: PayloadAction<number>) => {
			// 👈 nuevo reducer
			const v = Math.max(1, Math.floor(a.payload || 1))
			s.timerSeconds = v
		},

		setErrorsLimiterEnabled: (s, a: PayloadAction<boolean>) => {
			s.errorsLimiterEnabled = a.payload
		},
		setErrorsLimit: (s, a: PayloadAction<number>) => {
			const v = Math.max(1, Math.floor(a.payload || 1))
			s.errorsLimit = v
		},
	},
})

export const {
	setTheme,
	setLanguage,
	toggleErrorsActive,
	setTimerEnabled,
	setTimerMode,
	setTimerSeconds, // 👈 export
	setErrorsLimiterEnabled,
	setErrorsLimit,
} = settingsSlice.actions

export default settingsSlice.reducer

export { DEFAULT_STATE, STORAGE_KEY }
