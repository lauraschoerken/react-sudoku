import { useCallback } from 'react'

import {
	setTimerEnabled,
	setTimerMode,
	setTimerSeconds,
} from '@/store/features/settings/settingsSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

export function useTimer() {
	const dispatch = useAppDispatch()
	const timerEnabled = useAppSelector((s) => s.settings.timerEnabled)
	const timerMode = useAppSelector((s) => s.settings.timerMode)
	const timerSeconds = useAppSelector((s) => s.settings.timerSeconds) // 👈

	const setEnabled = useCallback(
		(enabled: boolean) => {
			dispatch(setTimerEnabled(enabled))
		},
		[dispatch]
	)

	const setMode = useCallback(
		(mode: 'countdown' | 'normal') => {
			dispatch(setTimerMode(mode))
		},
		[dispatch]
	)

	const setSeconds = useCallback(
		(secs: number) => {
			// normaliza en el hook por si acaso
			const safe = Math.max(1, Math.floor(secs || 1))
			dispatch(setTimerSeconds(safe))
		},
		[dispatch]
	)

	return {
		timerEnabled,
		timerMode,
		timerSeconds, // 👈
		setTimerEnabled: setEnabled,
		setTimerMode: setMode,
		setTimerSeconds: setSeconds, // 👈
	}
}
