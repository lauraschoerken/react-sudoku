import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

import type { Language } from '@/models/utils/Lang'
import type { Theme } from '@/models/utils/Theme'

interface SettingsState {
	theme: Theme
	language: Language
	erroresActivos: boolean
	cronometro: boolean
	cronometroTipo: 'countdown' | 'normal'
	limitadorErrores: boolean
	limiteErrores: 3 | 5 | 10
}

const initialState: SettingsState = {
	theme: 'dark',
	language: 'es',
	erroresActivos: false,
	cronometro: false,
	cronometroTipo: 'countdown',
	limitadorErrores: false,
	limiteErrores: 5,
}

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

		toggleErroresActivos: (s) => {
			s.erroresActivos = !s.erroresActivos
		},

		setCronometroEnabled: (s, a: PayloadAction<boolean>) => {
			s.cronometro = a.payload
		},
		setCronometroTipo: (s, a: PayloadAction<'countdown' | 'normal'>) => {
			s.cronometroTipo = a.payload
		},

		setLimitadorErroresEnabled: (s, a: PayloadAction<boolean>) => {
			s.limitadorErrores = a.payload
		},
		setLimiteErrores: (s, a: PayloadAction<3 | 5 | 10>) => {
			s.limiteErrores = a.payload
		},
	},
})

export const {
	setTheme,
	setLanguage,
	toggleErroresActivos,
	setCronometroEnabled,
	setCronometroTipo,
	setLimitadorErroresEnabled,
	setLimiteErrores,
} = settingsSlice.actions

export default settingsSlice.reducer
