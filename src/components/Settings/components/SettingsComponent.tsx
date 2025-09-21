import './SettingsComponent.scss'

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import LanguageSelect from '@/components/elements/Languague/LanguagueSelect'
import { ThemeToggle } from '@/components/elements/Theme/ThemeToggle'
import { useErrorLimit, useErrors, useTimer } from '@/hooks/settings'

export default function SettingsComponent() {
	const { t } = useTranslation('settings')

	const { errorsActive, toggleErrorsActive } = useErrors()
	const { errorsLimiterEnabled, errorsLimit, setErrorsLimiterEnabled, setErrorsLimit } =
		useErrorLimit()
	const { timerEnabled, timerMode, timerSeconds, setTimerEnabled, setTimerMode, setTimerSeconds } =
		useTimer()

	// ====== Error limit input ======
	const [draft, setDraft] = useState<string>('')
	const pristineSinceEnableRef = useRef<boolean>(true)

	useEffect(() => {
		if (errorsLimiterEnabled) {
			pristineSinceEnableRef.current = true
			setDraft(String(Math.max(1, Math.floor(errorsLimit || 1))))
		}
	}, [errorsLimiterEnabled, errorsLimit])

	const onToggleLimiter = () => {
		setErrorsLimiterEnabled(!errorsLimiterEnabled)
	}

	const onFocusLimit = () => {
		if (!errorsLimiterEnabled) return
		if (pristineSinceEnableRef.current) {
			setDraft('')
		}
	}

	const onChangeLimit = (e: React.ChangeEvent<HTMLInputElement>) => {
		const raw = e.target.value
		setDraft(raw)
		if (!errorsLimiterEnabled) return
		pristineSinceEnableRef.current = false

		if (raw.trim() === '') return

		const n = Number(raw)
		if (Number.isFinite(n)) {
			const clamped = Math.max(1, Math.floor(n))
			setErrorsLimit(clamped)
		}
	}

	const onBlurLimit = () => {
		if (!errorsLimiterEnabled) return
		const n = Number(draft)
		if (draft.trim() === '' || !Number.isFinite(n) || n < 1) {
			setDraft('1')
			setErrorsLimit(1)
		} else {
			const clamped = Math.max(1, Math.floor(n))
			setDraft(String(clamped))
			setErrorsLimit(clamped)
		}
	}

	// ====== Countdown seconds input (mínimo 10) ======
	const [secondsDraft, setSecondsDraft] = useState<string>('')
	const pristineSinceCountdownRef = useRef<boolean>(true)

	useEffect(() => {
		if (timerMode === 'countdown') {
			pristineSinceCountdownRef.current = true
			const safe = Math.max(10, Math.floor((timerSeconds ?? 10) as number))
			setSecondsDraft(String(safe))
		}
	}, [timerMode, timerSeconds])

	const onFocusSeconds = () => {
		if (timerMode !== 'countdown') return
		if (pristineSinceCountdownRef.current) {
			setSecondsDraft('')
		}
	}

	const onChangeSeconds = (e: React.ChangeEvent<HTMLInputElement>) => {
		const raw = e.target.value
		setSecondsDraft(raw)
		pristineSinceCountdownRef.current = false
	}

	const onBlurSeconds = () => {
		if (timerMode !== 'countdown') return
		const n = Number(secondsDraft)
		if (secondsDraft.trim() === '' || !Number.isFinite(n) || n < 10) {
			setSecondsDraft('10')
			setTimerSeconds(10)
		} else {
			const clamped = Math.max(10, Math.floor(n))
			setSecondsDraft(String(clamped))
			setTimerSeconds(clamped)
		}
	}

	return (
		<div className='page-wrapper'>
			<div className='settings-component'>
				<div className='settings-top'>
					<ThemeToggle />
					<LanguageSelect />
				</div>

				{/* ===== Errores ===== */}
				<div className='setting-item setting-row'>
					<label className='inline'>
						<input
							type='checkbox'
							checked={errorsActive}
							onChange={toggleErrorsActive}
							aria-label={t('errors.active')}
						/>
						{t('errors.active')}
					</label>

					<div className='error-limit'>
						<label className='inline'>
							<input
								type='checkbox'
								checked={errorsLimiterEnabled}
								onChange={onToggleLimiter}
								aria-label={t('errors.limit.toggle')}
							/>
							{t('errors.limit.toggle')}
						</label>

						<input
							type='number'
							min={1}
							step={1}
							inputMode='numeric'
							value={errorsLimiterEnabled ? draft : draft}
							disabled={!errorsLimiterEnabled}
							onFocus={onFocusLimit}
							onChange={onChangeLimit}
							onBlur={onBlurLimit}
							aria-label={t('errors.limit.input')}
							className='error-limit-input'
						/>
						<span className='suffix'>{t('errors.suffix')}</span>
					</div>
				</div>

				{/* ===== Timer ===== */}
				<div className='setting-item'>
					<label>
						<input
							type='checkbox'
							checked={timerEnabled}
							onChange={() => setTimerEnabled(!timerEnabled)}
							aria-label={t('timer.title')}
						/>
						{t('timer.title')}
					</label>

					{timerEnabled && (
						<>
							<select
								value={timerMode}
								onChange={(e) => setTimerMode(e.target.value as 'countdown' | 'normal')}
								aria-label={t('timer.mode')}>
								<option value='countdown'>{t('timer.countdown')}</option>
								<option value='normal'>{t('timer.normal')}</option>
							</select>

							{timerMode === 'countdown' && (
								<div className='timer-seconds'>
									<label className='inline'>
										<span className='label'>{t('timer.seconds') ?? 'Seconds'}</span>
										<input
											type='number'
											min={10}
											step={1}
											inputMode='numeric'
											value={secondsDraft}
											onFocus={onFocusSeconds}
											onChange={onChangeSeconds}
											onBlur={onBlurSeconds}
											aria-label={t('timer.seconds')}
											className='timer-seconds-input'
										/>
									</label>
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	)
}
