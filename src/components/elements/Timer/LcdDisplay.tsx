// src/components/elements/Timer/LcdDisplay.tsx
import './Timer.scss'

import { useEffect, useState } from 'react'

interface LcdDisplayProps {
	seconds: number
	forceHours?: boolean
	className?: string
	showButtonsLikeClock?: boolean

	// ✅ Controles (opcionales). Si no se pasan, no se hace nada.
	running?: boolean
	onToggleStartStop?: () => void
	onClear?: () => void
	onAddMinute?: () => void
	onAddSecond?: () => void
}

const two = (n: number) => n.toString().padStart(2, '0')

export default function LcdDisplay({
	seconds,
	forceHours,
	className,
	showButtonsLikeClock = true,
	running,
	onToggleStartStop,
	onClear,
	onAddMinute,
	onAddSecond,
}: LcdDisplayProps) {
	const s = Math.max(0, Math.floor(seconds))
	const hh = Math.floor(s / 3600)
	const mm = Math.floor((s % 3600) / 60)
	const ss = s % 60
	const showHours = forceHours || hh > 0
	const parts = showHours ? [two(hh), two(mm), two(ss)] : [two(mm), two(ss)]

	const [blink, setBlink] = useState(true)
	useEffect(() => {
		const id = window.setInterval(() => setBlink((b) => !b), 500)
		return () => clearInterval(id)
	}, [])

	return (
		<div className={`lcd-timer ${className ?? ''}`}>
			<div className='lcd-bezel'>
				<div className='lcd-screen'>
					<span className='lcd-digit'>{parts[0]}</span>
					<span className={`lcd-colon ${blink ? 'on' : 'off'}`}>:</span>
					<span className='lcd-digit'>{parts[1]}</span>
					{showHours && (
						<>
							<span className={`lcd-colon ${blink ? 'on' : 'off'}`}>:</span>
							<span className='lcd-digit'>{parts[2]}</span>
						</>
					)}
				</div>

				{showButtonsLikeClock && (
					<div className='lcd-buttons'>
						<button type='button' className='lcd-btn ghost' onClick={onClear}>
							CLEAR
						</button>
						<button type='button' className='lcd-btn ghost' onClick={onAddMinute}>
							M
						</button>
						<button type='button' className='lcd-btn ghost' onClick={onAddSecond}>
							S
						</button>
						<button type='button' className='lcd-btn solid' onClick={onToggleStartStop}>
							{running ? 'STOP' : 'START'}
						</button>
					</div>
				)}
			</div>
		</div>
	)
}
