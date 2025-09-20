import { useCallback } from 'react'

import { setTimerEnabled, setTimerMode } from '@/store/features/settings/settingsSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

export function useTimer() {
	const dispatch = useAppDispatch()
	const timerEnabled = useAppSelector((s) => s.settings.timerEnabled)
	const timerMode = useAppSelector((s) => s.settings.timerMode)

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

	return {
		timerEnabled,
		timerMode,
		setTimerEnabled: setEnabled,
		setTimerMode: setMode,
	}
}
