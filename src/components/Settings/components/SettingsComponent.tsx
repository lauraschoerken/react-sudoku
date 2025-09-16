import './SettingsComponent.scss'

import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import LanguageSelect from '@/components/elements/Languague/LanguagueSelect'
import { ThemeToggle } from '@/components/elements/Theme/ThemeToggle'
import type { RootState } from '@/store'
import {
	setCronometroEnabled,
	setCronometroTipo,
	setLimitadorErroresEnabled,
	setLimiteErrores,
	toggleErroresActivos,
} from '@/store/settingsSlice'

export default function SettingsComponent() {
	const { t } = useTranslation('settings') // 👈 namespace
	const dispatch = useDispatch()
	const { erroresActivos, cronometro, cronometroTipo, limitadorErrores, limiteErrores } =
		useSelector((s: RootState) => s.settings)

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
							checked={erroresActivos}
							onChange={() => dispatch(toggleErroresActivos())}
							aria-label={t('errors.active')}
						/>
						{t('errors.active')}
					</label>

					{erroresActivos && (
						<div className='error-limit'>
							<label className='inline'>
								<input
									type='checkbox'
									checked={limitadorErrores}
									onChange={() => dispatch(setLimitadorErroresEnabled(!limitadorErrores))}
									aria-label={t('errors.limit.toggle')}
								/>
								{t('errors.limit.toggle')}
							</label>

							<select
								value={limiteErrores}
								disabled={!limitadorErrores}
								onChange={(e) => dispatch(setLimiteErrores(Number(e.target.value) as 3 | 5 | 10))}
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
							checked={cronometro}
							onChange={() => dispatch(setCronometroEnabled(!cronometro))}
							aria-label={t('timer.title')}
						/>
						{t('timer.title')}
					</label>

					{cronometro && (
						<select
							value={cronometroTipo}
							onChange={(e) =>
								dispatch(setCronometroTipo(e.target.value as 'countdown' | 'normal'))
							}
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
