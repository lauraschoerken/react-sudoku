import '@/assets/styles/index.scss'

import { RouterProvider } from 'react-router-dom'
import { useEffect } from 'react'

import { useThemeSync } from './hooks/settings/useThemeSync'
import { I18nProvider } from './i18n/I18nProvider'
import { router } from './navigation/routes'
import { AUTH_INVALID_EVENT, getCurrentUser, isAuthError } from './services/sudokuApi'
import { clearSession, setSession } from './store/features/auth/authSlice'
import { useAppDispatch, useAppSelector } from './store/hooks'

const SessionGuard = () => {
	const dispatch = useAppDispatch()
	const token = useAppSelector((state) => state.auth.token)

	useEffect(() => {
		const clearInvalidSession = () => dispatch(clearSession())
		window.addEventListener(AUTH_INVALID_EVENT, clearInvalidSession)
		return () => window.removeEventListener(AUTH_INVALID_EVENT, clearInvalidSession)
	}, [dispatch])

	useEffect(() => {
		if (!token) return
		let cancelled = false
		void getCurrentUser()
			.then((user) => {
				if (!cancelled) dispatch(setSession({ token, user }))
			})
			.catch((error) => {
				if (!cancelled && isAuthError(error)) dispatch(clearSession())
			})
		return () => {
			cancelled = true
		}
	}, [dispatch, token])

	return null
}

export default function App() {
	useThemeSync()
	return (
		<I18nProvider>
			<SessionGuard />
			<RouterProvider router={router} />
		</I18nProvider>
	)
}
