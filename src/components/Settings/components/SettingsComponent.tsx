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

				{/* Resto de opciones */}
				<div className='setting-item'>
					<label>
						<input
							type='checkbox'
							checked={erroresActivos}
							onChange={() => dispatch(toggleErroresActivos())}
						/>
						Errores activos
					</label>
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

				<div className='setting-item'>
					<label>
						<input
							type='checkbox'
							checked={limitadorErrores}
							onChange={() => dispatch(setLimitadorErroresEnabled(!limitadorErrores))}
						/>
						Limitador de errores
					</label>

					{limitadorErrores && (
						<select
							value={limiteErrores}
							onChange={(e) => dispatch(setLimiteErrores(Number(e.target.value) as 3 | 5 | 10))}>
							<option value='3'>3</option>
							<option value='5'>5</option>
							<option value='10'>10</option>
						</select>
					)}
				</div>
			</div>
		</div>
	)
}
