import { DIFFICULTY_ENTRIES } from '@/utils/constants'

export type DifficultyName = (typeof DIFFICULTY_ENTRIES)[number][0]
export type Difficulty = (typeof DIFFICULTY_ENTRIES)[number][1]

export const DifficultyLevels = Object.fromEntries(DIFFICULTY_ENTRIES) as Record<
	DifficultyName,
	Difficulty
>

export const DifficultyOptions = DIFFICULTY_ENTRIES
