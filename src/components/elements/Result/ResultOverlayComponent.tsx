import './ResultOverlayComponent.scss'

import { useEffect, useMemo } from 'react'

export type ResultOverlayProps = {
	isOpen: boolean
	onClose: () => void
	onPrimary: () => void

	// win = victoria, lose = derrota
	variant?: 'win' | 'lose'

	// Si es derrota, motivo
	loseReason?: 'time' | 'errors'

	// Textos opcionales
	title?: string
	message?: string
	closeLabel?: string
	primaryLabel?: string
	ariaLabel?: string
	emoji?: string

	// Confeti
	enableConfetti?: boolean
	confettiColors?: readonly string[]
	particleCount?: number
}

type ConfettiParticle = {
	x: number
	y: number
	size: number
	strokeColor: string
	tilt: number
	tiltAngle: number
	velocityX: number
	velocityY: number
}

const WIN_COLORS = [
	'#f94144',
	'#f3722c',
	'#f8961e',
	'#90be6d',
	'#577590',
	'#277da1',
	'#f9c74f',
] as const
const LOSE_COLORS = ['#ff4d4f', '#aa0000', '#ff7875', '#8c1c13'] as const

export const ResultOverlay = ({
	isOpen,
	onClose,
	onPrimary,
	variant = 'win',

	loseReason, // ⬅️ nuevo

	title,
	message,
	closeLabel,
	primaryLabel,
	ariaLabel,
	emoji,

	enableConfetti,
	confettiColors,
	particleCount = 150,
}: ResultOverlayProps) => {
	const defaults = useMemo(() => {
		if (variant === 'lose') {
			// Ajustes por motivo de derrota
			const byTime = loseReason === 'time'
			return {
				title: byTime ? '¡Tiempo agotado!' : '¡Ánimo!',
				message: byTime ? 'Se acabó el tiempo.' : 'Has alcanzado el límite de errores.',
				closeLabel: 'Cerrar',
				primaryLabel: 'Reintentar',
				ariaLabel: byTime ? 'Partida perdida por tiempo' : 'Partida perdida por errores',
				emoji: byTime ? '⏰' : '💀',
				enableConfetti: false,
				colors: LOSE_COLORS as readonly string[],
			}
		}
		// Victoria
		return {
			title: '¡Enhorabuena!',
			message: 'Has completado el sudoku sin errores.',
			closeLabel: 'Cerrar',
			primaryLabel: 'Nueva partida',
			ariaLabel: 'Sudoku completado',
			emoji: '🎉',
			enableConfetti: true,
			colors: WIN_COLORS as readonly string[],
		}
	}, [variant, loseReason])

	const finalTitle = title ?? defaults.title
	const finalMessage = message ?? defaults.message
	const finalCloseLabel = closeLabel ?? defaults.closeLabel
	const finalPrimaryLabel = primaryLabel ?? defaults.primaryLabel
	const finalAriaLabel = ariaLabel ?? defaults.ariaLabel
	const finalEmoji = emoji ?? defaults.emoji
	const shouldConfetti = (enableConfetti ?? defaults.enableConfetti) === true
	const colors = confettiColors ?? defaults.colors

	useEffect(() => {
		if (!isOpen || !shouldConfetti) return
		const canvas = document.createElement('canvas')
		canvas.style.position = 'fixed'
		canvas.style.inset = '0'
		canvas.style.pointerEvents = 'none'
		canvas.width = window.innerWidth
		canvas.height = window.innerHeight
		document.body.appendChild(canvas)

		const ctx = canvas.getContext('2d')!
		const particles: ConfettiParticle[] = Array.from({ length: particleCount }, () => ({
			x: Math.random() * canvas.width,
			y: Math.random() * canvas.height - canvas.height,
			size: 5 + Math.random() * 5,
			strokeColor: colors[Math.floor(Math.random() * colors.length)],
			tilt: Math.random() * 10 - 10,
			tiltAngle: 0,
			velocityX: Math.random() - 0.5,
			velocityY: 2 + Math.random() * 3,
		}))

		let rafId = 0
		const update = () => {
			for (const p of particles) {
				p.y += p.velocityY
				p.x += p.velocityX
				p.tiltAngle += 0.05
				p.tilt = Math.sin(p.tiltAngle) * 15
				if (p.y > canvas.height) {
					p.y = -10
					p.x = Math.random() * canvas.width
				}
			}
		}
		const draw = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height)
			for (const p of particles) {
				ctx.beginPath()
				ctx.lineWidth = p.size
				ctx.strokeStyle = p.strokeColor
				ctx.moveTo(p.x + p.tilt + p.size / 2, p.y)
				ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.size / 2)
				ctx.stroke()
			}
			update()
			rafId = requestAnimationFrame(draw)
		}
		draw()
		return () => {
			cancelAnimationFrame(rafId)
			canvas.remove()
		}
	}, [isOpen, shouldConfetti, colors, particleCount])

	if (!isOpen) return null

	return (
		<div className='result-overlay' role='dialog' aria-modal='true' aria-label={finalAriaLabel}>
			<div className={`result-card ${variant === 'lose' ? 'is-lose' : 'is-win'}`}>
				<div className='result-emoji' aria-hidden>
					{finalEmoji}
				</div>
				<h2>{finalTitle}</h2>
				<p>{finalMessage}</p>
				<div className='result-actions'>
					<button className='btn' onClick={onClose}>
						{finalCloseLabel}
					</button>
					<button className='btn primary' onClick={onPrimary}>
						{finalPrimaryLabel}
					</button>
				</div>
			</div>
		</div>
	)
}
