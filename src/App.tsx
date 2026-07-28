import '@/assets/styles/index.scss'

import { RouterProvider } from 'react-router-dom'
import { useEffect } from 'react'

import { useThemeSync } from './hooks/settings/useThemeSync'
import { I18nProvider } from './i18n/I18nProvider'
import { router } from './navigation/routes'
import { getCurrentUser } from './services/sudokuApi'
import { setSession } from './store/features/auth/authSlice'
import { useAppDispatch, useAppSelector } from './store/hooks'

const SessionGuard = () => {
	const dispatch = useAppDispatch()
	const token = useAppSelector((state) => state.auth.token)

	useEffect(() => {
		if (!token) return
		let cancelled = false
		void getCurrentUser()
			.then((user) => {
				if (!cancelled) dispatch(setSession({ token, user }))
			})
			.catch(() => undefined)
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
