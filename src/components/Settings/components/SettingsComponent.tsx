import './SettingsComponent.scss'

import { useState } from 'react'

import LanguageSelect from '@/components/elements/Languague/LanguagueSelect'
import { ThemeToggle } from '@/components/elements/Theme/ThemeToggle'

export default function SettingsComponent() {
	const [erroresActivos, setErroresActivos] = useState(false)
	const [conometro, setConometro] = useState(false)
	const [limitadorErrores, setLimitadorErrores] = useState(false)

	return (
		<div className='page-wrapper'>
			<div className='settings-component'>
				<div className='setting-item'>
					<label>
						<input
							type='checkbox'
							checked={erroresActivos}
							onChange={() => setErroresActivos(!erroresActivos)}
						/>
						Errores activos
					</label>
				</div>

				<div className='setting-item'>
					<label>
						<input type='checkbox' checked={conometro} onChange={() => setConometro(!conometro)} />
						Conómetro
					</label>
					{conometro && (
						<select>
							<option value='3'>Cuenta atras</option>
							<option value='5'>Normal</option>
						</select>
					)}
				</div>

				<div className='setting-item'>
					<label>
						<input
							type='checkbox'
							checked={limitadorErrores}
							onChange={() => setLimitadorErrores(!limitadorErrores)}
						/>
						Limitador de errores
					</label>
					{limitadorErrores && (
						<select>
							<option value='3'>3</option>
							<option value='5'>5</option>
							<option value='10'>10</option>
						</select>
					)}
				</div>
				<ThemeToggle />
				<LanguageSelect />
			</div>
		</div>
	)
}
