import '@/components/Auth/containers/AuthPage.scss'

import { LoginPrompt } from '@/components/elements/LoginGate/LoginGate'
import { useAppSelector } from '@/store/hooks'

import SettingsComponent from '../components/SettingsComponent'

export const Settings = () => {
	const user = useAppSelector((s) => s.auth.user)

	if (!user) {
		return (
			<div style={{ maxWidth: '72rem', margin: '0 auto', padding: '1.5rem' }}>
				<LoginPrompt
					title='Ajustes'
					description='Inicia sesión para acceder a los ajustes del juego y guardar tus preferencias.'
				/>
			</div>
		)
	}

	return <SettingsComponent />
}
