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
import { createGame, finishGame, pauseGame, requestHint, resumeGame, updateCell, updateNotes } from '@/services/sudokuApi'
import type { GameStatus } from '@/services/sudokuApi'

interface UseSudokuOptions {
	userId?: number
	errorWarningsEnabled?: boolean
	maxErrors?: number
	timerMode?: 'normal' | 'countdown'
	countdownSeconds?: number
}

const noteKey = (rowIndex: number, colIndex: number) => `${rowIndex}:${colIndex}`

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
	initialDifficulty: Difficulty = DifficultyLevels.Medium,
	options: UseSudokuOptions = {}
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
	const [gameId, setGameId] = useState<number | null>(null)
	const [usingBackend, setUsingBackend] = useState(false)
	const [backendMistakes, setBackendMistakes] = useState(0)
	const [hintsUsed, setHintsUsed] = useState(0)
	const [notes, setNotes] = useState<Record<string, number[]>>({})
	const [gameStatus, setGameStatus] = useState<GameStatus>('IN_PROGRESS')

	const regenerateGrids = useCallback(() => {
		const fullSolution = generateCompletedSudoku(gridSize, subgridSize)
		const puzzle = hideCells(fullSolution, subgridSize, getCellsToHide(difficulty))

		setSolutionGrid(fullSolution)
		setPuzzleGrid(puzzle)
		setPlayerGrid(puzzle.map((r) => r.slice()))
		setErrorGrid(createEmptyErrorGrid(puzzle))
		setGameId(null)
		setUsingBackend(false)
		setBackendMistakes(0)
		setHintsUsed(0)
		setNotes({})
		setGameStatus('IN_PROGRESS')

		void createGame(subgridSize, difficulty, {
			userId: options.userId,
			timerMode: options.timerMode === 'countdown' ? 'COUNTDOWN' : 'NORMAL',
			countdownSeconds: options.timerMode === 'countdown' ? options.countdownSeconds : undefined,
			maxErrors: options.maxErrors,
			errorWarningsEnabled: options.errorWarningsEnabled,
		})
			.then((game) => {
				setGameId(game.id)
				setUsingBackend(true)
				setPuzzleGrid(game.initialBoard)
				setPlayerGrid(game.currentBoard)
				setErrorGrid(createEmptyErrorGrid(game.currentBoard))
				setBackendMistakes(game.mistakes)
				setHintsUsed(game.hintsUsed)
				setNotes(game.notes ?? {})
				setGameStatus(game.status)
			})
			.catch(() => {
				setUsingBackend(false)
			})
	}, [
		gridSize,
		subgridSize,
		difficulty,
		options.timerMode,
		options.countdownSeconds,
		options.maxErrors,
		options.errorWarningsEnabled,
		options.userId,
	])

	useEffect(() => {
		regenerateGrids()
	}, [regenerateGrids])

	const isGivenCell = useCallback(
		(rowIndex: number, colIndex: number) => puzzleGrid[rowIndex][colIndex] !== 0,
		[puzzleGrid]
	)

	const applyLocalCellValue = useCallback(
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

	const setCellValue = useCallback(
		(rowIndex: number, colIndex: number, value: number | null | undefined) => {
			const nextValue = value && value >= 1 ? value : 0
			if (nextValue !== 0) {
				setNotes((prev) => {
					const key = noteKey(rowIndex, colIndex)
					if (!prev[key]) return prev
					const copy = { ...prev }
					delete copy[key]
					return copy
				})
			}
			if (!usingBackend || gameId === null) {
				applyLocalCellValue(rowIndex, colIndex, nextValue)
				return
			}

			void updateCell(gameId, rowIndex, colIndex, nextValue)
				.then(({ game, correct }) => {
					setPlayerGrid(game.currentBoard)
					setBackendMistakes(game.mistakes)
					setHintsUsed(game.hintsUsed)
					setNotes(game.notes ?? {})
					setGameStatus(game.status)
					setErrorGrid((prev) => {
						const copy = prev.map((row) => row.slice())
						copy[rowIndex][colIndex] = nextValue !== 0 ? !correct : false
						return copy
					})
				})
				.catch(() => {
					applyLocalCellValue(rowIndex, colIndex, nextValue)
				})
		},
		[applyLocalCellValue, gameId, solutionGrid, usingBackend]
	)

	const toggleNote = useCallback(
		(rowIndex: number, colIndex: number, value: number) => {
			if (isGivenCell(rowIndex, colIndex)) return
			if (playerGrid[rowIndex][colIndex] !== 0) return
			if (value < 1 || value > gridSize) return

			const key = noteKey(rowIndex, colIndex)
			const current = notes[key] ?? []
			const next = current.includes(value)
				? current.filter((note) => note !== value)
				: [...current, value].sort((a, b) => a - b)

			setNotes((prev) => {
				const copy = { ...prev }
				if (next.length === 0) delete copy[key]
				else copy[key] = next
				return copy
			})

			if (!usingBackend || gameId === null) return

			void updateNotes(gameId, rowIndex, colIndex, next)
				.then((game) => setNotes(game.notes ?? {}))
				.catch(() => {
					// Keep optimistic local notes if the backend is temporarily unavailable.
				})
		},
		[gameId, gridSize, isGivenCell, notes, playerGrid, usingBackend]
	)

	const requestHintValue = useCallback(() => {
		if (!usingBackend || gameId === null) return

		void requestHint(gameId)
			.then(({ game }) => {
				setPlayerGrid(game.currentBoard)
				setBackendMistakes(game.mistakes)
				setHintsUsed(game.hintsUsed)
				setNotes(game.notes ?? {})
				setGameStatus(game.status)
				setErrorGrid(createEmptyErrorGrid(game.currentBoard))
			})
			.catch(() => {
				// Hint fallback is intentionally skipped; local mode has no persisted hint accounting.
			})
	}, [gameId, usingBackend])

	const finishGameValue = useCallback(
		(status: Exclude<GameStatus, 'IN_PROGRESS' | 'PAUSED'>, elapsedSeconds?: number) => {
			if (!usingBackend || gameId === null) return

			void finishGame(gameId, status, elapsedSeconds)
				.then((game) => {
					setPlayerGrid(game.currentBoard)
					setBackendMistakes(game.mistakes)
					setHintsUsed(game.hintsUsed)
					setNotes(game.notes ?? {})
					setGameStatus(game.status)
				})
				.catch(() => {
					// Finishing is retried by user actions later; keep local end state responsive.
				})
		},
		[gameId, usingBackend]
	)

	const pauseGameValue = useCallback(() => {
		if (!usingBackend || gameId === null) return

		void pauseGame(gameId)
			.then((game) => setGameStatus(game.status))
			.catch(() => {
				// Keep current local status if the backend rejects the transition.
			})
	}, [gameId, usingBackend])

	const resumeGameValue = useCallback(() => {
		if (!usingBackend || gameId === null) return

		void resumeGame(gameId)
			.then((game) => setGameStatus(game.status))
			.catch(() => {
				// Keep current local status if the backend rejects the transition.
			})
	}, [gameId, usingBackend])

	return {
		puzzle: puzzleGrid,
		solution: solutionGrid,
		userGrid: playerGrid,
		errors: errorGrid,
		notes,
		setCell: setCellValue,
		toggleNote,
		newGame: regenerateGrids,
		subgridSize,
		setSubgridSize,
		gridSize,
		difficulty,
		setDifficulty,
		isGivenCell,
		gameId,
		usingBackend,
		gameStatus,
		backendMistakes,
		hintsUsed,
		requestHint: requestHintValue,
		finishGame: finishGameValue,
		pauseGame: pauseGameValue,
		resumeGame: resumeGameValue,
	}
}
