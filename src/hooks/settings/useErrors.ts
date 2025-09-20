import { useCallback } from 'react'

import { toggleErrorsActive } from '@/store/features/settings/settingsSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

export function useErrors() {
	const dispatch = useAppDispatch()
	const errorsActive = useAppSelector((s) => s.settings.errorsActive)

	const toggle = useCallback(() => {
		dispatch(toggleErrorsActive())
	}, [dispatch])

	return { errorsActive, toggleErrorsActive: toggle }
}
