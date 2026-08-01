import './SettingsComponent.scss'

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import LanguageSelect from '@/components/elements/Languague/LanguagueSelect'
import { ThemeToggle } from '@/components/elements/Theme/ThemeToggle'
import { useErrorLimit, useErrors, useTimer } from '@/hooks/settings'

export default function SettingsComponent() {
	const { t } = useTranslation('settings')
	const { errorsActive, toggleErrorsActive } = useErrors()
	const { errorsLimiterEnabled, errorsLimit, setErrorsLimiterEnabled, setErrorsLimit } = useErrorLimit()
	const { timerEnabled, timerMode, timerSeconds, setTimerEnabled, setTimerMode, setTimerSeconds } = useTimer()
	const [draft, setDraft] = useState('')
	const [secondsDraft, setSecondsDraft] = useState('')
	const pristineLimitRef = useRef(true)
	const pristineCountdownRef = useRef(true)

	useEffect(() => {
		if (!errorsLimiterEnabled) return
		pristineLimitRef.current = true
		setDraft(String(Math.max(1, Math.floor(errorsLimit || 1))))
	}, [errorsLimit, errorsLimiterEnabled])

	useEffect(() => {
		if (timerMode !== 'countdown') return
		pristineCountdownRef.current = true
		setSecondsDraft(String(Math.max(10, Math.floor(timerSeconds ?? 10))))
	}, [timerMode, timerSeconds])

	const onChangeLimit = (event: React.ChangeEvent<HTMLInputElement>) => {
		setDraft(event.target.value)
		pristineLimitRef.current = false
		const value = Number(event.target.value)
		if (event.target.value.trim() && Number.isFinite(value)) setErrorsLimit(Math.max(1, Math.floor(value)))
	}

	const normalizeLimit = () => {
		const value = Number(draft)
		const normalized = draft.trim() && Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1
		setDraft(String(normalized))
		setErrorsLimit(normalized)
	}

	const onChangeSeconds = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSecondsDraft(event.target.value)
		pristineCountdownRef.current = false
	}

	const normalizeSeconds = () => {
		const value = Number(secondsDraft)
		const normalized = secondsDraft.trim() && Number.isFinite(value) ? Math.max(10, Math.floor(value)) : 10
		setSecondsDraft(String(normalized))
		setTimerSeconds(normalized)
	}

	return (
		<div className='page-wrapper settings-page'>
			<section className='settings-component'>
				<header className='settings-heading'>
					<div>
						<p className='eyebrow'>Tu experiencia</p>
						<h1>Ajustes</h1>
						<p className='muted'>Personaliza cómo quieres jugar. Los cambios se guardan automáticamente.</p>
					</div>
					<span className='settings-saved'>✓ Guardado automático</span>
				</header>

				<section className='settings-appearance' aria-labelledby='appearance-title'>
					<div className='setting-icon' aria-hidden='true'>Aa</div>
					<div className='setting-copy'>
						<h2 id='appearance-title'>Apariencia e idioma</h2>
						<p>Adapta la interfaz a tu entorno.</p>
					</div>
					<div className='settings-top'><ThemeToggle /><LanguageSelect /></div>
				</section>

				<div className='settings-grid'>
					<section className='setting-card' aria-labelledby='errors-title'>
						<header className='setting-card__header'>
							<div className='setting-icon setting-icon--errors' aria-hidden='true'>!</div>
							<div className='setting-copy'><h2 id='errors-title'>Errores</h2><p>Decide cuánto quieres que te ayude el tablero.</p></div>
						</header>
						<label className='switch-row'>
							<span><strong>{t('errors.active')}</strong><small>Resalta las entradas incorrectas.</small></span>
							<span className='switch-control'><input type='checkbox' checked={errorsActive} onChange={toggleErrorsActive} aria-label={t('errors.active')} /><i aria-hidden='true' /></span>
						</label>
						<div className={`setting-detail ${!errorsActive ? 'is-disabled' : ''}`}>
							<label className='switch-row switch-row--compact'>
								<span><strong>{t('errors.limit.toggle')}</strong><small>Finaliza la partida al alcanzar el límite.</small></span>
								<span className='switch-control'><input type='checkbox' checked={errorsLimiterEnabled} disabled={!errorsActive} onChange={() => setErrorsLimiterEnabled(!errorsLimiterEnabled)} aria-label={t('errors.limit.toggle')} /><i aria-hidden='true' /></span>
							</label>
							<label className='number-field'>
								<span>Límite</span>
								<input type='number' min={1} step={1} inputMode='numeric' value={draft} disabled={!errorsActive || !errorsLimiterEnabled} onFocus={() => { if (pristineLimitRef.current) setDraft('') }} onChange={onChangeLimit} onBlur={normalizeLimit} aria-label={t('errors.limit.input')} />
								<small>{t('errors.suffix')}</small>
							</label>
						</div>
					</section>

					<section className='setting-card' aria-labelledby='timer-title'>
						<header className='setting-card__header'>
							<div className='setting-icon setting-icon--timer' aria-hidden='true'>◷</div>
							<div className='setting-copy'><h2 id='timer-title'>Temporizador</h2><p>Juega sin presión o márcate un límite.</p></div>
						</header>
						<label className='switch-row'>
							<span><strong>{t('timer.title')}</strong><small>Muestra el tiempo durante la partida.</small></span>
							<span className='switch-control'><input type='checkbox' checked={timerEnabled} onChange={() => setTimerEnabled(!timerEnabled)} aria-label={t('timer.title')} /><i aria-hidden='true' /></span>
						</label>
						<div className={`setting-detail ${!timerEnabled ? 'is-disabled' : ''}`}>
							<div className='mode-picker' role='group' aria-label={t('timer.mode')}>
								<button className={timerMode === 'normal' ? 'is-active' : ''} disabled={!timerEnabled} onClick={() => setTimerMode('normal')} type='button'><strong>{t('timer.normal')}</strong><small>Cuenta el tiempo empleado</small></button>
								<button className={timerMode === 'countdown' ? 'is-active' : ''} disabled={!timerEnabled} onClick={() => setTimerMode('countdown')} type='button'><strong>{t('timer.countdown')}</strong><small>Cuenta hasta llegar a cero</small></button>
							</div>
							{timerMode === 'countdown' && (
								<label className='number-field number-field--wide'>
									<span>{t('timer.seconds')}</span>
									<input type='number' min={10} step={1} inputMode='numeric' value={secondsDraft} disabled={!timerEnabled} onFocus={() => { if (pristineCountdownRef.current) setSecondsDraft('') }} onChange={onChangeSeconds} onBlur={normalizeSeconds} aria-label={t('timer.seconds')} />
									<small>segundos</small>
								</label>
							)}
						</div>
					</section>
				</div>
			</section>
		</div>
	)
}
