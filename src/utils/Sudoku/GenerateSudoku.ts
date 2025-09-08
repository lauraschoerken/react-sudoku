import type { Board, Cell } from '@/models/components/Sudoku'

const shuffleArray = (array: number[]): number[] => {
	const copy = array.slice()
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[copy[i], copy[j]] = [copy[j], copy[i]]
	}
	return copy
}

const createEmptyBoard = (size: number): Board => {
	return Array.from({ length: size }, () => Array(size).fill(0))
}

const isPlacementSafe = (
	board: Board,
	rowIndex: number,
	colIndex: number,
	value: number,
	size: number,
	sub: number
): boolean => {
	for (let k = 0; k < size; k++) {
		if (board[rowIndex][k] === value) return false
		if (board[k][colIndex] === value) return false
	}
	const startRow = Math.floor(rowIndex / sub) * sub
	const startCol = Math.floor(colIndex / sub) * sub
	for (let i = 0; i < sub; i++) {
		for (let j = 0; j < sub; j++) {
			if (board[startRow + i][startCol + j] === value) return false
		}
	}
	return true
}

const findNextEmptyCell = (board: Board, size: number): Cell | null => {
	for (let rowIndex = 0; rowIndex < size; rowIndex++) {
		for (let colIndex = 0; colIndex < size; colIndex++) {
			if (board[rowIndex][colIndex] === 0) {
				return [rowIndex, colIndex]
			}
		}
	}
	return null
}

const makeCandidatesList = (size: number): number[] => {
	return Array.from({ length: size }, (_, i) => i + 1)
}

const solveWithBacktracking = (board: Board, size: number, sub: number): boolean => {
	const cell = findNextEmptyCell(board, size)
	if (!cell) return true
	const [rowIndex, colIndex] = cell
	for (const candidate of shuffleArray(makeCandidatesList(size))) {
		if (isPlacementSafe(board, rowIndex, colIndex, candidate, size, sub)) {
			board[rowIndex][colIndex] = candidate
			if (solveWithBacktracking(board, size, sub)) return true
			board[rowIndex][colIndex] = 0
		}
	}
	return false
}

export const generateCompletedSudoku = (size: number, sub: number): Board => {
	const board = createEmptyBoard(size)
	solveWithBacktracking(board, size, sub)
	return board
}
