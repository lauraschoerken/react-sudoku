import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type TimerMode = 'normal' | 'countdown'

export interface UseDigitalTimerOptions {
	mode: TimerMode
	seconds?: number
	initialSeconds?: number
	autoStart?: boolean
	running?: boolean
	onFinish?: () => void
	onTick?: (shownSeconds: number) => void
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
	initialSeconds = 0,
	autoStart = true,
	running,
	onFinish,
	onTick,
}: UseDigitalTimerOptions): UseDigitalTimerReturn => {
	if (mode === 'countdown' && (seconds == null || seconds < 0)) {
		throw new Error('useDigitalTimer: "seconds" es obligatorio y >= 0 cuando mode="down".')
	}

	const controlled = typeof running === 'boolean'
	const [isRunning, setIsRunning] = useState<boolean>(controlled ? !!running : autoStart)
	const initialSecondsRef = useRef(Math.max(0, initialSeconds))
	const [elapsed, setElapsed] = useState<number>(initialSecondsRef.current)
	const tickRef = useRef<number | null>(null)

	useEffect(() => {
		if (controlled) setIsRunning(!!running)
	}, [controlled, running])

	useEffect(() => {
		setElapsed(initialSecondsRef.current)
		if (!controlled) setIsRunning(autoStart)
	}, [mode, seconds, autoStart, controlled])

	useEffect(() => {
		if (!isRunning) {
			if (tickRef.current) clearInterval(tickRef.current)
			tickRef.current = null
			return
		}
		tickRef.current = window.setInterval(() => {
			setElapsed((v) => {
				const nextElapsed = v + 1
				const nextShown = mode === 'countdown' ? Math.max(0, (seconds as number) - nextElapsed) : nextElapsed
				onTick?.(nextShown)
				return nextElapsed
			})
		}, 1000) as unknown as number

		return () => {
			if (tickRef.current) clearInterval(tickRef.current)
			tickRef.current = null
		}
	}, [isRunning, mode, onTick, seconds])

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

	const start = useCallback(() => {
		if (!controlled) setIsRunning(true)
	}, [controlled])
	const pause = useCallback(() => {
		if (!controlled) setIsRunning(false)
	}, [controlled])
	const resume = useCallback(() => {
		if (!controlled) setIsRunning(true)
	}, [controlled])
	const reset = () => {
		setElapsed(0)
	}
	const stop = () => {
		setElapsed(0)
		if (!controlled) setIsRunning(false)
	}

	const setShownSeconds = useCallback((value: number) => {
		if (mode === 'normal') {
			setElapsed(Math.max(0, Math.floor(value)))
		} else {
			setElapsed(Math.max(0, (seconds as number) - Math.floor(value)))
		}
	}, [mode, seconds])
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
