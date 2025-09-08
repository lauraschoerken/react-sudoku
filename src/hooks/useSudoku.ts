import { useCallback, useEffect, useMemo, useState } from 'react'

import type { Board } from '@/models/components/Sudoku'
import { type Difficulty, DifficultyLevels } from '@/models/utils/Difficulty'
import { type SubgridSize, SubgridSizes } from '@/models/utils/Size'
import {
	createEmptyErrorGrid,
	generateCompletedSudoku,
	getCellsToHide,
	hideCells,
	validateCell,
} from '@/utils/Sudoku'

/**
 * Custom React hook para manejar la lógica principal de un Sudoku:
 * - Generar solución completa.
 * - Ocultar celdas según la dificultad.
 * - Permitir al usuario introducir valores.
 * - Validar errores en tiempo real.
 *
 * @param initialSubgridSize Tamaño inicial de subcuadrícula (ej. 3 para Sudoku clásico 9x9).
 * @param initialDifficulty Dificultad inicial (ej. Fácil, Media, Difícil, Experto).
 *
 * @returns Objeto con:
 * - `puzzle`: tablero con las celdas ocultas (juego actual).
 * - `solution`: tablero solución completa.
 * - `userGrid`: tablero con los valores introducidos por el jugador.
 * - `errors`: matriz booleana de errores por celda.
 * - `setCell(row, col, value)`: función para modificar una celda del tablero de usuario.
 * - `newGame()`: genera un nuevo Sudoku con la configuración actual.
 * - `subgridSize`: tamaño actual de la subcuadrícula.
 * - `setSubgridSize()`: setter para cambiar el tamaño de subcuadrícula.
 * - `gridSize`: tamaño total del tablero (subgridSize²).
 * - `difficulty`: dificultad actual.
 * - `setDifficulty()`: setter para cambiar la dificultad.
 * - `isGivenCell(row, col)`: true si la celda es fija (forma parte del puzzle original).
 */
export const useSudoku = (
	initialSubgridSize: SubgridSize = SubgridSizes.Classic,
	initialDifficulty: Difficulty = DifficultyLevels.Medium
) => {
	const [subgridSize, setSubgridSize] = useState(initialSubgridSize)
	const [difficulty, setDifficulty] = useState(initialDifficulty)
	const gridSize = useMemo(() => subgridSize * subgridSize, [subgridSize])

	const [solutionGrid, setSolutionGrid] = useState<Board>(() =>
		generateCompletedSudoku(gridSize, subgridSize)
	)
	const [puzzleGrid, setPuzzleGrid] = useState<Board>(() =>
		hideCells(solutionGrid, subgridSize, getCellsToHide(initialDifficulty))
	)
	const [playerGrid, setPlayerGrid] = useState<Board>(() => puzzleGrid.map((row) => row.slice()))
	const [errorGrid, setErrorGrid] = useState<boolean[][]>(() => createEmptyErrorGrid(puzzleGrid))

	const regenerateGrids = useCallback(() => {
		const fullSolution = generateCompletedSudoku(gridSize, subgridSize)
		const puzzle = hideCells(fullSolution, subgridSize, getCellsToHide(difficulty))

		setSolutionGrid(fullSolution)
		setPuzzleGrid(puzzle)
		setPlayerGrid(puzzle.map((r) => r.slice()))
		setErrorGrid(createEmptyErrorGrid(puzzle))
	}, [gridSize, subgridSize, difficulty])

	useEffect(() => {
		regenerateGrids()
	}, [regenerateGrids])

	const isGivenCell = useCallback(
		(rowIndex: number, colIndex: number) => puzzleGrid[rowIndex][colIndex] !== 0,
		[puzzleGrid]
	)

	const setCellValue = useCallback(
		(rowIndex: number, colIndex: number, value: number | null | undefined) => {
			if (isGivenCell(rowIndex, colIndex)) return

			const nextValue = value && value >= 1 ? value : 0

			setPlayerGrid((prev) => {
				const copy = prev.map((row) => row.slice())
				copy[rowIndex][colIndex] = nextValue
				return copy
			})

			setErrorGrid((prev) => {
				const copy = prev.map((row) => row.slice())
				copy[rowIndex][colIndex] =
					nextValue !== 0 ? validateCell(rowIndex, colIndex, nextValue, solutionGrid) : false
				return copy
			})
		},
		[isGivenCell, solutionGrid]
	)

	return {
		puzzle: puzzleGrid,
		solution: solutionGrid,
		userGrid: playerGrid,
		errors: errorGrid,
		setCell: setCellValue,
		newGame: regenerateGrids,
		subgridSize,
		setSubgridSize,
		gridSize,
		difficulty,
		setDifficulty,
		isGivenCell,
	}
}
