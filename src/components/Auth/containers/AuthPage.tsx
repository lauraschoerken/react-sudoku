import './AuthPage.scss'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { changePassword, getCurrentUser, login, register } from '@/services/sudokuApi'
import { setAvatar, setSession, clearSession } from '@/store/features/auth/authSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

export const AuthPage = () => {
	const { t } = useTranslation('common')
	const avatarOptions = ['L', 'S', '★', '✦', '◆', '●']
	const dispatch = useAppDispatch()
	const session = useAppSelector((s) => s.auth)
	const [loginEmail, setLoginEmail] = useState('')
	const [loginPassword, setLoginPassword] = useState('')
	const [username, setUsername] = useState('')
	const [registerEmail, setRegisterEmail] = useState('')
	const [registerPassword, setRegisterPassword] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [checkingSession, setCheckingSession] = useState(false)
	const [currentPassword, setCurrentPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [changingPassword, setChangingPassword] = useState(false)
	const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
	const accountUser = session.user

	const onLogin = async (event: FormEvent) => {
		event.preventDefault()
		setError(null)
		try {
			dispatch(setSession(await login(loginEmail, loginPassword)))
		} catch {
			setError('No se pudo iniciar sesión.')
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
			setError('La sesión ya no es válida.')
		} finally {
			setCheckingSession(false)
		}
	}

	const onChangePassword = async (event: FormEvent) => {
		event.preventDefault()
		setError(null)
		setPasswordSuccess(null)
		if (newPassword !== confirmPassword) {
			setError('Las nuevas contraseñas no coinciden.')
			return
		}
		setChangingPassword(true)
		try {
			await changePassword(currentPassword, newPassword)
			setCurrentPassword('')
			setNewPassword('')
			setConfirmPassword('')
			setPasswordSuccess('Contraseña actualizada correctamente.')
		} catch {
			setError('No se pudo cambiar la contraseña. Comprueba tu contraseña actual.')
		} finally {
			setChangingPassword(false)
		}
	}

	return (
		<div className='auth-page'>
			<h1 className='page-title'>{t('account')}</h1>
			{accountUser && (
				<div className='account-layout'>
				<div className='panel account-profile'>
					<div className='account-avatar'>{accountUser.avatar ?? accountUser.username.slice(0, 1).toUpperCase()}</div>
					<span>
					Sesión iniciada como <strong>{accountUser.username}</strong>
					</span>
					<span className='muted'>{accountUser.email}</span>
					<button className='btn' onClick={() => dispatch(clearSession())}>
						Cerrar sesión
					</button>
					<button className='btn' disabled={checkingSession} onClick={onValidateSession}>
						{checkingSession ? 'Validando...' : 'Validar sesión'}
					</button>
					<div className='avatar-picker'>
						<strong>Icono de cuenta</strong>
						<div className='avatar-picker__options'>
							{avatarOptions.map((avatar) => (
								<button
									className={`user-avatar ${accountUser.avatar === avatar ? 'is-selected' : ''}`}
									onClick={() => dispatch(setAvatar(avatar))}
									type='button'
									key={avatar}>
									{avatar}
								</button>
							))}
						</div>
					</div>
				</div>
				<form className='panel form-stack' onSubmit={onChangePassword}>
					<h2>Cambiar contraseña</h2>
					<label>Contraseña actual<input type='password' value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required /></label>
					<label>Nueva contraseña<input type='password' minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required /></label>
					<label>Repetir contraseña<input type='password' minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></label>
					<button className='btn primary' disabled={changingPassword} type='submit'>
						{changingPassword ? 'Actualizando...' : 'Actualizar contraseña'}
					</button>
				</form>
				</div>
			)}

			{!session.user && (
				<div className='auth-grid'>
					<form className='panel form-stack' onSubmit={onLogin}>
						<h2>Iniciar sesión</h2>
						<label>
							Email
							<input value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
						</label>
						<label>
							Contraseña
							<input
								type='password'
								value={loginPassword}
								onChange={(e) => setLoginPassword(e.target.value)}
							/>
						</label>
						<button className='btn primary'>{t('enter')}</button>
					</form>

					<form className='panel form-stack' onSubmit={onRegister}>
						<h2>{t('register')}</h2>
						<label>
							Usuario
							<input value={username} onChange={(e) => setUsername(e.target.value)} />
						</label>
						<label>
							Email
							<input value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} />
						</label>
						<label>
							Contraseña
							<input
								type='password'
								value={registerPassword}
								onChange={(e) => setRegisterPassword(e.target.value)}
							/>
						</label>
						<button className='btn primary'>{t('createAccount')}</button>
					</form>
				</div>
			)}

		{passwordSuccess && <p className='success-text'>{passwordSuccess}</p>}
		{error && <p className='error-text'>{error}</p>}
		</div>
	)
}
