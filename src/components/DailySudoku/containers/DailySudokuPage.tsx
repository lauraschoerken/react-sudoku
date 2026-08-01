import '@/components/Auth/containers/AuthPage.scss'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

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
import { useAppSelector } from '@/store/hooks'
import { isBoardValidSolution, localTodayKey } from '@/utils/appHelpers'

interface CalendarDay {
	date: string
	status: 'not-started' | 'in-progress' | 'completed' | 'completed-errors'
}

const dailyStatusForGame = (game: GameSessionResponse): CalendarDay['status'] => {
	if (game.status === 'LOST' || (game.status === 'WON' && game.mistakes > 0)) return 'completed-errors'
	if (game.status === 'WON') return 'completed'
	return 'in-progress'
}

const DailyCalendar = ({
	selectedDate,
	onSelect,
	calendarDays,
	onMonthChange,
}: {
	selectedDate: string
	onSelect: (date: string) => void
	calendarDays: CalendarDay[]
	onMonthChange: (year: number, month: number) => void
}) => {
	const { t, i18n } = useTranslation('common')
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
	const changeMonth = (delta: number) => {
		const next = new Date(viewYear, viewMonth + delta, 1)
		if (next > new Date(today.getFullYear(), today.getMonth(), 1)) return
		setViewYear(next.getFullYear())
		setViewMonth(next.getMonth())
		onMonthChange(next.getFullYear(), next.getMonth() + 1)
	}

	return (
		<div className='daily-calendar'>
			<div className='daily-calendar__nav'>
				<button
					className='btn'
					onClick={() => changeMonth(-1)}
					type='button'>
					{t('previous')}
				</button>
				<h3>
					{new Date(viewYear, viewMonth, 1).toLocaleDateString(i18n.language, { month: 'long' })} {viewYear}
				</h3>
				<button
					className='btn'
					disabled={!canGoNext}
					onClick={() => changeMonth(1)}
					type='button'>
					{t('next')}
				</button>
			</div>
			<div className='daily-calendar__grid'>
				{Array.from({ length: 7 }, (_, index) => new Date(2024, 0, index + 1)).map((date) => (
					<span className='daily-calendar__weekday' key={date.toISOString()}>
						{date.toLocaleDateString(i18n.language, { weekday: 'short' }).slice(0, 1).toUpperCase()}
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
					const status = info?.status ?? 'not-started'
					const className = [
						'daily-cal-day',
						dateKey === selectedDate ? 'daily-cal-day--selected' : '',
						dateKey === todayKey ? 'daily-cal-day--today' : '',
						`daily-cal-day--${status}`,
					]
						.filter(Boolean)
						.join(' ')

					return (
						<button
							aria-label={`${dateKey}, ${status === 'not-started' ? 'sin empezar' : status === 'in-progress' ? 'iniciado' : status === 'completed' ? 'completado sin errores' : 'completado con errores'}`}
							className={className}
							disabled={isFuture}
							key={dateKey}
							onClick={() => onSelect(dateKey)}
							type='button'>
							{day}
							{status === 'in-progress' && <span className='daily-cal-day__status is-started' aria-label='Iniciado' />}
							{status === 'completed' && <span className='daily-cal-day__status is-completed' aria-label='Completado sin errores'>✓</span>}
							{status === 'completed-errors' && <span className='daily-cal-day__status is-errors' aria-label='Completado con errores'>!</span>}
						</button>
					)
				})}
			</div>
			<div className='daily-calendar__legend' aria-label='Estados del calendario'>
				<span><i className='is-empty' /> Sin empezar</span>
				<span><i className='is-started' /> En curso</span>
				<span><i className='is-completed' /> Sin errores</span>
				<span><i className='is-errors' /> Con errores</span>
			</div>
		</div>
	)
}

