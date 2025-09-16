import '@/assets/styles/index.scss'

import { RouterProvider } from 'react-router-dom'

import { I18nProvider } from './i18n/I18nProvider'
import { router } from './navigation/routes'

export default function App() {
	return (
		<I18nProvider>
			<RouterProvider router={router} />
		</I18nProvider>
	)
}
