import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

export interface AuthUser {
	id: number
	username: string
	email: string
	avatar?: string
}

interface AuthState {
	token: string | null
	user: AuthUser | null
}

const STORAGE_KEY = 'auth'

const DEFAULT_STATE: AuthState = {
	token: null,
	user: null,
}

const loadInitialState = (): AuthState => {
	try {
		if (typeof window === 'undefined') return DEFAULT_STATE
		const raw = localStorage.getItem(STORAGE_KEY)
		if (!raw) return DEFAULT_STATE
		const parsed = JSON.parse(raw) as Partial<AuthState>
		if (!parsed.token || !parsed.user) return DEFAULT_STATE
		return { token: parsed.token, user: parsed.user }
	} catch {
		return DEFAULT_STATE
	}
}

const authSlice = createSlice({
	name: 'auth',
	initialState: loadInitialState(),
	reducers: {
		setSession: (state, action: PayloadAction<AuthState>) => {
			state.token = action.payload.token
			state.user = action.payload.user
		},
		clearSession: (state) => {
			state.token = null
			state.user = null
		},
		setAvatar: (state, action: PayloadAction<string>) => {
			if (state.user) state.user.avatar = action.payload
		},
	},
})

export const { setSession, clearSession, setAvatar } = authSlice.actions
export { STORAGE_KEY as AUTH_STORAGE_KEY }
export default authSlice.reducer
