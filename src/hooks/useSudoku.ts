import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { Board } from '@/models/components/Sudoku'
import { type Difficulty, DifficultyLevels } from '@/models/utils/Difficulty'
import { type SubgridSize, SubgridSizes } from '@/models/utils/Size'
import { createEmptyErrorGrid, validateCell } from '@/utils/Sudoku'
import {
	createGame,
	createGameFromPuzzle,
	clearStoredGameTime,
	finishGame,
	generateSudoku,
	getActiveGame,
	getGame,
	pauseGame,
	resetGame,
	requestHint,
	readStoredGameTime,
	resumeGame,
	startDailySudoku,
	updateCell,
	updateNotes,
	updateGameTime,
} from '@/services/sudokuApi'
import type { GameStatus } from '@/services/sudokuApi'

interface UseSudokuOptions {
	dailyDate?: string
	initialGameId?: number
	userId?: number
	errorWarningsEnabled?: boolean
	maxErrors?: number
	timerMode?: 'normal' | 'countdown'
	countdownSeconds?: number
	/** When true, skip the auto-load of the active game on mount (user chose to start fresh). */
	skipActiveGameCheck?: boolean
}

const noteKey = (rowIndex: number, colIndex: number) => `${rowIndex}:${colIndex}`

const makeEmptyBoard = (size: number): Board =>
	Array.from({ length: size }, () => Array(size).fill(0) as number[])

const errorGridFromCells = (cells: string[] | undefined, size: number) => {
	const grid = Array.from({ length: size }, () => Array(size).fill(false) as boolean[])
	for (const key of cells ?? []) {
		const [row, col] = key.split(':').map(Number)
		if (Number.isInteger(row) && Number.isInteger(col) && row >= 0 && row < size && col >= 0 && col < size) {
			grid[row][col] = true
		}
	}
	return grid
}

