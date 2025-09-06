import './VictoryOverlayComponent.scss'

import { useEffect } from 'react'
type VictoryOverlayProps = {
	isOpen: boolean
	onClose: () => void
	onNewGame: () => void
}

type Particle = {
	x: number
	y: number
	r: number
	color: string
	tilt: number
	tiltAngle: number
	dx: number
	dy: number
}

export const VictoryOverlay = ({ isOpen, onClose, onNewGame }: VictoryOverlayProps) => {
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
		const colors = [
			'#f94144',
			'#f3722c',
			'#f8961e',
			'#90be6d',
			'#577590',
			'#277da1',
			'#f9c74f',
			// '#43aa8b',
			// '#FFC0CB',
			// '#8000FF',
		]

		const particles: Particle[] = Array.from({ length: 150 }, () => ({
			x: Math.random() * canvas.width,
			y: Math.random() * canvas.height - canvas.height,
			r: 5 + Math.random() * 5,
			color: colors[Math.floor(Math.random() * colors.length)],
			tilt: Math.random() * 10 - 10,
			tiltAngle: 0,
			dx: Math.random() - 0.5,
			dy: 2 + Math.random() * 3,
		}))

		let animationFrame: number

		const draw = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height)
			particles.forEach((p) => {
				ctx.beginPath()
				ctx.lineWidth = p.r
				ctx.strokeStyle = p.color
				ctx.moveTo(p.x + p.tilt + p.r / 2, p.y)
				ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2)
				ctx.stroke()
			})
			update()
			animationFrame = requestAnimationFrame(draw)
		}

		const update = () => {
			particles.forEach((p) => {
				p.y += p.dy
				p.x += p.dx
				p.tiltAngle += 0.05
				p.tilt = Math.sin(p.tiltAngle) * 15

				if (p.y > canvas.height) {
					p.y = -10
					p.x = Math.random() * canvas.width
				}
			})
		}

		draw()

		return () => {
			cancelAnimationFrame(animationFrame)
			canvas.remove()
		}
	}, [isOpen])

	if (!isOpen) return null

	return (
		<div className='win-overlay' role='dialog' aria-modal='true' aria-label='Sudoku completado'>
			<div className='win-card'>
				<div className='win-emoji' aria-hidden>
					🎉
				</div>
				<h2>¡Enhorabuena!</h2>
				<p>Has completado el sudoku sin errores.</p>
				<div className='win-actions'>
					<button className='btn' onClick={onClose}>
						Cerrar
					</button>
					<button className='btn primary' onClick={onNewGame}>
						Nueva partida
					</button>
				</div>
			</div>
		</div>
	)
}
