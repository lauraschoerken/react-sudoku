import { configureStore } from '@reduxjs/toolkit'

import { setApiAuthToken } from '@/services/sudokuApi'
import authReducer, { AUTH_STORAGE_KEY } from '../auth/authSlice'
import settingsReducer, { STORAGE_KEY } from './settingsSlice'

export const store = configureStore({
	reducer: {
		auth: authReducer,
		settings: settingsReducer,
	},
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

setApiAuthToken(store.getState().auth.token)

let settingsTimer: ReturnType<typeof setTimeout> | undefined
store.subscribe(() => {
	setApiAuthToken(store.getState().auth.token)
	try {
		localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(store.getState().auth))
	} catch {
		/* ignore */
	}
	if (settingsTimer) clearTimeout(settingsTimer)
	settingsTimer = setTimeout(() => {
		try {
			const state = store.getState()
			localStorage.setItem(STORAGE_KEY, JSON.stringify(state.settings))
		} catch {
			/* ignore */
		}
	}, 500)
})
