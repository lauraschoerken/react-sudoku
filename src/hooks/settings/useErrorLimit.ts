import { useCallback } from 'react'

import { setErrorsLimit, setErrorsLimiterEnabled } from '@/store/features/settings/settingsSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

export function useErrorLimit() {
	const dispatch = useAppDispatch()
	const errorsLimiterEnabled = useAppSelector((s) => s.settings.errorsLimiterEnabled)
	const errorsLimit = useAppSelector((s) => s.settings.errorsLimit)

	const setEnabled = useCallback(
		(enabled: boolean) => {
			dispatch(setErrorsLimiterEnabled(enabled))
		},
		[dispatch]
	)

	const setLimit = useCallback(
		(limit: number) => {
			dispatch(setErrorsLimit(limit))
		},
		[dispatch]
	)

	return {
		errorsLimiterEnabled,
		errorsLimit,
		setErrorsLimiterEnabled: setEnabled,
		setErrorsLimit: setLimit,
	}
}
