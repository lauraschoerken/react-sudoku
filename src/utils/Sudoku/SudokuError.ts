import type { Board } from '@/models/components/Sudoku'


export const createEmptyErrorGrid = (board: Board): boolean[][] => {
	return board.map((row) => row.map(() => false))
}


export const validateCell = (
	rowIndex: number,
	colIndex: number,
	value: number,
	solution: Board
): boolean => {
	return value !== solution[rowIndex][colIndex]
}
