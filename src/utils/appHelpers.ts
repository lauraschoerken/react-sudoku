import type { Board } from '@/models/components/Sudoku'
import type { GameStatus } from '@/services/sudokuApi'

type ApiDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'

export const formatDuration = (seconds?: number | null) => {
	if (!seconds || seconds <= 0) return '—'
	const minutes = Math.floor(seconds / 60)
	const remainingSeconds = seconds % 60
	if (minutes === 0) return `${remainingSeconds}s`
	if (remainingSeconds === 0) return `${minutes}m`
	return `${minutes}m ${remainingSeconds}s`
}

export const translateStatus = (status: GameStatus) => {
	const labels: Record<GameStatus, string> = {
		IN_PROGRESS: 'En curso',
		PAUSED: 'Pausado',
		WON: 'Ganado',
		LOST: 'Perdido',
		ABANDONED: 'Abandonado',
	}
	return labels[status]
}

export const translateDifficulty = (difficulty: ApiDifficulty | string) => {
	const labels: Record<ApiDifficulty, string> = {
		EASY: 'Fácil',
		MEDIUM: 'Medio',
		HARD: 'Difícil',
		EXPERT: 'Experto',
	}
	return labels[difficulty as ApiDifficulty] ?? difficulty
}

export const localTodayKey = () => {
	const today = new Date()
	const year = today.getFullYear()
	const month = String(today.getMonth() + 1).padStart(2, '0')
	const day = String(today.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

export const isBoardValidSolution = (board: Board, puzzle: Board, subgridSize: number) => {
	const size = subgridSize * subgridSize
	if (board.length !== size || puzzle.length !== size) return false

	for (let row = 0; row < size; row++) {
		if (board[row]?.length !== size || puzzle[row]?.length !== size) return false
		for (let col = 0; col < size; col++) {
			const value = board[row][col]
			const given = puzzle[row][col]
			if (!Number.isInteger(value) || value < 1 || value > size) return false
			if (given !== 0 && value !== given) return false
		}
	}

	for (let index = 0; index < size; index++) {
		if (!containsAllValues(board[index], size)) return false
		if (!containsAllValues(board.map((row) => row[index]), size)) return false
	}

	for (let boxRow = 0; boxRow < size; boxRow += subgridSize) {
		for (let boxCol = 0; boxCol < size; boxCol += subgridSize) {
			const values: number[] = []
			for (let row = 0; row < subgridSize; row++) {
				for (let col = 0; col < subgridSize; col++) {
					values.push(board[boxRow + row][boxCol + col])
				}
			}
			if (!containsAllValues(values, size)) return false
		}
	}

	return true
}

const containsAllValues = (values: number[], size: number) => {
	if (values.length !== size) return false
	const seen = new Set(values)
	if (seen.size !== size) return false
	for (let value = 1; value <= size; value++) {
		if (!seen.has(value)) return false
	}
	return true
}
