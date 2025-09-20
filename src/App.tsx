import '@/assets/styles/index.scss'

import { RouterProvider } from 'react-router-dom'

import { useThemeSync } from './hooks/settings/useThemeSync'
import { I18nProvider } from './i18n/I18nProvider'
import { router } from './navigation/routes'

export default function App() {
	useThemeSync()
	return (
		<I18nProvider>
			<RouterProvider router={router} />
		</I18nProvider>
	)
}
