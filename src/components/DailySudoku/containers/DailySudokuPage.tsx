import '@/components/Auth/containers/AuthPage.scss'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { LoginPrompt } from '@/components/elements/LoginGate/LoginGate'
import SudokuComponent from '@/components/Sudoku/components/SudokuComponent'
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

interface CalendarDay {
	date: string
	completed: boolean
	pending: boolean
}

const WEEK_DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const MONTHS_ES = [
	'Enero',
	'Febrero',
	'Marzo',
	'Abril',
	'Mayo',
	'Junio',
	'Julio',
	'Agosto',
	'Septiembre',
	'Octubre',
	'Noviembre',
	'Diciembre',
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
	const [viewMonth, setViewMonth] = useState(today.getMonth())

	const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
	const firstWeekDay = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7
	const todayKey = localTodayKey()
	const calendarMap = useMemo(
		() => Object.fromEntries(calendarDays.map((day) => [day.date, day])),
		[calendarDays]
	)
	const canGoNext =
		viewYear < today.getFullYear() ||
		(viewYear === today.getFullYear() && viewMonth < today.getMonth())

	const dateKeyFor = (day: number) =>
		`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

	return (
		<div className='daily-calendar'>
			<div className='daily-calendar__nav'>
				<button
					className='btn'
					onClick={() => {
						if (viewMonth === 0) {
							setViewYear((year) => year - 1)
							setViewMonth(11)
						} else {
							setViewMonth((month) => month - 1)
						}
					}}
					type='button'>
					Anterior
				</button>
				<h3>
					{MONTHS_ES[viewMonth]} {viewYear}
				</h3>
				<button
					className='btn'
					disabled={!canGoNext}
					onClick={() => {
						if (!canGoNext) return
						if (viewMonth === 11) {
							setViewYear((year) => year + 1)
							setViewMonth(0)
						} else {
							setViewMonth((month) => month + 1)
						}
					}}
					type='button'>
					Siguiente
				</button>
			</div>
			<div className='daily-calendar__grid'>
				{WEEK_DAYS.map((day) => (
					<span className='daily-calendar__weekday' key={day}>
						{day}
					</span>
				))}
				{Array.from({ length: firstWeekDay }, (_, index) => (
					<span className='daily-cal-day daily-cal-day--empty' key={`empty-${index}`} />
				))}
				{Array.from({ length: daysInMonth }, (_, index) => {
					const day = index + 1
					const dateKey = dateKeyFor(day)
					const isFuture = dateKey > todayKey
					const info = calendarMap[dateKey]
					const className = [
						'daily-cal-day',
						dateKey === selectedDate ? 'daily-cal-day--selected' : '',
						dateKey === todayKey ? 'daily-cal-day--today' : '',
						info?.completed ? 'daily-cal-day--completed' : '',
						info?.pending ? 'daily-cal-day--pending' : '',
					]
						.filter(Boolean)
						.join(' ')

					return (
						<button
							className={className}
							disabled={isFuture}
							key={dateKey}
							onClick={() => onSelect(dateKey)}
							type='button'>
							{day}
						</button>
					)
				})}
			</div>
		</div>
	)
}

export const DailySudokuPage = () => {
	const dispatch = useAppDispatch()
	const user = useAppSelector((state) => state.auth.user)
	const todayKey = useMemo(() => localTodayKey(), [])

	const [selectedDate, setSelectedDate] = useState(todayKey)
	const [puzzle, setPuzzle] = useState<SudokuPuzzleResponse | null>(null)
	const [game, setGame] = useState<GameSessionResponse | null>(null)
	const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([])
	const [activeGameId, setActiveGameId] = useState<number | null>(null)
	const [loading, setLoading] = useState(true)
	const [starting, setStarting] = useState(false)
	const [resetting, setResetting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!user) return
		const now = new Date()
		void getMyCalendar(now.getFullYear(), now.getMonth() + 1)
			.then((days) =>
				setCalendarDays(
					days.map((day) => ({
						date: day.date,
						completed: day.dailySudokuCompleted || day.completedGames > 0,
						pending: day.pendingGames > 0,
					}))
				)
			)
			.catch(() => {
				setCalendarDays([])
			})
	}, [user])

	const loadDaily = useCallback(
		async (date: string) => {
			setLoading(true)
			setError(null)
			setActiveGameId(null)

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
				setError('Tu sesion ha caducado. Inicia sesion de nuevo.')
			} else if (!nextPuzzle && !nextGame && !notStarted) {
				setError('No se pudo cargar el Sudoku diario. Revisa la conexion e intentalo de nuevo.')
			}

			setPuzzle(nextPuzzle)
			setGame(nextGame)
			setLoading(false)
		},
		[dispatch, user]
	)

	useEffect(() => {
		void loadDaily(selectedDate)
	}, [loadDaily, selectedDate])

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
				setError('Tu sesion ha caducado. Inicia sesion de nuevo para jugar el diario.')
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
				setError('Tu sesion ha caducado. Inicia sesion de nuevo para rehacer el diario.')
				return
			}
			setError('No se pudo reiniciar el Sudoku diario.')
		} finally {
			setResetting(false)
		}
	}

	if (!user) {
		return (
			<div className='daily-page'>
				<LoginPrompt
					description='Inicia sesion para guardar tu progreso y jugar el mismo diario que el resto de usuarios.'
					title='Sudoku diario'
				/>
			</div>
		)
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
					<p className='eyebrow'>Reto del dia</p>
					<h1 className='page-title'>Sudoku diario</h1>
				</div>
				<span className='status-pill'>{selectedDate}</span>
			</div>

			<DailyCalendar
				calendarDays={calendarDays}
				onSelect={setSelectedDate}
				selectedDate={selectedDate}
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
						<p className='eyebrow'>
							{shownDifficulty ? translateDifficulty(shownDifficulty) : 'Diario'}
						</p>
						<h2>{game ? translateStatus(game.status) : 'Disponible'}</h2>
						<p className='muted'>
							{game
								? completed
									? 'Sudoku completado. Puedes ver el tablero o deshacerlo para repetirlo.'
									: 'Tienes una partida diaria en curso. Puedes continuarla aqui mismo.'
								: `El puzzle del ${selectedDate} esta disponible. Todos juegan el mismo tablero.`}
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
								Partida #{game.id}, {game.gridSize}x{game.gridSize}, {translateStatus(game.status)}.
							</p>
						)}
						{error && <p className='error-text'>{error}</p>}
					</div>

					{previewBoard ? (
						<div
							aria-label='Vista previa del Sudoku diario'
							className='daily-board'
							style={{ gridTemplateColumns: `repeat(${previewSize}, minmax(1.5rem, 2.2rem))` }}>
							{previewBoard.flat().map((value, index) => (
								<span className='daily-cell' key={index}>
									{value || ''}
								</span>
							))}
						</div>
					) : (
						<div className='daily-board-placeholder'>
							<strong>
								{shownGridSize}x{shownGridSize}
							</strong>
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
