import './SettingsComponent.scss'

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
	const dispatch = useDispatch()
	const { erroresActivos, cronometro, cronometroTipo, limitadorErrores, limiteErrores } =
		useSelector((s: RootState) => s.settings)

	return (
		<div className='page-wrapper'>
			<div className='settings-component'>
				<div className='settings-top'>
					<ThemeToggle /* onChange={(t)=>dispatch(setTheme(t))} value={theme} */ />
					<LanguageSelect /* onChange={(l)=>dispatch(setLanguage(l))} value={language} */ />
				</div>
				<div className='setting-item setting-row'>
					<label className='inline'>
						<input
							type='checkbox'
							checked={erroresActivos}
							onChange={() => dispatch(toggleErroresActivos())}
						/>
						Errores activos
					</label>

					{erroresActivos && (
						<div className='error-limit'>
							<label className='inline'>
								<input
									type='checkbox'
									checked={limitadorErrores}
									onChange={() => dispatch(setLimitadorErroresEnabled(!limitadorErrores))}
								/>
								Limitar a
							</label>

							<select
								value={limiteErrores}
								disabled={!limitadorErrores}
								onChange={(e) => dispatch(setLimiteErrores(Number(e.target.value) as 3 | 5 | 10))}>
								<option value='3'>3</option>
								<option value='5'>5</option>
								<option value='10'>10</option>
							</select>
							<span className='suffix'>errores</span>
						</div>
					)}
				</div>

				<div className='setting-item'>
					<label>
						<input
							type='checkbox'
							checked={cronometro}
							onChange={() => dispatch(setCronometroEnabled(!cronometro))}
						/>
						Cronómetro
					</label>

					{cronometro && (
						<select
							value={cronometroTipo}
							onChange={(e) =>
								dispatch(setCronometroTipo(e.target.value as 'countdown' | 'normal'))
							}>
							<option value='countdown'>Cuenta atrás</option>
							<option value='normal'>Normal</option>
						</select>
					)}
				</div>
			</div>
		</div>
	)
}
