import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

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
import {
	createGame,
	createGameFromPuzzle,
	finishGame,
	generateSudoku,
	getActiveGame,
	getGame,
	pauseGame,
	requestHint,
	resumeGame,
	updateCell,
	updateNotes,
} from '@/services/sudokuApi'
import type { GameStatus } from '@/services/sudokuApi'

interface UseSudokuOptions {
	initialGameId?: number
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
	const [serverPuzzleId, setServerPuzzleId] = useState<number | null>(null)
	const [usingBackend, setUsingBackend] = useState(false)
	const [backendMistakes, setBackendMistakes] = useState(0)
	const [hintsUsed, setHintsUsed] = useState(0)
	const [notes, setNotes] = useState<Record<string, number[]>>({})
	const [gameStatus, setGameStatus] = useState<GameStatus>('IN_PROGRESS')
	const [isDailyGame, setIsDailyGame] = useState(false)
	const suppressNextRegenerateRef = useRef(false)
	const loadedInitialGameIdRef = useRef<number | null>(null)

	const applyBackendGame = useCallback((game: Awaited<ReturnType<typeof getGame>>) => {
		suppressNextRegenerateRef.current = true
		setGameId(game.id)
		setServerPuzzleId(game.puzzleId)
		setUsingBackend(true)
		setSubgridSize(game.subgridSize as SubgridSize)
		setDifficulty(difficultyFromApi(game.difficulty))
		setPuzzleGrid(game.initialBoard)
		setPlayerGrid(game.currentBoard)
		setErrorGrid(createEmptyErrorGrid(game.currentBoard))
		setBackendMistakes(game.mistakes)
		setHintsUsed(game.hintsUsed)
		setNotes(game.notes ?? {})
		setGameStatus(game.status)
		setIsDailyGame(game.dailyGame)
	}, [])

	const applyGeneratedPuzzle = useCallback(async () => {
		try {
			const generated = await generateSudoku(subgridSize, difficulty)
			suppressNextRegenerateRef.current = true
			setServerPuzzleId(generated.id)
			setSubgridSize(generated.subgridSize as SubgridSize)
			setDifficulty(difficultyFromApi(generated.difficulty))
			setSolutionGrid(generated.solution ?? generated.puzzle)
			setPuzzleGrid(generated.puzzle)
			setPlayerGrid(generated.puzzle.map((row) => row.slice()))
			setErrorGrid(createEmptyErrorGrid(generated.puzzle))
			setGameId(null)
			setUsingBackend(false)
			setBackendMistakes(0)
			setHintsUsed(0)
			setNotes({})
			setGameStatus('IN_PROGRESS')
			setIsDailyGame(false)
		} catch {
			const fullSolution = generateCompletedSudoku(gridSize, subgridSize)
			const puzzle = hideCells(fullSolution, subgridSize, getCellsToHide(difficulty))
			setServerPuzzleId(null)
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
			setIsDailyGame(false)
		}
	}, [difficulty, gridSize, subgridSize])

	const loadInitialGrids = useCallback(() => {
		if (suppressNextRegenerateRef.current) {
			suppressNextRegenerateRef.current = false
			return
		}

		if (
			options.initialGameId !== undefined &&
			loadedInitialGameIdRef.current !== options.initialGameId
		) {
			loadedInitialGameIdRef.current = options.initialGameId
			void getGame(options.initialGameId)
				.then(applyBackendGame)
				.catch(() => {
					loadedInitialGameIdRef.current = null
					setUsingBackend(false)
					void applyGeneratedPuzzle()
				})
			return
		}

		if (options.userId) {
			void getActiveGame()
				.then(applyBackendGame)
				.catch(() => {
					void applyGeneratedPuzzle()
				})
			return
		}

		void applyGeneratedPuzzle()
	}, [
		options.userId,
		options.initialGameId,
		applyBackendGame,
		applyGeneratedPuzzle,
	])

	useEffect(() => {
		loadInitialGrids()
	}, [loadInitialGrids])

