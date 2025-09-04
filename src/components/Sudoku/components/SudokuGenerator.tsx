// ./SudokuGenerator.ts
import { useCallback, useEffect, useMemo, useState } from 'react'

import type { Board, Cell } from '@/models/components/Sudoku'

// --- lógica interna (igual que ya tenías) ---
function createEmptyBoard(size: number): Board {
	return Array.from({ length: size }, () => Array(size).fill(0))
}
function shuffleArray(array: number[]): number[] {
	const copy = array.slice()
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[copy[i], copy[j]] = [copy[j], copy[i]]
	}
	return copy
}
function isPlacementSafe(
	board: Board,
	rowIndex: number,
	colIndex: number,
	value: number,
	size: number,
	sub: number
): boolean {
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
function findNextEmptyCell(board: Board, size: number): Cell | null {
	for (let r = 0; r < size; r++) {
		for (let c = 0; c < size; c++) {
			if (board[r][c] === 0) return [r, c]
		}
	}
	return null
}
function makeCandidatesList(size: number): number[] {
	return Array.from({ length: size }, (_, i) => i + 1)
}
function solveWithBacktracking(board: Board, size: number, sub: number): boolean {
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
function generateCompletedSudoku(size: number, sub: number): Board {
	const board = createEmptyBoard(size)
	solveWithBacktracking(board, size, sub)
	return board
}

function hideCells(board: Board, subgridSize: number, percentHidden: number): Board {
	const size = subgridSize * subgridSize
	const totalCells = size * size
	const p = Math.max(0, Math.min(95, percentHidden))
	const cellsToHide = Math.floor(totalCells * (p / 100))

	const indices = Array.from({ length: totalCells }, (_, i) => i)
	for (let i = indices.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[indices[i], indices[j]] = [indices[j], indices[i]]
	}
	const hidden = new Set(indices.slice(0, cellsToHide))
	const flat = board.flat()
	const newFlat = flat.map((v, i) => (hidden.has(i) ? 0 : v))
	const newBoard: Board = []
	for (let r = 0; r < size; r++) {
		newBoard.push(newFlat.slice(r * size, (r + 1) * size))
	}
	return newBoard
}
export function useSudoku(initialSubgridSize = 3, initialDifficulty = 60) {
	const [subgridSize, setSubgridSize] = useState<number>(initialSubgridSize)
	const [difficulty, setDifficulty] = useState<number>(initialDifficulty)
	const gridSize = useMemo(() => subgridSize * subgridSize, [subgridSize])

	const [solution, setSolution] = useState<Board>(() =>
		generateCompletedSudoku(initialSubgridSize * initialSubgridSize, initialSubgridSize)
	)
	const [puzzle, setPuzzle] = useState<Board>(() =>
		hideCells(solution, initialSubgridSize, initialDifficulty)
	)
	// Lo que escribe el usuario (arranca igual que el puzzle)
	const [userGrid, setUserGrid] = useState<Board>(() => puzzle.map((row) => row.slice()))
	// Errores por celda
	const [errors, setErrors] = useState<boolean[][]>(() => puzzle.map((row) => row.map(() => false)))

	const regenerate = useCallback(() => {
		const full = generateCompletedSudoku(gridSize, subgridSize)
		const hid = hideCells(full, subgridSize, difficulty)
		setSolution(full)
		setPuzzle(hid)
		setUserGrid(hid.map((r) => r.slice()))
		setErrors(hid.map((row) => row.map(() => false)))
	}, [gridSize, subgridSize, difficulty])

	const newGame = useCallback(() => {
		regenerate()
	}, [regenerate])

	useEffect(() => {
		regenerate()
	}, [regenerate])

	const setCell = useCallback(
		(r: number, c: number, value: number | null) => {
			// Si es celda dada, no permitir cambios
			if (puzzle[r][c] !== 0) return

			setUserGrid((prev) => {
				const copy = prev.map((row) => row.slice())
				copy[r][c] = value && value >= 1 ? value : 0
				return copy
			})

			setErrors((prev) => {
				const copy = prev.map((row) => row.slice())
				if (!value || value < 1) {
					copy[r][c] = false
				} else {
					copy[r][c] = value !== solution[r][c]
				}
				return copy
			})
		},
		[puzzle, solution]
	)

	return {
		// antes devolvías "grid"; ahora devolvemos puzzle y userGrid (para pintar)
		puzzle,
		solution,
		userGrid,
		errors,
		setCell,

		subgridSize,
		setSubgridSize,
		gridSize,

		newGame,
		difficulty,
		setDifficulty,
	}
}
