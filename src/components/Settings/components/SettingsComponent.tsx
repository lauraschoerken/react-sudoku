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

					{errorsActive && (
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

							<select
								value={errorsLimit}
								disabled={!errorsLimiterEnabled}
								onChange={(e) => setErrorsLimit(Number(e.target.value) as 3 | 5 | 10)}
								aria-label={t('errors.limit.select')}>
								<option value='3'>3</option>
								<option value='5'>5</option>
								<option value='10'>10</option>
							</select>
							<span className='suffix'>{t('errors.suffix')}</span>
						</div>
					)}
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
