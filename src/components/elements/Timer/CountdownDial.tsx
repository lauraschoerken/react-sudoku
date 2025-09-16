// src/components/elements/Timer/CountdownDial.tsx
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
	size = 150,
	showLabel = true,
	className,
}: CountdownDialProps) {
	const R = size / 2
	const faceR = R - 10
	const frac = useMemo(() => {
		if (total <= 0) return 0
		return Math.max(0, Math.min(1, remaining / total))
	}, [remaining, total])

	const angle = 2 * Math.PI * frac
	const startAng = -Math.PI / 2
	const endAng = startAng + angle
	const largeArc = angle > Math.PI ? 1 : 0

	const sx = R + faceR * Math.cos(startAng)
	const sy = R + faceR * Math.sin(startAng)
	const ex = R + faceR * Math.cos(endAng)
	const ey = R + faceR * Math.sin(endAng)

	const path = `
    M ${R} ${R}
    L ${sx} ${sy}
    A ${faceR} ${faceR} 0 ${largeArc} 1 ${ex} ${ey}
    Z
  `

	return (
		<div className={`timer-dial ${className ?? ''}`} style={{ width: size, height: size }}>
			<svg
				width={size}
				height={size}
				viewBox={`0 0 ${size} ${size}`}
				role='timer'
				aria-label='countdown'>
				<circle cx={R} cy={R} r={faceR + 6} fill='var(--dial-bezel, #1b1e21)' />
				<circle cx={R} cy={R} r={faceR} fill='var(--dial-face, #ffffff)' />
				{frac > 0 && <path d={path} fill='var(--dial-red, #e03131)' opacity={0.95} />}
				{Array.from({ length: 12 }).map((_, i) => {
					const a = (i * Math.PI) / 6
					const r1 = faceR - 14
					const r2 = faceR
					const x1 = R + r1 * Math.cos(a)
					const y1 = R + r1 * Math.sin(a)
					const x2 = R + r2 * Math.cos(a)
					const y2 = R + r2 * Math.sin(a)
					return (
						<line
							key={i}
							x1={x1}
							y1={y1}
							x2={x2}
							y2={y2}
							stroke='var(--dial-tick, #111)'
							strokeWidth={2.5}
							strokeLinecap='round'
							opacity={0.85}
						/>
					)
				})}
				<circle cx={R} cy={R} r={3} fill='var(--dial-center, #111)' />
			</svg>

			{showLabel && (
				<div className='timer-dial__label' aria-hidden='true'>
					{fmt(remaining)}
				</div>
			)}
		</div>
	)
}
