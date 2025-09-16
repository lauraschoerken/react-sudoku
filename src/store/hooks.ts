import type { TypedUseSelectorHook } from 'react-redux'
import { useDispatch, useSelector } from 'react-redux'

import type { AppDispatch, RootState } from './index'

// ✅ useDispatch tipado
export const useAppDispatch: () => AppDispatch = useDispatch

// ✅ useSelector tipado
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
