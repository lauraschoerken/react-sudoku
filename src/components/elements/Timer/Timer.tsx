import { useEffect } from 'react'

import { type TimerMode, useDigitalTimer } from '@/hooks/useTimer'

import CountdownDial from './CountdownDial'
import LcdDisplay from './LcdDisplay'

export interface DigitalTimerProps {
	mode: TimerMode
	seconds?: number
	autoStart?: boolean
	running?: boolean
	resetSignal?: number
	onFinish?: () => void
	forceHours?: boolean
	className?: string
	showControls?: boolean
	labels?: Partial<{
		start: string
		resume: string
		pause: string
		reset: string
		stop: string
	}>
}

export default function DigitalTimer({
	mode,
	seconds,
	autoStart,
	running,
	resetSignal,
	onFinish,
	forceHours,
	className,
}: DigitalTimerProps) {
	const { shownSeconds, isRunning, start, pause, resume, setShownSeconds, addSeconds } =
		useDigitalTimer({ mode, seconds, autoStart, running, onFinish })

	// Sincroniza ejecución con `running`
	useEffect(() => {
		if (running === undefined) return
		if (running) {
			if (mode === 'normal' && shownSeconds === 0) start()
			else resume()
		} else {
			pause()
		}
	}, [running, mode, shownSeconds])

	// Reset externo — asegura usar el `seconds`/`mode` actuales
	useEffect(() => {
		if (resetSignal === undefined) return
		if (mode === 'countdown') {
			setShownSeconds(seconds ?? 0)
		} else {
			setShownSeconds(0)
		}
		pause() // queda pausado; el padre decide cuándo reanudar con `running`
	}, [resetSignal, mode, seconds])

	const toggleStartStop = () => {
		if (isRunning) pause()
		else {
			if (shownSeconds === 0 && mode === 'normal') start()
			else resume()
		}
	}
	const addMinute = () => addSeconds(60)
	const addSecond = () => addSeconds(1)
	const clearAll = () => setShownSeconds(0)

	return (
		<div className={className}>
			{mode === 'countdown' ? (
				<CountdownDial total={seconds ?? 0} remaining={shownSeconds} />
			) : (
				<LcdDisplay
					seconds={shownSeconds}
					forceHours={forceHours}
					running={isRunning}
					onToggleStartStop={toggleStartStop}
					onClear={clearAll}
					onAddMinute={addMinute}
					onAddSecond={addSecond}
				/>
			)}
		</div>
	)
}
