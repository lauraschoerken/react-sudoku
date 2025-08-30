import { createContext } from 'react'

import type { Theme } from '@/models/utils/Theme'

export const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
	theme: 'light',
	toggle: () => {},
})
