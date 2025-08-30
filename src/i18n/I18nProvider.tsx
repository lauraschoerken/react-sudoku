import { type ReactNode, Suspense } from 'react'
import { I18nextProvider } from 'react-i18next'

import i18n from '@/i18n/i18n'



export const I18nProvider = ({ children }: { children: ReactNode }) => {
	return (
		<I18nextProvider i18n={i18n}>
			<Suspense fallback={null}>{children}</Suspense>
		</I18nextProvider>
	)
}
