import '@/components/Auth/containers/AuthPage.scss'

import { useCallback, useEffect, useMemo, useState } from 'react'

import SudokuComponent from '@/components/Sudoku/components/SudokuComponent'
import { LoginPrompt } from '@/components/elements/LoginGate/LoginGate'
import type { GameSessionResponse, SudokuPuzzleResponse } from '@/services/sudokuApi'
import {
	getDailySudokuByDate,
	getDailySudokuResult,
	getMyCalendar,
	isAuthError,
	resetDailySudoku,
	startDailySudoku,
	SudokuApiError,
} from '@/services/sudokuApi'
import { clearSession } from '@/store/features/auth/authSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { localTodayKey, translateDifficulty, translateStatus } from '@/utils/appHelpers'

// ─── Types ───────────────────────────────────────────────────────────────────

interface CalendarDay {
	date: string
	completed: boolean
	pending: boolean
}

// ─── DailyCalendar ───────────────────────────────────────────────────────────

const WEEK_DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const MONTHS_ES = [
	'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
	'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const DailyCalendar = ({
	selectedDate,
	onSelect,
	calendarDays,
}: {
	selectedDate: string
	onSelect: (date: string) => void
	calendarDays: CalendarDay[]
}) => {
	const today = useMemo(() => new Date(), [])
	const [viewYear, setViewYear] = useState(today.getFullYear())
	const [viewMonth, setViewMonth] = useState(today.getMonth()) // 0-indexed

	const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
	const firstDayOfMonth = new Date(viewYear, viewMonth, 1)
	const firstWeekDay = (firstDayOfMonth.getDay() + 6) % 7 // Monday=0

	const calMap = useMemo(() => {
		const map: Record<string, CalendarDay> = {}
		calendarDays.forEach((d) => { map[d.date] = d })
		return map
	}, [calendarDays])

	const canGoNext =
		viewYear < today.getFullYear() ||
		(viewYear === today.getFullYear() && viewMonth < today.getMonth())

	const prevMonth = () => {
		if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
		else setViewMonth(m => m - 1)
	}
	const nextMonth = () => {
		if (!canGoNext) return
		if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
		else setViewMonth(m => m + 1)
	}

	const formatDate = (year: number, month: number, day: number) => {
		const m = String(month + 1).padStart(2, '0')
		const d = String(day).padStart(2, '0')
		return `${year}-${m}-${d}`
	}

	const todayKey = localTodayKey()

	return (
		<div className='daily-calendar'>
			<div className='daily-calendar__nav'>
				<button className='btn' onClick={prevMonth} type='button'>‹</button>
				<h3>{MONTHS_ES[viewMonth]} {viewYear}</h3>
				<button className='btn' onClick={nextMonth} type='button' disabled={!canGoNext}>›</button>
			</div>
			<div className='daily-calendar__grid'>
				{WEEK_DAYS.map((d) => (
					<span key={d} className='daily-calendar__weekday'>{d}</span>
				))}
				{Array.from({ length: firstWeekDay }, (_, i) => (
					<span key={`e-${i}`} className='daily-cal-day daily-cal-day--empty' />
				))}
				{Array.from({ length: daysInMonth }, (_, i) => {
					const day = i + 1
					const dateKey = formatDate(viewYear, viewMonth, day)
					const isFuture = dateKey > todayKey
					const isToday = dateKey === todayKey
					const isSelected = dateKey === selectedDate
					const info = calMap[dateKey]
					const isCompleted = info?.completed || (info as CalendarDay & {dailySudokuCompleted?: boolean} | undefined)?.['dailySudokuCompleted' as keyof CalendarDay] as unknown as boolean

					let cls = 'daily-cal-day'
					if (isSelected) cls += ' daily-cal-day--selected'
					else if (isToday) cls += ' daily-cal-day--today'
					else if (isCompleted) cls += ' daily-cal-day--completed'

					return (
						<button
							key={dateKey}
							type='button'
							className={cls}
							disabled={isFuture}
							onClick={() => !isFuture && onSelect(dateKey)}>
							{day}
						</button>
					)
				})}
			</div>
		</div>
	)
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export const DailySudokuPage = () => {
	const dispatch = useAppDispatch()
	const user = useAppSelector((s) => s.auth.user)
	const todayKey = useMemo(() => localTodayKey(), [])

	const [selectedDate, setSelectedDate] = useState(todayKey)
	const [puzzle, setPuzzle] = useState<SudokuPuzzleResponse | null>(null)
	const [game, setGame] = useState<GameSessionResponse | null>(null)
	const [loading, setLoading] = useState(true)
	const [starting, setStarting] = useState(false)
	const [resetting, setResetting] = useState(false)
	const [activeGameId, setActiveGameId] = useState<number | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([])

	// Load calendar activity for current month
	useEffect(() => {
		if (!user) return
		const now = new Date()
		void getMyCalendar(now.getFullYear(), now.getMonth() + 1)
			.then((days) => setCalendarDays(days.map((d) => ({ date: d.date, completed: d.completedGames > 0, pending: d.pendingGames > 0 }))))
			.catch(() => {})
	}, [user])

	const loadDaily = useCallback(async (date: string) => {
		setLoading(true)
		setError(null)
		setActiveGameId(null)
		setGame(null)

		const [puzzleResult, gameResult] = await Promise.allSettled([
			getDailySudokuByDate(date),
			user ? getDailySudokuResult(date) : Promise.resolve(null),
		])

		const nextPuzzle = puzzleResult.status === 'fulfilled' ? puzzleResult.value : null
		const authFailed = gameResult.status === 'rejected' && isAuthError(gameResult.reason)
		const notStarted =
			gameResult.status === 'rejected' &&
			gameResult.reason instanceof SudokuApiError &&
			gameResult.reason.status === 404
		const nextGame = gameResult.status === 'fulfilled' ? gameResult.value : null

		if (authFailed) {
			dispatch(clearSession())
			setError('Tu sesión ha caducado. Inicia sesión de nuevo.')
		}

		setPuzzle(nextPuzzle)
		setGame(nextGame)

		if (!authFailed && !nextPuzzle && !nextGame && !notStarted) {
			setError('No se pudo cargar el Sudoku diario. Revisa la conexión e inténtalo de nuevo.')
		}

		setLoading(false)
	}, [dispatch, user])

	useEffect(() => {
		void loadDaily(selectedDate)
	}, [loadDaily, selectedDate])

	const handleSelectDate = (date: string) => {
		setSelectedDate(date)
	}

	const start = async () => {
		if (game) {
			setActiveGameId(game.id)
			return
		}
		setStarting(true)
		setError(null)
		try {
			const nextGame = await startDailySudoku(selectedDate)
			setGame(nextGame)
			setActiveGameId(nextGame.id)
		} catch (requestError) {
			if (isAuthError(requestError)) {
				dispatch(clearSession())
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
			const nextGame = await resetDailySudoku(selectedDate)
			setGame(nextGame)
			setActiveGameId(nextGame.id)
		} catch (requestError) {
			if (isAuthError(requestError)) {
				dispatch(clearSession())
				setError('Tu sesión ha caducado. Inicia sesión de nuevo para rehacer el diario.')
				return
			}
			setError('No se pudo reiniciar el Sudoku diario.')
		} finally {
			setResetting(false)
		}
	}

	// ── Auth gate ─────────────────────────────────────────────────────────────
	if (!user) {
		return (
			<div className='daily-page'>
				<LoginPrompt
					title='Sudoku diario'
					description='Inicia sesión para guardar tu progreso, ver el historial de días anteriores y competir con el mismo puzzle que todos los usuarios.'
				/>
			</div>
		)
	}

	const ctaLabel = game
		? game.status === 'WON' || game.status === 'LOST' ? 'Ver tablero' : 'Continuar'
		: 'Jugar diario'
	const shownDifficulty = puzzle?.difficulty ?? game?.difficulty
	const shownGridSize = puzzle?.gridSize ?? game?.gridSize ?? 9
	const previewBoard = game?.currentBoard ?? puzzle?.puzzle ?? null
	const previewSize = game?.gridSize ?? puzzle?.gridSize ?? shownGridSize
	const completed = game?.status === 'WON' || game?.status === 'LOST'
	const isToday = selectedDate === todayKey

	return (
		<div className='daily-page'>
			<div className='page-heading'>
				<div>
					<p className='eyebrow'>Reto {isToday ? 'de hoy' : 'del día'}</p>
					<h1 className='page-title'>Sudoku diario</h1>
				</div>
				<span className='status-pill'>{selectedDate}</span>
			</div>

			<DailyCalendar
				selectedDate={selectedDate}
				onSelect={handleSelectDate}
				calendarDays={calendarDays}
			/>

			{loading && <div className='panel state-panel'>Cargando el Sudoku diario...</div>}

			{!loading && error && !puzzle && !game && (
				<div className='panel state-panel'>
					<p className='error-text'>{error}</p>
					<button className='btn primary' onClick={() => void loadDaily(selectedDate)}>
						Reintentar
					</button>
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
									? 'Sudoku completado. Puedes ver el tablero o deshacerlo para repetirlo.'
									: 'Tienes una partida diaria en curso. ¡Continúala!'
								: `El puzzle del ${selectedDate} está disponible. Todos los usuarios juegan el mismo tablero.`}
						</p>
						<div className='daily-actions'>
							<button className='btn primary' disabled={starting} onClick={start}>
								{starting ? 'Preparando...' : ctaLabel}
							</button>
							<button className='btn' onClick={() => void loadDaily(selectedDate)}>
								Actualizar
							</button>
							{completed && (
								<button className='btn' disabled={resetting} onClick={reset}>
									{resetting ? 'Reiniciando...' : 'Deshacer y rehacer'}
								</button>
							)}
						</div>
						{game && (
							<p className='muted'>
								Partida #{game.id} · {game.gridSize}×{game.gridSize} · {translateStatus(game.status)}
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
									{value !== 0 ? value : ''}
								</span>
							))}
						</div>
					) : (
						<div className='daily-board-placeholder'>
							<strong>{shownGridSize}×{shownGridSize}</strong>
							<span>Vista previa no disponible.</span>
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
