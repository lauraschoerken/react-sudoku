import './VictoryOverlayComponent.scss'

import { useEffect } from 'react'

export type VictoryOverlayProps = {
	isOpen: boolean
	onClose: () => void
	onNewGame: () => void
	title?: string
	message?: string
	closeLabel?: string
	newGameLabel?: string
	ariaLabel?: string
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

const DEFAULT_COLORS = [
	'#f94144',
	'#f3722c',
	'#f8961e',
	'#90be6d',
	'#577590',
	'#277da1',
	'#f9c74f',
] as const

/**
 * Componente de overlay de victoria para Sudoku.
 *
 * - Muestra una tarjeta centrada con título, mensaje, emoji y botones de acción.
 * - Genera una animación de confeti en un canvas sobre la pantalla mientras esté abierto.
 * - El confeti desaparece automáticamente al cerrar el overlay.
 *
 * ### Ejemplo de uso
 * ```tsx
 * <VictoryOverlay
 *   isOpen={showOverlay}
 *   onClose={() => setShowOverlay(false)}
 *   onNewGame={startNewSudoku}
 *   title="¡Buen trabajo!"
 *   message="Has completado el puzzle."
 * />
 * ```
 */
export const VictoryOverlay = ({
	isOpen,
	onClose,
	onNewGame,
	title = '¡Enhorabuena!',
	message = 'Has completado el sudoku sin errores.',
	closeLabel = 'Cerrar',
	newGameLabel = 'Nueva partida',
	ariaLabel = 'Sudoku completado',
	confettiColors = DEFAULT_COLORS,
	particleCount = 150,
}: VictoryOverlayProps) => {
	useEffect(() => {
		if (!isOpen) return

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
			strokeColor: confettiColors[Math.floor(Math.random() * confettiColors.length)],
			tilt: Math.random() * 10 - 10,
			tiltAngle: 0,
			velocityX: Math.random() - 0.5,
			velocityY: 2 + Math.random() * 3,
		}))

		let rafId = 0

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

		draw()

		return () => {
			cancelAnimationFrame(rafId)
			canvas.remove()
		}
	}, [isOpen, confettiColors, particleCount])

	if (!isOpen) return null

	return (
		<div className='win-overlay' role='dialog' aria-modal='true' aria-label={ariaLabel}>
			<div className='win-card'>
				<div className='win-emoji' aria-hidden>
					🎉
				</div>
				<h2>{title}</h2>
				<p>{message}</p>
				<div className='win-actions'>
					<button className='btn' onClick={onClose}>
						{closeLabel}
					</button>
					<button className='btn primary' onClick={onNewGame}>
						{newGameLabel}
					</button>
				</div>
			</div>
		</div>
	)
}
