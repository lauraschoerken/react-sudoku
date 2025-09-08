import type { Lang } from '@/models/utils/Lang'

export const APP_NAME = import.meta.env.VITE_APP_NAME

export const AVAILABLE_LANGS: Lang[] = [
	{ code: 'es', label: 'ES · Español' },
	{ code: 'en', label: 'EN · English' },
	// { code: 'de', label: 'DE · Deutsch' },
	// { code: 'fr', label: 'FR · Français' },
]

export const DIFFICULTY_ENTRIES: ReadonlyArray<readonly [string, number]> = [
	['Easy', 8],
	['Medium', 57],
	['Hard', 65],
	['Expert', 70],
]

export const SUBGRID_SIZE_ENTRIES: ReadonlyArray<readonly [string, number]> = [
	['Mini', 2],
	['Classic', 3],
	['Large', 4],
]
