import '@/assets/styles/index.scss'

import { RouterProvider } from 'react-router-dom'

import { I18nProvider } from './i18n/I18nProvider'
import { router } from './navigation/routes'
import { ThemeProvider } from './utils/Theme/themeProvider'

export default function App() {
	return (
		<ThemeProvider>
			<I18nProvider>
				<RouterProvider router={router} />
			</I18nProvider>
		</ThemeProvider>
	)
}
