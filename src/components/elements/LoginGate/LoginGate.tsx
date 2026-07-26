import { Link } from 'react-router-dom'

interface LoginGateProps {
	title: string
	description?: string
	children: React.ReactNode
}

/**
 * Wraps page content that requires authentication.
 * Shows a prominent login prompt when there is no active session.
 */
export const LoginGate = ({ children }: LoginGateProps) => {
	return <>{children}</>
}

interface LoginPromptProps {
	title: string
	description?: string
}

export const LoginPrompt = ({ title, description }: LoginPromptProps) => (
	<div className='login-gate'>
		<div className='login-gate__icon' aria-hidden='true'>🔐</div>
		<h1 className='login-gate__title'>{title}</h1>
		{description && <p className='login-gate__desc muted'>{description}</p>}
		<div className='login-gate__actions'>
			<Link className='btn primary' to='/account'>
				Iniciar sesión
			</Link>
			<Link className='btn' to='/account'>
				Crear cuenta
			</Link>
		</div>
	</div>
)
