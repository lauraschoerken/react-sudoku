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

// --- ocultar celdas según porcentaje ---
function hideCells(board: Board, subgridSize: number, percentHidden: number): Board {
	const size = subgridSize * subgridSize
	const totalCells = size * size
	const p = Math.max(0, Math.min(95, percentHidden)) // acotar por seguridad
	const cellsToHide = Math.floor(totalCells * (p / 100))

	// lista de índices 0..totalCells-1 y barajar
	const indices = Array.from({ length: totalCells }, (_, i) => i)
	for (let i = indices.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[indices[i], indices[j]] = [indices[j], indices[i]]
	}
	const hidden = new Set(indices.slice(0, cellsToHide))

	// aplanar, esconder y reconstruir
	const flat = board.flat()
	const newFlat = flat.map((v, i) => (hidden.has(i) ? 0 : v))
	const newBoard: Board = []
	for (let r = 0; r < size; r++) {
		newBoard.push(newFlat.slice(r * size, (r + 1) * size))
	}
	return newBoard
}

// --- hook público ---
export function useSudoku(initialSubgridSize = 3, initialDifficulty = 70 /* % oculto */) {
	const [subgridSize, setSubgridSize] = useState<number>(initialSubgridSize)
	const [difficulty, setDifficulty] = useState<number>(initialDifficulty) // 0..95 (% de celdas ocultas)
	const gridSize = useMemo(() => subgridSize * subgridSize, [subgridSize])

	const makePuzzle = useCallback(() => {
		const full = generateCompletedSudoku(gridSize, subgridSize)
		return hideCells(full, subgridSize, difficulty)
	}, [gridSize, subgridSize, difficulty])

	const [grid, setGrid] = useState<Board>(() => {
		const full = generateCompletedSudoku(
			initialSubgridSize * initialSubgridSize,
			initialSubgridSize
		)
		return hideCells(full, initialSubgridSize, initialDifficulty)
	})

	const newGame = useCallback(() => {
		setGrid(makePuzzle())
	}, [makePuzzle])

	// Regenerar cuando cambie el tamaño o la dificultad
	useEffect(() => {
		setGrid(makePuzzle())
	}, [makePuzzle])

	return {
		grid,
		subgridSize,
		setSubgridSize,
		gridSize,
		newGame,
		difficulty,
		setDifficulty, // expuesto para el selector
	}
}
