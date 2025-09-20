import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

import type { Language } from '@/models/utils/Lang'
import type { Theme } from '@/models/utils/Theme'

interface SettingsState {
	theme: Theme
	language: Language
	errorsActive: boolean
	timerEnabled: boolean
	timerMode: 'countdown' | 'normal'
	errorsLimiterEnabled: boolean
	errorsLimit: 3 | 5 | 10
}

const DEFAULT_STATE: SettingsState = {
	theme: 'dark',
	language: 'es',
	errorsActive: false,
	timerEnabled: false,
	timerMode: 'countdown',
	errorsLimiterEnabled: false,
	errorsLimit: 5,
}

const STORAGE_KEY = 'settings'

function isTheme(x: unknown): x is Theme {
	return x === 'light' || x === 'dark' || x === 'system'
}
function isLanguage(x: unknown): x is Language {
	return x === 'es' || x === 'en'
}
function isTimerMode(x: unknown): x is 'countdown' | 'normal' {
	return x === 'countdown' || x === 'normal'
}
function isErrorsLimit(x: unknown): x is 3 | 5 | 10 {
	return x === 3 || x === 5 || x === 10
}

function loadInitialState(): SettingsState {
	try {
		if (typeof window === 'undefined') return DEFAULT_STATE

		const raw = localStorage.getItem(STORAGE_KEY)
		if (!raw) {
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
			return {
				...DEFAULT_STATE,
				theme: prefersDark ? 'dark' : 'light',
			}
		}

		const parsed = JSON.parse(raw) as Partial<SettingsState> | null
		if (!parsed) return DEFAULT_STATE

		return {
			theme: isTheme(parsed.theme) ? parsed.theme : DEFAULT_STATE.theme,
			language: isLanguage(parsed.language) ? parsed.language : DEFAULT_STATE.language,
			errorsActive:
				typeof parsed.errorsActive === 'boolean' ? parsed.errorsActive : DEFAULT_STATE.errorsActive,
			timerEnabled:
				typeof parsed.timerEnabled === 'boolean' ? parsed.timerEnabled : DEFAULT_STATE.timerEnabled,
			timerMode: isTimerMode(parsed.timerMode) ? parsed.timerMode : DEFAULT_STATE.timerMode,
			errorsLimiterEnabled:
				typeof parsed.errorsLimiterEnabled === 'boolean'
					? parsed.errorsLimiterEnabled
					: DEFAULT_STATE.errorsLimiterEnabled,
			errorsLimit: isErrorsLimit(parsed.errorsLimit)
				? parsed.errorsLimit
				: DEFAULT_STATE.errorsLimit,
		}
	} catch {
		return DEFAULT_STATE
	}
}

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

		setErrorsLimiterEnabled: (s, a: PayloadAction<boolean>) => {
			s.errorsLimiterEnabled = a.payload
		},
		setErrorsLimit: (s, a: PayloadAction<3 | 5 | 10>) => {
			s.errorsLimit = a.payload
		},
	},
})

export const {
	setTheme,
	setLanguage,
	toggleErrorsActive,
	setTimerEnabled,
	setTimerMode,
	setErrorsLimiterEnabled,
	setErrorsLimit,
} = settingsSlice.actions

export default settingsSlice.reducer

export { DEFAULT_STATE, STORAGE_KEY }