	const gameOptions = useCallback(() => ({
		userId: options.userId,
		timerMode: options.timerMode === 'countdown' ? 'COUNTDOWN' as const : 'NORMAL' as const,
		countdownSeconds: options.timerMode === 'countdown' ? options.countdownSeconds : undefined,
		maxErrors: options.maxErrors,
		errorWarningsEnabled: options.errorWarningsEnabled,
	}), [
		options.userId,
		options.timerMode,
		options.countdownSeconds,
		options.maxErrors,
		options.errorWarningsEnabled,
	])

	const createBackendGameForCurrentPuzzle = useCallback(async () => {
		const game = serverPuzzleId
			? await createGameFromPuzzle(serverPuzzleId, subgridSize, difficulty, gameOptions())
			: await createGame(subgridSize, difficulty, gameOptions())
		applyBackendGame(game)
		return game
	}, [applyBackendGame, difficulty, gameOptions, serverPuzzleId, subgridSize])

	const createNewGame = useCallback(() => {
		void createGame(subgridSize, difficulty, gameOptions())
			.then(applyBackendGame)
			.catch(() => {
				void applyGeneratedPuzzle()
			})
	}, [applyBackendGame, applyGeneratedPuzzle, difficulty, gameOptions, subgridSize])

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
					options.errorWarningsEnabled && nextValue !== 0
						? validateCell(rowIndex, colIndex, nextValue, solutionGrid)
						: false
				return copy
			})
		},
		[isGivenCell, options.errorWarningsEnabled, solutionGrid]
	)

	const loadGame = useCallback(
		(id: number) => {
			void getGame(id)
				.then(applyBackendGame)
				.catch(() => {
					setUsingBackend(false)
				})
		},
		[applyBackendGame]
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
				void createBackendGameForCurrentPuzzle()
					.then((game) => updateCell(game.id, rowIndex, colIndex, nextValue))
					.then(({ game, correct }) => {
						applyBackendGame(game)
						setErrorGrid((prev) => {
							const copy = prev.map((row) => row.slice())
							copy[rowIndex][colIndex] = options.errorWarningsEnabled && nextValue !== 0 ? !correct : false
							return copy
						})
					})
					.catch(() => {
						setUsingBackend(false)
					})
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
						copy[rowIndex][colIndex] = options.errorWarningsEnabled && nextValue !== 0 ? !correct : false
						return copy
					})
				})
				.catch(() => {
					applyLocalCellValue(rowIndex, colIndex, nextValue)
				})
		},
		[applyBackendGame, applyLocalCellValue, createBackendGameForCurrentPuzzle, gameId, options.errorWarningsEnabled, usingBackend]
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

			if (!usingBackend || gameId === null) {
				void createBackendGameForCurrentPuzzle()
					.then((game) => updateNotes(game.id, rowIndex, colIndex, next))
					.then(applyBackendGame)
					.catch(() => {
						setUsingBackend(false)
					})
				return
			}

			void updateNotes(gameId, rowIndex, colIndex, next)
				.then(applyBackendGame)
				.catch(() => {
					// Keep optimistic local notes if the backend is temporarily unavailable.
				})
		},
		[applyBackendGame, createBackendGameForCurrentPuzzle, gameId, gridSize, isGivenCell, notes, playerGrid, usingBackend]
	)

	const requestHintValue = useCallback(() => {
		if (!usingBackend || gameId === null) {
			void createBackendGameForCurrentPuzzle()
				.then((game) => requestHint(game.id))
				.then(({ game }) => applyBackendGame(game))
				.catch(() => {
					setUsingBackend(false)
				})
			return
		}

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
	}, [applyBackendGame, createBackendGameForCurrentPuzzle, gameId, usingBackend])

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
		newGame: createNewGame,
		subgridSize,
		setSubgridSize,
		gridSize,
		difficulty,
		setDifficulty,
		isGivenCell,
		gameId,
		usingBackend,
		gameStatus,
		isDailyGame,
		backendMistakes,
		hintsUsed,
		requestHint: requestHintValue,
		finishGame: finishGameValue,
		pauseGame: pauseGameValue,
		resumeGame: resumeGameValue,
		loadGame,
	}
}

const difficultyFromApi = (difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'): Difficulty => {
	switch (difficulty) {
		case 'EASY':
			return 8 as Difficulty
		case 'HARD':
			return 65 as Difficulty
		case 'EXPERT':
			return 70 as Difficulty
		case 'MEDIUM':
		default:
			return 57 as Difficulty
	}
}