export const DailySudokuPage = () => {
	const navigate = useNavigate()
	const { t } = useTranslation('common')
	const user = useAppSelector((state) => state.auth.user)
	const { errorsActive, errorsLimit, errorsLimiterEnabled, timerMode, timerSeconds } =
		useAppSelector((state) => state.settings)
	const todayKey = useMemo(() => localTodayKey(), [])

	const [selectedDate, setSelectedDate] = useState(todayKey)
	const [puzzle, setPuzzle] = useState<SudokuPuzzleResponse | null>(null)
	const [game, setGame] = useState<GameSessionResponse | null>(null)
	const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([])
	const [loading, setLoading] = useState(true)
	const [starting, setStarting] = useState(false)
	const [resetting, setResetting] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const calendarRequestRef = useRef(0)

	const loadCalendar = useCallback((year?: number, month?: number) => {
		if (!user) return
		const requestId = ++calendarRequestRef.current
		const now = new Date()
		void getMyCalendar(year ?? now.getFullYear(), month ?? now.getMonth() + 1)
			.then((days) => {
				if (requestId !== calendarRequestRef.current) return
				setCalendarDays(
						days.map((day) => {
							const completedWithErrors =
								day.dailySudokuStatus === 'LOST' ||
								(day.dailySudokuStatus === 'WON' && day.dailySudokuMistakes > 0)
							const completed = day.dailySudokuStatus === 'WON' || day.dailySudokuCompleted
							const started = day.dailySudokuStatus != null || day.dailySudokuStarted
							return {
								date: day.date,
								status: completedWithErrors
									? 'completed-errors'
									: completed
										? 'completed'
										: started
											? 'in-progress'
											: 'not-started',
							} as CalendarDay
						})
				)
			})
			.catch(() => {
				if (requestId === calendarRequestRef.current) setCalendarDays([])
			})
	}, [user])

	useEffect(() => {
		loadCalendar()
	}, [loadCalendar])

	const loadDaily = useCallback(
		async (date: string) => {
		setLoading(true)
		setError(null)

			const puzzleRequest = getDailySudokuByDate(date)
			const gameRequest = user
				? getDailySudokuResult(date).catch(async (requestError) => {
					if (!isAuthError(requestError)) throw requestError
					await new Promise((resolve) => window.setTimeout(resolve, 250))
					return getDailySudokuResult(date)
				})
				: Promise.resolve(null)
			const [puzzleResult, gameResult] = await Promise.allSettled([puzzleRequest, gameRequest])

			const nextPuzzle = puzzleResult.status === 'fulfilled' ? puzzleResult.value : null
			const authFailed = gameResult.status === 'rejected' && isAuthError(gameResult.reason)
			const notStarted =
				gameResult.status === 'rejected' &&
				gameResult.reason instanceof SudokuApiError &&
				gameResult.reason.status === 404
			const nextGame = gameResult.status === 'fulfilled' ? gameResult.value : null
			if (nextGame) {
				setCalendarDays((current) => {
					const nextStatus = dailyStatusForGame(nextGame)
					const existing = current.find((day) => day.date === date)
					if (existing?.status === nextStatus) return current
					if (!existing) return [...current, { date, status: nextStatus }]
					return current.map((day) => day.date === date ? { ...day, status: nextStatus } : day)
				})
			}

			if (authFailed) {
				setError('El servidor no ha podido validar la sesión. Tu usuario sigue conectado.')
			} else if (!nextPuzzle && !nextGame && !notStarted) {
				setError('No se pudo cargar el Sudoku diario. Revisa la conexion e intentalo de nuevo.')
			}

			setPuzzle(nextPuzzle)
			setGame(nextGame)
			setLoading(false)
		},
		[user]
	)

	useEffect(() => {
		void loadDaily(selectedDate)
	}, [loadDaily, selectedDate])

	const start = async () => {
		setStarting(true)
		setError(null)
		try {
			const nextGame = game?.status === 'LOST'
				? await resetDailySudoku(selectedDate)
				: await startDailySudoku(selectedDate, {
				timerMode: timerMode === 'countdown' ? 'COUNTDOWN' : 'NORMAL',
				countdownSeconds: timerMode === 'countdown' ? timerSeconds : undefined,
				maxErrors: errorsLimiterEnabled ? errorsLimit : undefined,
				errorWarningsEnabled: errorsActive,
				})
			setGame(nextGame)
			navigate(`/?daily=${selectedDate}`)
		} catch (requestError) {
			if (isAuthError(requestError)) {
				setError('El servidor no ha podido validar la sesión. Tu usuario sigue conectado.')
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
			navigate(`/?daily=${selectedDate}`)
		} catch (requestError) {
			if (isAuthError(requestError)) {
				setError('El servidor no ha podido validar la sesión. Tu usuario sigue conectado.')
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
		? game.status === 'LOST'
			? t('retry')
			: game.status === 'WON'
			? t('viewBoard')
			: game.started
				? t('continue')
				: t('playDaily')
		: t('playDaily')
	const previewBoard = game?.currentBoard ?? puzzle?.puzzle ?? null
	const previewSize = game?.gridSize ?? puzzle?.gridSize ?? 9
	const previewSubgridSize = game?.subgridSize ?? puzzle?.subgridSize ?? 3
	const previewInitialBoard = game?.initialBoard ?? puzzle?.puzzle ?? null
	const completed =
		game?.status === 'WON' && isBoardValidSolution(game.currentBoard, game.initialBoard, game.subgridSize)
	const started = game?.started === true
	const failed = game?.status === 'LOST'

	return (
		<div className='daily-page'>
			<div className='page-heading'>
				<div>
					<p className='eyebrow'>{t('dailyChallenge')}</p>
					<h1 className='page-title'>{t('dailyTitle')}</h1>
				</div>
				<span className='status-pill'>{selectedDate}</span>
			</div>

			<div className='daily-workspace'>
			<DailyCalendar
				calendarDays={calendarDays}
				onMonthChange={loadCalendar}
				onSelect={setSelectedDate}
				selectedDate={selectedDate}
			/>

			<div className='daily-content'>
			{loading && <div className='panel state-panel'>{t('loadingDaily')}</div>}

			{!loading && error && !puzzle && !game && (
				<div className='panel state-panel'>
					<p className='error-text'>{error}</p>
					<button className='btn primary' onClick={() => void loadDaily(selectedDate)}>
						{t('retry')}
					</button>
				</div>
			)}

			{!loading && (puzzle || game) && (
				<div className='daily-card'>
					<div className='daily-card__copy'>
						<h2>{failed ? 'Completado con errores' : completed ? t('completed') : started ? t('inProgress') : t('available')}</h2>
						<p className='muted'>
							{game
								? failed
									? 'La partida terminó. Puedes reintentarlo desde cero cuando quieras.'
									: completed
									? 'Sudoku completado. Puedes ver el tablero o deshacerlo para repetirlo.'
									: t('dailyInProgress')
								: t('dailyAvailable', { date: selectedDate })}
						</p>
						<div className='daily-actions'>
							<button className='btn primary' disabled={starting} onClick={start}>
								{starting ? t('preparing') : ctaLabel}
							</button>
							{completed && (
								<button className='btn' disabled={resetting} onClick={reset}>
									{resetting ? t('resetting') : t('undoDaily')}
								</button>
							)}
						</div>
						{error && <p className='error-text'>{error}</p>}
					</div>

					{previewBoard ? (
						<div
							aria-label='Vista previa del Sudoku diario'
							className={`daily-board ${completed ? 'daily-board--completed' : 'daily-board--hidden'}`}
							style={{ gridTemplateColumns: `repeat(${previewSize}, minmax(0, 1fr))` }}>
							{previewBoard.flat().map((value, index) => {
								const row = Math.floor(index / previewSize)
								const column = index % previewSize
								const given = previewInitialBoard?.[row]?.[column] !== 0
								const cellClassName = [
									'daily-cell',
									given ? 'daily-cell--given' : 'daily-cell--solved',
									column > 0 && column % previewSubgridSize === 0 ? 'daily-cell--block-left' : '',
									row > 0 && row % previewSubgridSize === 0 ? 'daily-cell--block-top' : '',
								].filter(Boolean).join(' ')
								return <span className={cellClassName} key={index}>
									{value || ''}
								</span>
							})}
						</div>
					) : (
						<div className='daily-board-placeholder'>
							<strong>
								Sudoku diario
							</strong>
							<span>Vista previa no disponible.</span>
						</div>
					)}
				</div>
			)}
			</div>
			</div>

		</div>
	)
}
