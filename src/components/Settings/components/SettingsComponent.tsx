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
	const { timerEnabled, timerMode, setTimerEnabled, setTimerMode } = useTimer()

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

	return (
		<div className='page-wrapper'>
			<div className='settings-component'>
				<div className='settings-top'>
					<ThemeToggle />
					<LanguageSelect />
				</div>

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
							value={errorsLimiterEnabled ? draft : draft /* mantiene valor visible */}
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
						<select
							value={timerMode}
							onChange={(e) => setTimerMode(e.target.value as 'countdown' | 'normal')}
							aria-label={t('timer.mode')}>
							<option value='countdown'>{t('timer.countdown')}</option>
							<option value='normal'>{t('timer.normal')}</option>
						</select>
					)}
				</div>
			</div>
		</div>
	)
}
