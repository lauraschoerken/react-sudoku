import './Timer.scss'

import { useMemo } from 'react'
interface CountdownDialProps {
	total: number
	remaining: number
	size?: number
	showLabel?: boolean
	className?: string
}

const two = (n: number) => n.toString().padStart(2, '0')
const fmt = (s: number) => {
	s = Math.max(0, Math.floor(s))
	const m = Math.floor(s / 60)
	const ss = s % 60
	return `${two(m)}:${two(ss)}`
}

export default function CountdownDial({
	total,
	remaining,
	size = 116,
	showLabel = true,
	className,
}: CountdownDialProps) {
	const R = size / 2
	const progressR = R - 8
	const frac = useMemo(() => {
		if (total <= 0) return 0
		return Math.max(0, Math.min(1, remaining / total))
	}, [remaining, total])

	const circumference = 2 * Math.PI * progressR

	return (
		<div className={`timer-dial ${className ?? ''}`} style={{ width: size, height: size }}>
			<svg
				width={size}
				height={size}
				viewBox={`0 0 ${size} ${size}`}
				role='timer'
				aria-label='countdown'>
				<circle className='dial-track' cx={R} cy={R} r={progressR} />
				<circle
					className='dial-progress'
					cx={R}
					cy={R}
					r={progressR}
					strokeDasharray={circumference}
					strokeDashoffset={circumference * (1 - frac)}
				/>
			</svg>

			{showLabel && (
				<div className='timer-dial__label' aria-hidden='true'>
					<span>Tiempo</span>
					<strong>{fmt(remaining)}</strong>
				</div>
			)}
		</div>
	)
}
