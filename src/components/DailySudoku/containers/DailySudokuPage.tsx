import '@/components/Auth/containers/AuthPage.scss'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import SudokuComponent from '@/components/Sudoku/components/SudokuComponent'
import type { GameSessionResponse, SudokuPuzzleResponse } from '@/services/sudokuApi'
import {
	getDailySudokuResult,
	getTodayDailySudoku,
	isAuthError,
	resetDailySudoku,
	startDailySudoku,
	SudokuApiError,
} from '@/services/sudokuApi'
import { clearSession } from '@/store/features/auth/authSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { localTodayKey, translateDifficulty, translateStatus } from '@/utils/appHelpers'

export const DailySudokuPage = () => {
	const dispatch = useAppDispatch()
	const user = useAppSelector((s) => s.auth.user)
	const dateKey = useMemo(() => localTodayKey(), [])
	const [puzzle, setPuzzle] = useState<SudokuPuzzleResponse | null>(null)
	const [game, setGame] = useState<GameSessionResponse | null>(null)
	const [loading, setLoading] = useState(true)
	const [starting, setStarting] = useState(false)
	const [resetting, setResetting] = useState(false)
	const [activeGameId, setActiveGameId] = useState<number | null>(null)
	const [error, setError] = useState<string | null>(null)
	const storageKey = useMemo(() => `daily-game:${dateKey}:${user?.id ?? 'anon'}`, [dateKey, user?.id])

	const readStoredGame = useCallback(() => {
		try {
			const raw = localStorage.getItem(storageKey)
			return raw ? (JSON.parse(raw) as GameSessionResponse) : null
		} catch {
			return null
		}
	}, [storageKey])

	const storeGame = useCallback(
		(nextGame: GameSessionResponse | null) => {
			try {
				if (!nextGame) {
					localStorage.removeItem(storageKey)
					return
				}
				localStorage.setItem(storageKey, JSON.stringify(nextGame))
			} catch {
				// Ignore storage quota/private mode failures.
			}
		},
		[storageKey]
	)

	const loadDaily = useCallback(async () => {
		setLoading(true)
		setError(null)

		const [puzzleResult, gameResult] = await Promise.allSettled([
			getTodayDailySudoku(),
			user ? getDailySudokuResult(dateKey) : Promise.resolve(null),
		])

		const nextPuzzle = puzzleResult.status === 'fulfilled' ? puzzleResult.value : null
		const storedGame = readStoredGame()
		const authFailed = gameResult.status === 'rejected' && isAuthError(gameResult.reason)
		const notStarted =
			gameResult.status === 'rejected' &&
			gameResult.reason instanceof SudokuApiError &&
			gameResult.reason.status === 404
		const nextGame = gameResult.status === 'fulfilled' ? gameResult.value : authFailed || notStarted ? null : storedGame

		if (authFailed) {
			dispatch(clearSession())
			setError('Tu sesión ha caducado. Inicia sesión de nuevo para guardar el Sudoku diario.')
		}

		setPuzzle(nextPuzzle)
		setGame(nextGame)
		storeGame(nextGame)

		if (!authFailed && !nextPuzzle && !nextGame) {
			setError('No se pudo cargar el Sudoku diario. Revisa la conexión e inténtalo de nuevo.')
		}

		setLoading(false)
	}, [dateKey, dispatch, readStoredGame, storeGame, user])

	useEffect(() => {
		void loadDaily()
	}, [loadDaily])

	const start = async () => {
		if (game) {
			setActiveGameId(game.id)
			return
		}

		setStarting(true)
		setError(null)
		try {
			const nextGame = await startDailySudoku(dateKey)
			setGame(nextGame)
			storeGame(nextGame)
			setActiveGameId(nextGame.id)
		} catch (requestError) {
			if (isAuthError(requestError)) {
				dispatch(clearSession())
				storeGame(null)
				setGame(null)
				setError('Tu sesión ha caducado. Inicia sesión de nuevo para jugar el diario guardado.')
				return
			}
			setError('No se pudo iniciar el Sudoku diario.')
		} finally {
			setStarting(false)
		}
	}

	const reset = async () => {
		if (!game) return
		setResetting(true)
		setError(null)
		try {
			const nextGame = await resetDailySudoku(dateKey)
			setGame(nextGame)
			storeGame(nextGame)
			setActiveGameId(nextGame.id)
		} catch (requestError) {
			if (isAuthError(requestError)) {
				dispatch(clearSession())
				storeGame(null)
				setGame(null)
				setError('Tu sesión ha caducado. Inicia sesión de nuevo para rehacer el diario.')
				return
			}
			setError('No se pudo reiniciar el Sudoku diario.')
		} finally {
			setResetting(false)
		}
	}

	const ctaLabel = game
		? game.status === 'WON' || game.status === 'LOST'
			? 'Ver tablero'
			: 'Continuar'
		: 'Jugar diario'
	const shownDifficulty = puzzle?.difficulty ?? game?.difficulty
	const shownGridSize = puzzle?.gridSize ?? game?.gridSize ?? 9
	const previewBoard = game?.currentBoard ?? puzzle?.puzzle ?? null
	const previewSize = game?.gridSize ?? puzzle?.gridSize ?? shownGridSize
	const completed = game?.status === 'WON' || game?.status === 'LOST'

	return (
		<div className='daily-page'>
			<div className='page-heading'>
				<div>
					<p className='eyebrow'>Reto del día</p>
					<h1 className='page-title'>Sudoku diario</h1>
				</div>
				<span className='status-pill'>{dateKey}</span>
			</div>

			{loading && <div className='panel state-panel'>Cargando el Sudoku diario...</div>}

			{!loading && error && !puzzle && !game && (
				<div className='panel state-panel'>
					<p className='error-text'>{error}</p>
					{user ? (
						<button className='btn primary' onClick={loadDaily}>
							Reintentar
						</button>
					) : (
						<Link className='btn primary' to='/account'>
							Iniciar sesión
						</Link>
					)}
				</div>
			)}

			{!loading && (puzzle || game) && (
				<div className='daily-card'>
					<div className='daily-card__copy'>
						<p className='eyebrow'>{shownDifficulty ? translateDifficulty(shownDifficulty) : 'Diario'}</p>
						<h2>{game ? translateStatus(game.status) : 'Disponible'}</h2>
						<p className='muted'>
							{game
								? completed
									? 'Tu Sudoku diario está guardado. Puedes ver el tablero terminado o deshacerlo para volver a hacerlo.'
									: 'Ya tienes una partida diaria empezada. Puedes continuarla desde aquí.'
								: 'Todos juegan el mismo tablero hoy. Inicia sesión para guardar tu progreso, historial y resultado diario.'}
						</p>
						<div className='daily-actions'>
							{user ? (
								<button className='btn primary' disabled={starting} onClick={start}>
									{starting ? 'Preparando...' : ctaLabel}
								</button>
							) : (
								<Link className='btn primary' to='/account'>
									Iniciar sesión
								</Link>
							)}
							<button className='btn' onClick={loadDaily}>
								Actualizar
							</button>
							{user && completed && (
								<button className='btn' disabled={resetting} onClick={reset}>
									{resetting ? 'Reiniciando...' : 'Deshacer y rehacer'}
								</button>
							)}
						</div>
						{game && (
							<p className='muted'>
								Partida #{game.id}, {game.gridSize}x{game.gridSize}, {translateStatus(game.status)}.
							</p>
						)}
						{error && <p className='error-text'>{error}</p>}
					</div>

					{previewBoard ? (
						<div
							className='daily-board'
							aria-label='Vista previa del Sudoku diario'
							style={{ gridTemplateColumns: `repeat(${previewSize}, minmax(1.5rem, 2.2rem))` }}>
							{previewBoard.flat().map((value, index) => (
								<span className='daily-cell' key={index}>
									{value || ''}
								</span>
							))}
						</div>
					) : (
						<div className='daily-board-placeholder'>
							<strong>{shownGridSize}x{shownGridSize}</strong>
							<span>Vista previa no disponible, pero tu partida está guardada.</span>
						</div>
					)}
				</div>
			)}

			{activeGameId && (
				<div className='daily-game'>
					<SudokuComponent initialGameId={activeGameId} />
				</div>
			)}
		</div>
	)
}
