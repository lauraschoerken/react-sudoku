import { configureStore } from '@reduxjs/toolkit'

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

let writing = false
store.subscribe(() => {
	if (writing) return
	writing = true
	setTimeout(() => {
		try {
			const state = store.getState()
			localStorage.setItem(STORAGE_KEY, JSON.stringify(state.settings))
			localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state.auth))
		} catch {
			/* ignore */
		}
		writing = false
	}, 500)
})
