import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'

import App from './App.tsx'
import { store } from './store'
import ThemeReduxSync from './utils/Theme/themeProvider.tsx'

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<Provider store={store}>
			<ThemeReduxSync />
			<App />
		</Provider>
	</StrictMode>
)
