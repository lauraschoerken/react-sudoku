import '@/assets/styles/index.scss'

import { RouterProvider } from 'react-router-dom'
import { useEffect } from 'react'

import { useThemeSync } from './hooks/settings/useThemeSync'
import { I18nProvider } from './i18n/I18nProvider'
import { router } from './navigation/routes'
import { getCurrentUser, isAuthError } from './services/sudokuApi'
import { clearSession, setSession } from './store/features/auth/authSlice'
import { useAppDispatch, useAppSelector } from './store/hooks'

const SessionGuard = () => {
	const dispatch = useAppDispatch()
	const token = useAppSelector((state) => state.auth.token)

	useEffect(() => {
		if (!token) return
		const handleExpiredSession = () => dispatch(clearSession())
		window.addEventListener('sudoku-auth-expired', handleExpiredSession)
		void getCurrentUser()
			.then((user) => dispatch(setSession({ token, user })))
			.catch((error) => {
				if (isAuthError(error)) dispatch(clearSession())
			})
		return () => window.removeEventListener('sudoku-auth-expired', handleExpiredSession)
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
