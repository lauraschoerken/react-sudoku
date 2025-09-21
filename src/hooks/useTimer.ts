import { useEffect, useMemo, useRef, useState } from 'react'

export type TimerMode = 'normal' | 'countdown'

export interface UseDigitalTimerOptions {
	mode: TimerMode
	seconds?: number
	autoStart?: boolean
	running?: boolean
	onFinish?: () => void
}

export interface UseDigitalTimerReturn {
	shownSeconds: number
	isRunning: boolean
	start: () => void
	pause: () => void
	resume: () => void
	reset: () => void
	stop: () => void
	setShownSeconds: (value: number) => void
	addSeconds: (delta: number) => void
}

export const useDigitalTimer = ({
	mode,
	seconds,
	autoStart = true,
	running,
	onFinish,
}: UseDigitalTimerOptions): UseDigitalTimerReturn => {
	if (mode === 'countdown' && (seconds == null || seconds < 0)) {
		throw new Error('useDigitalTimer: "seconds" es obligatorio y >= 0 cuando mode="down".')
	}

	const controlled = typeof running === 'boolean'
	const [isRunning, setIsRunning] = useState<boolean>(controlled ? !!running : autoStart)
	const [elapsed, setElapsed] = useState<number>(0)
	const tickRef = useRef<number | null>(null)

	useEffect(() => {
		if (controlled) setIsRunning(!!running)
	}, [controlled, running])

	useEffect(() => {
		setElapsed(0)
		if (!controlled) setIsRunning(autoStart)
	}, [mode, seconds, autoStart, controlled])

	useEffect(() => {
		if (!isRunning) {
			if (tickRef.current) clearInterval(tickRef.current)
			tickRef.current = null
			return
		}
		tickRef.current = window.setInterval(() => {
			setElapsed((v) => v + 1)
		}, 1000) as unknown as number

		return () => {
			if (tickRef.current) clearInterval(tickRef.current)
			tickRef.current = null
		}
	}, [isRunning])

	const shownSeconds = useMemo(
		() => (mode === 'countdown' ? Math.max(0, (seconds as number) - elapsed) : elapsed),
		[mode, seconds, elapsed]
	)

	useEffect(() => {
		if (mode === 'countdown' && shownSeconds <= 0 && isRunning) {
			onFinish?.()
			if (!controlled) setIsRunning(false)
		}
	}, [shownSeconds, isRunning, mode, onFinish, controlled])

	const start = () => {
		if (!controlled) setIsRunning(true)
	}
	const pause = () => {
		if (!controlled) setIsRunning(false)
	}
	const resume = () => {
		if (!controlled) setIsRunning(true)
	}
	const reset = () => {
		setElapsed(0)
	}
	const stop = () => {
		setElapsed(0)
		if (!controlled) setIsRunning(false)
	}

	const setShownSeconds = (value: number) => {
		if (mode === 'normal') {
			setElapsed(Math.max(0, Math.floor(value)))
		}
	}
	const addSeconds = (delta: number) => {
		if (mode === 'normal') {
			setElapsed((v) => Math.max(0, v + delta))
		}
	}

	return {
		shownSeconds,
		isRunning,
		start,
		pause,
		resume,
		reset,
		stop,
		setShownSeconds,
		addSeconds,
	}
}
