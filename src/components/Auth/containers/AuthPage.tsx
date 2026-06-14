import './AuthPage.scss'

import { useState } from 'react'
import type { FormEvent } from 'react'

import { getCurrentUser, login, register } from '@/services/sudokuApi'
import { setSession, clearSession } from '@/store/features/auth/authSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

export const AuthPage = () => {
	const dispatch = useAppDispatch()
	const session = useAppSelector((s) => s.auth)
	const [loginEmail, setLoginEmail] = useState('')
	const [loginPassword, setLoginPassword] = useState('')
	const [username, setUsername] = useState('')
	const [registerEmail, setRegisterEmail] = useState('')
	const [registerPassword, setRegisterPassword] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [checkingSession, setCheckingSession] = useState(false)

	const onLogin = async (event: FormEvent) => {
		event.preventDefault()
		setError(null)
		try {
			dispatch(setSession(await login(loginEmail, loginPassword)))
		} catch {
			setError('No se pudo iniciar sesion.')
		}
	}

	const onRegister = async (event: FormEvent) => {
		event.preventDefault()
		setError(null)
		try {
			dispatch(setSession(await register(username, registerEmail, registerPassword)))
		} catch {
			setError('No se pudo crear el usuario.')
		}
	}

	const onValidateSession = async () => {
		if (!session.token) return
		setCheckingSession(true)
		setError(null)
		try {
			dispatch(setSession({ token: session.token, user: await getCurrentUser() }))
		} catch {
			dispatch(clearSession())
			setError('La sesion ya no es valida.')
		} finally {
			setCheckingSession(false)
		}
	}

	return (
		<div className='auth-page'>
			<h1 className='page-title'>Cuenta</h1>
			{session.user && (
				<div className='panel form-stack'>
					<span>
						Sesion iniciada como <strong>{session.user.username}</strong>
					</span>
					<button className='btn' onClick={() => dispatch(clearSession())}>
						Cerrar sesion
					</button>
					<button className='btn' disabled={checkingSession} onClick={onValidateSession}>
						{checkingSession ? 'Validando...' : 'Validar sesion'}
					</button>
				</div>
			)}

			{!session.user && (
				<div className='auth-grid'>
					<form className='panel form-stack' onSubmit={onLogin}>
						<h2>Entrar</h2>
						<label>
							Email
							<input value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
						</label>
						<label>
							Password
							<input
								type='password'
								value={loginPassword}
								onChange={(e) => setLoginPassword(e.target.value)}
							/>
						</label>
						<button className='btn primary'>Entrar</button>
					</form>

					<form className='panel form-stack' onSubmit={onRegister}>
						<h2>Registro</h2>
						<label>
							Usuario
							<input value={username} onChange={(e) => setUsername(e.target.value)} />
						</label>
						<label>
							Email
							<input value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} />
						</label>
						<label>
							Password
							<input
								type='password'
								value={registerPassword}
								onChange={(e) => setRegisterPassword(e.target.value)}
							/>
						</label>
						<button className='btn primary'>Crear cuenta</button>
					</form>
				</div>
			)}

			{error && <p className='error-text'>{error}</p>}
		</div>
	)
}
