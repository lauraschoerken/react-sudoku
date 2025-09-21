import './SettingsComponent.scss'

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

	const onLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = Number(e.target.value)
		if (Number.isNaN(val)) return
		// opcional: clamp mínimo 1
		setErrorsLimit(Math.max(1, Math.floor(val)))
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
								onChange={() => setErrorsLimiterEnabled(!errorsLimiterEnabled)}
								aria-label={t('errors.limit.toggle')}
							/>
							{t('errors.limit.toggle')}
						</label>

						{/* AHORA: input libre */}
						<input
							type='number'
							min={1}
							step={1}
							inputMode='numeric'
							value={errorsLimit}
							disabled={!errorsLimiterEnabled}
							onChange={onLimitChange}
							aria-label={t('errors.limit.input') /* añade esta key si quieres */}
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
