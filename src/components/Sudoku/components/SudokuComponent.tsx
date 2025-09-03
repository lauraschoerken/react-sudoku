import './SudokuComponent.scss'

import { useState } from 'react'

import type { Board, Cell } from '@/models/components/Sudoku'

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
	// fila y columna
	for (let k = 0; k < size; k++) {
		if (board[rowIndex][k] === value) return false
		if (board[k][colIndex] === value) return false
	}

	// subcuadro
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

export default function SudokuComponent() {
	const [subgridSize, setSubgridSize] = useState<number>(3)
	const gridSize = subgridSize * subgridSize
	const [grid, setGrid] = useState<Board>(() => generateCompletedSudoku(gridSize, subgridSize))

	const handleNew = (): void => {
		setGrid(generateCompletedSudoku(gridSize, subgridSize))
	}

	const handleChangeSize = (e: React.ChangeEvent<HTMLSelectElement>): void => {
		const next = parseInt(e.target.value, 10)
		const nextGridSize = next * next
		setSubgridSize(next)
		setGrid(generateCompletedSudoku(nextGridSize, next))
	}

	return (
		<div>
			<div className='sudoku-toolbar' role='toolbar' aria-label='Controles de sudoku'>
				<button className='btn primary' onClick={handleNew}>
					Nuevo
				</button>
				<label className='sudoku-size'>
					Tamaño:
					<select value={subgridSize} onChange={handleChangeSize}>
						<option value={2}>2×2</option>
						<option value={3}>3×3</option>
						<option value={4}>4×4</option>
					</select>
				</label>
			</div>

			<div className='sudoku-wrap'>
				<table className='sudoku' data-subgrid={subgridSize}>
					<tbody>
						{grid.map((row, r) => (
							<tr key={r}>
								{row.map((v, c) => (
									<td key={c}>{v}</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}
