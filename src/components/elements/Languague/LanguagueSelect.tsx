import './LanguageSelect.scss'

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { Language } from '@/models/utils/Lang'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setLanguage } from '@/store/settingsSlice'
import { AVAILABLE_LANGS } from '@/utils/constants'

const LanguageSelect = () => {
	const dispatch = useAppDispatch()
	const { i18n } = useTranslation()

	const active = useAppSelector((s) => s.settings.language)
	const [open, setOpen] = useState(false)
	const wrapRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const onDoc = (e: MouseEvent) => {
			if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
		}
		document.addEventListener('mousedown', onDoc)
		return () => document.removeEventListener('mousedown', onDoc)
	}, [])

	const apply = (code: Language) => {
		dispatch(setLanguage(code))
		i18n.changeLanguage(code)
		try {
			localStorage.setItem('lang', code)
		} catch {
			//
		}
		setOpen(false)
	}

	const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		const idx = AVAILABLE_LANGS.findIndex((l) => l.code === active)
		if (e.key === 'ArrowDown') {
			e.preventDefault()
			const next = AVAILABLE_LANGS[(idx + 1) % AVAILABLE_LANGS.length].code
			apply(next)
		} else if (e.key === 'ArrowUp') {
			e.preventDefault()
			const prev = AVAILABLE_LANGS[(idx - 1 + AVAILABLE_LANGS.length) % AVAILABLE_LANGS.length].code
			apply(prev)
		} else if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault()
			setOpen((o) => !o)
		} else if (e.key === 'Escape') {
			setOpen(false)
		}
	}

	const label = AVAILABLE_LANGS.find((l) => l.code === active)?.label ?? active.toUpperCase()

	return (
		<div
			ref={wrapRef}
			className={`cselect ${open ? 'is-open' : ''}`}
			role='combobox'
			aria-haspopup='listbox'
			aria-expanded={open}
			tabIndex={0}
			onKeyDown={onKeyDown}>
			<button
				type='button'
				className='cselect__button'
				aria-label='Seleccionar idioma'
				aria-controls='lang-listbox'
				aria-expanded={open}
				onClick={() => setOpen((o) => !o)}>
				<span className='cselect__icon' aria-hidden='true' />
				<span className='cselect__value'>{label}</span>
				<span className='cselect__chevron' aria-hidden='true' />
			</button>

			{open && (
				<ul id='lang-listbox' className='cselect__list' role='listbox'>
					{AVAILABLE_LANGS.map((l) => (
						<li
							key={l.code}
							role='option'
							aria-selected={l.code === active}
							className={`cselect__option ${l.code === active ? 'is-active' : ''}`}
							onMouseDown={(e) => e.preventDefault()}
							onClick={() => apply(l.code)}>
							{l.label}
						</li>
					))}
				</ul>
			)}
		</div>
	)
}
export default LanguageSelect
