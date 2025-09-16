import { type TimerMode, useDigitalTimer } from '@/hooks/useTimer'

import CountdownDial from './CountdownDial'
import LcdDisplay from './LcdDisplay'
export interface DigitalTimerProps {
	mode: TimerMode
	seconds?: number
	autoStart?: boolean
	running?: boolean
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
	onFinish,
	forceHours,
	className,
}: DigitalTimerProps) {
	const { shownSeconds, isRunning, start, pause, resume, setShownSeconds, addSeconds } =
		useDigitalTimer({ mode, seconds, autoStart, running, onFinish })

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
				<>
					<CountdownDial total={seconds ?? 0} remaining={shownSeconds} />
				</>
			) : (
				<>
					<LcdDisplay
						seconds={shownSeconds}
						forceHours={forceHours}
						running={isRunning}
						onToggleStartStop={toggleStartStop}
						onClear={clearAll}
						onAddMinute={addMinute}
						onAddSecond={addSecond}
					/>
				</>
			)}
		</div>
	)
}