export const useSudoku = (
	initialSubgridSize: SubgridSize = SubgridSizes.Classic,
	initialDifficulty: Difficulty = DifficultyLevels.Medium,
	options: UseSudokuOptions = {}
) => {
	const [subgridSize, setSubgridSize] = useState(initialSubgridSize)
	const [difficulty, setDifficulty] = useState(initialDifficulty)
	const gridSize = useMemo(() => subgridSize * subgridSize, [subgridSize])

	const [solutionGrid, setSolutionGrid] = useState<Board>(() => makeEmptyBoard(gridSize))
	const [puzzleGrid, setPuzzleGrid] = useState<Board>(() => makeEmptyBoard(gridSize))
	const [playerGrid, setPlayerGrid] = useState<Board>(() => makeEmptyBoard(gridSize))
	const [errorGrid, setErrorGrid] = useState<boolean[][]>(() =>
		Array.from({ length: gridSize }, () => Array(gridSize).fill(false) as boolean[])
	)
	const [gameId, setGameId] = useState<number | null>(null)
	const [gameLoading, setGameLoading] = useState(true)
	const [gameError, setGameError] = useState<string | null>(null)
	const [serverPuzzleId, setServerPuzzleId] = useState<number | null>(null)
	const [usingBackend, setUsingBackend] = useState(false)
	const [backendMistakes, setBackendMistakes] = useState(0)
	const [elapsedSeconds, setElapsedSeconds] = useState(0)
	const [backendTimerMode, setBackendTimerMode] = useState<'normal' | 'countdown'>('normal')
	const [backendCountdownSeconds, setBackendCountdownSeconds] = useState<number | undefined>()
	const [hintsUsed, setHintsUsed] = useState(0)
	const [notes, setNotes] = useState<Record<string, number[]>>({})
	const [hintedCells, setHintedCells] = useState<Set<string>>(new Set())
	const [gameStatus, setGameStatus] = useState<GameStatus>('IN_PROGRESS')
	const [isDailyGame, setIsDailyGame] = useState(false)
	const suppressNextRegenerateRef = useRef(false)
	const loadedInitialGameIdRef = useRef<number | null>(null)
	const backendGamePromiseRef = useRef<Promise<Awaited<ReturnType<typeof getGame>>> | null>(null)
	const previewStorageKey = useMemo(
		() => `sudoku-preview:${options.userId ?? 'anonymous'}:${subgridSize}:${difficulty}`,
		[options.userId, subgridSize, difficulty]
	)

	const applyBackendGame = useCallback((game: Awaited<ReturnType<typeof getGame>>) => {
		const storedElapsed = readStoredGameTime(game.id)
		const canRestoreLocalTime =
			game.started && (game.status === 'IN_PROGRESS' || game.status === 'PAUSED')
		const restoredElapsed = canRestoreLocalTime
			? Math.max(game.elapsedSeconds, storedElapsed ?? 0)
			: game.elapsedSeconds
		if (!canRestoreLocalTime) clearStoredGameTime(game.id)
		if (restoredElapsed > game.elapsedSeconds) {
			void updateGameTime(game.id, restoredElapsed).catch(() => undefined)
		}
		suppressNextRegenerateRef.current = true
		setGameId(game.id)
		setServerPuzzleId(game.puzzleId)
		setUsingBackend(true)
		setSubgridSize(game.subgridSize as SubgridSize)
		setDifficulty(difficultyFromApi(game.difficulty))
		setSolutionGrid(game.initialBoard)
		setPuzzleGrid(game.initialBoard)
		setPlayerGrid(game.currentBoard)
		setErrorGrid(errorGridFromCells(game.errorCells, game.currentBoard.length))
		setBackendMistakes(game.mistakes)
		setElapsedSeconds(restoredElapsed)
		setBackendTimerMode(game.timerMode === 'COUNTDOWN' ? 'countdown' : 'normal')
		setBackendCountdownSeconds(game.countdownSeconds ?? undefined)
		setHintsUsed(game.hintsUsed)
		setNotes(game.notes ?? {})
		setHintedCells(new Set(game.hintedCells ?? []))
		setGameStatus(game.status)
		setIsDailyGame(game.dailyGame)
		setGameLoading(false)
		setGameError(null)
	}, [])

	const gameOptions = useCallback(
		() => ({
			userId: options.userId,
			timerMode: options.timerMode === 'countdown' ? ('COUNTDOWN' as const) : ('NORMAL' as const),
			countdownSeconds: options.timerMode === 'countdown' ? options.countdownSeconds : undefined,
			maxErrors: options.maxErrors,
			errorWarningsEnabled: options.errorWarningsEnabled,
		}),
		[
			options.userId,
			options.timerMode,
			options.countdownSeconds,
			options.maxErrors,
			options.errorWarningsEnabled,
		]
	)

	const applyGeneratedPuzzle = useCallback(async () => {
		let generated: Awaited<ReturnType<typeof generateSudoku>> | null = null
		try {
			const cached = localStorage.getItem(previewStorageKey)
			if (cached) generated = JSON.parse(cached) as Awaited<ReturnType<typeof generateSudoku>>
		} catch {
			// La vista previa local se regenerara si no es valida.
		}
		if (!generated) {
			generated = await generateSudoku(subgridSize, difficulty)
			try {
				localStorage.setItem(previewStorageKey, JSON.stringify(generated))
			} catch {
				// La persistencia local es opcional.
			}
		}
		suppressNextRegenerateRef.current = true
		setGameId(null)
		setServerPuzzleId(generated.id)
		setUsingBackend(false)
		setSubgridSize(generated.subgridSize as SubgridSize)
		setDifficulty(difficultyFromApi(generated.difficulty))
		setSolutionGrid(generated.solution ?? generated.puzzle)
		setPuzzleGrid(generated.puzzle)
		setPlayerGrid(generated.puzzle)
		setErrorGrid(createEmptyErrorGrid(generated.puzzle))
		setBackendMistakes(0)
		setElapsedSeconds(0)
		setBackendTimerMode(options.timerMode ?? 'normal')
		setBackendCountdownSeconds(options.countdownSeconds)
		setHintsUsed(0)
		setNotes({})
		setHintedCells(new Set())
		setGameStatus('IN_PROGRESS')
		setIsDailyGame(false)
		setGameLoading(false)
		setGameError(null)
	}, [difficulty, previewStorageKey, subgridSize])

	const loadInitialGrids = useCallback(() => {
		if (suppressNextRegenerateRef.current) {
			suppressNextRegenerateRef.current = false
			return
		}

		if (
			options.dailyDate
		) {
			setGameLoading(true)
			setGameError(null)
			void startDailySudoku(options.dailyDate, {
						timerMode: options.timerMode === 'countdown' ? 'COUNTDOWN' : 'NORMAL',
						countdownSeconds: options.countdownSeconds,
						maxErrors: options.maxErrors,
						errorWarningsEnabled: options.errorWarningsEnabled,
					})
				.then(applyBackendGame)
				.catch(() => {
					setGameLoading(false)
					setGameError('No se pudo cargar el Sudoku diario de esta fecha.')
				})
			return
		}

		if (
			options.initialGameId !== undefined &&
			loadedInitialGameIdRef.current !== options.initialGameId
		) {
			loadedInitialGameIdRef.current = options.initialGameId
			setGameLoading(true)
			setGameError(null)
			void getGame(options.initialGameId)
				.then(applyBackendGame)
				.catch(() => {
					loadedInitialGameIdRef.current = null
					setGameLoading(false)
					setGameError('No se pudo cargar la partida solicitada.')
				})
			return
		}

		if (options.userId && !options.skipActiveGameCheck) {
			setGameLoading(true)
			setGameError(null)
			void getActiveGame()
				.then(applyBackendGame)
				.catch(() => {
					// No active game – create a fresh one from the backend
					void applyGeneratedPuzzle()
						.catch(() => {
							setGameLoading(false)
							setGameError('No se pudo conectar con el servidor. Comprueba la conexión.')
						})
				})
			return
		}

		// Anonymous user or user declined resume – create anonymous game session
		setGameLoading(true)
		setGameError(null)
		void applyGeneratedPuzzle()
			.catch(() => {
				setGameLoading(false)
				setGameError('No se pudo conectar con el servidor. Comprueba la conexión.')
			})
	}, [
		options.userId,
		options.dailyDate,
		options.initialGameId,
		options.skipActiveGameCheck,
		options.timerMode,
		options.countdownSeconds,
		options.maxErrors,
		options.errorWarningsEnabled,
		applyBackendGame,
		applyGeneratedPuzzle,
		difficulty,
		subgridSize,
	])

	useEffect(() => {
		loadInitialGrids()
	}, [loadInitialGrids])

	const createBackendGameForCurrentPuzzle = useCallback(async () => {
		if (backendGamePromiseRef.current) return backendGamePromiseRef.current
		const promise = (async () => {
		const game = serverPuzzleId
			? await createGameFromPuzzle(serverPuzzleId, subgridSize, difficulty, gameOptions())
			: await createGame(subgridSize, difficulty, gameOptions())
		applyBackendGame(game)
		return game
		})()
		backendGamePromiseRef.current = promise
		try {
			return await promise
		} finally {
			if (backendGamePromiseRef.current === promise) backendGamePromiseRef.current = null
		}
	}, [applyBackendGame, difficulty, gameOptions, serverPuzzleId, subgridSize])

	const createNewGame = useCallback((nextSubgridSize = subgridSize, nextDifficulty = difficulty) => {
		setGameLoading(true)
		setGameError(null)
		const nextStorageKey = `sudoku-preview:${options.userId ?? 'anonymous'}:${nextSubgridSize}:${nextDifficulty}`
		try {
			localStorage.removeItem(nextStorageKey)
		} catch {
			// La persistencia local es opcional.
		}
		void generateSudoku(nextSubgridSize, nextDifficulty)
			.then((generated) => {
				try {
					localStorage.setItem(nextStorageKey, JSON.stringify(generated))
				} catch {
					// La persistencia local es opcional.
				}
				return createGameFromPuzzle(generated.id, nextSubgridSize, nextDifficulty, gameOptions())
			})
			.then((game) => {
				applyBackendGame(game)
			})
			.catch(() => {
				setGameLoading(false)
				setGameError('No se pudo crear la partida. Comprueba la conexión e inténtalo de nuevo.')
			})
	}, [applyBackendGame, difficulty, gameOptions, options.userId, subgridSize])

	const isGivenCell = useCallback(
		(rowIndex: number, colIndex: number) =>
			puzzleGrid[rowIndex][colIndex] !== 0 || hintedCells.has(noteKey(rowIndex, colIndex)),
		[puzzleGrid, hintedCells]
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
		(rowIndex: number, colIndex: number, value: number | null | undefined, elapsedSeconds?: number) => {
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
					.then((game) => updateCell(game.id, rowIndex, colIndex, nextValue, elapsedSeconds))
					.then(({ game }) => {
						applyBackendGame(game)
						setErrorGrid(errorGridFromCells(game.errorCells, game.currentBoard.length))
					})
					.catch(() => {
						setUsingBackend(false)
					})
				return
			}

			void updateCell(gameId, rowIndex, colIndex, nextValue, elapsedSeconds)
				.then(({ game }) => {
					setPlayerGrid(game.currentBoard)
					setBackendMistakes(game.mistakes)
					setHintsUsed(game.hintsUsed)
					setNotes(game.notes ?? {})
					setHintedCells(new Set(game.hintedCells ?? []))
					setElapsedSeconds(game.elapsedSeconds)
					setGameStatus(game.status)
					setErrorGrid(errorGridFromCells(game.errorCells, game.currentBoard.length))
				})
				.catch(() => {
					applyLocalCellValue(rowIndex, colIndex, nextValue)
				})
		},
		[
			applyBackendGame,
			applyLocalCellValue,
			createBackendGameForCurrentPuzzle,
			gameId,
			options.errorWarningsEnabled,
			usingBackend,
		]
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
		[
			applyBackendGame,
			createBackendGameForCurrentPuzzle,
			gameId,
			gridSize,
			isGivenCell,
			notes,
			playerGrid,
			usingBackend,
		]
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
				setHintedCells(new Set(game.hintedCells ?? []))
				setElapsedSeconds(game.elapsedSeconds)
				setGameStatus(game.status)
				setErrorGrid(errorGridFromCells(game.errorCells, game.currentBoard.length))
			})
			.catch(() => {
				// Hint fallback is intentionally skipped; local mode has no persisted hint accounting.
			})
	}, [applyBackendGame, createBackendGameForCurrentPuzzle, gameId, usingBackend])

	const finishGameValue = useCallback(
		(status: Exclude<GameStatus, 'IN_PROGRESS' | 'PAUSED'>, elapsedSeconds?: number) => {
			if (!usingBackend || gameId === null) return Promise.resolve(null)

			return finishGame(gameId, status, elapsedSeconds)
				.then((game) => {
					clearStoredGameTime(game.id)
					setPlayerGrid(game.currentBoard)
					setBackendMistakes(game.mistakes)
					setHintsUsed(game.hintsUsed)
					setNotes(game.notes ?? {})
					setHintedCells(new Set(game.hintedCells ?? []))
					setGameStatus(game.status)
					setElapsedSeconds(game.elapsedSeconds)
					return game
				})
				.catch(() => {
					// Finishing is retried by user actions later; keep local end state responsive.
					return null
				})
		},
		[gameId, usingBackend]
	)

	const pauseGameValue = useCallback((nextElapsedSeconds?: number) => {
		if (!usingBackend || gameId === null) {
			void createBackendGameForCurrentPuzzle()
				.then((game) => pauseGame(game.id, nextElapsedSeconds))
				.then((game) => {
					setElapsedSeconds(game.elapsedSeconds)
					setGameStatus(game.status)
				})
				.catch(() => setUsingBackend(false))
			return
		}

		void pauseGame(gameId, nextElapsedSeconds)
			.then((game) => {
				setElapsedSeconds(game.elapsedSeconds)
				setGameStatus(game.status)
			})
			.catch(() => {
				// Keep current local status if the backend rejects the transition.
			})
	}, [createBackendGameForCurrentPuzzle, gameId, usingBackend])

	const persistElapsedTime = useCallback(
		(nextElapsedSeconds: number) => {
			if (!usingBackend || gameId === null) return Promise.resolve(null)
			return updateGameTime(gameId, nextElapsedSeconds)
				.then((game) => {
					setElapsedSeconds(game.elapsedSeconds)
					return game
				})
				.catch(() => null)
		},
		[gameId, usingBackend]
	)

	const resumeGameValue = useCallback(() => {
		if (!usingBackend || gameId === null) return

		void resumeGame(gameId)
			.then((game) => {
				setElapsedSeconds(game.elapsedSeconds)
				setGameStatus(game.status)
			})
			.catch(() => {
				// Keep current local status if the backend rejects the transition.
			})
	}, [gameId, usingBackend])

	const resetGameValue = useCallback(() => {
		if (!usingBackend || gameId === null) return Promise.resolve(null)
		return resetGame(gameId).then((game) => {
			applyBackendGame(game)
			return game
		})
	}, [applyBackendGame, gameId, usingBackend])

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
		hintedCells,
		gameId,
		usingBackend,
		gameStatus,
		isDailyGame,
		backendMistakes,
		elapsedSeconds,
		backendTimerMode,
		backendCountdownSeconds,
		hintsUsed,
		requestHint: requestHintValue,
		finishGame: finishGameValue,
		persistElapsedTime,
		pauseGame: pauseGameValue,
		resumeGame: resumeGameValue,
		resetGame: resetGameValue,
		loadGame,
		gameLoading,
		gameError,
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
