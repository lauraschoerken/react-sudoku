import '@/components/Auth/containers/AuthPage.scss'

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import type { CalendarDayResponse, GameSessionResponse, UserStatsResponse } from '@/services/sudokuApi'
import { getMyCalendar, getMyGames, getMyStats, isAuthError } from '@/services/sudokuApi'
import { clearSession } from '@/store/features/auth/authSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { formatDuration, localTodayKey, translateDifficulty, translateStatus } from '@/utils/appHelpers'

const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export const DashboardPage = () => {
	const dispatch = useAppDispatch()
	const user = useAppSelector((s) => s.auth.user)
	const now = useMemo(() => new Date(), [])
	const [stats, setStats] = useState<UserStatsResponse | null>(null)
	const [calendar, setCalendar] = useState<CalendarDayResponse[]>([])
	const [games, setGames] = useState<GameSessionResponse[]>([])
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!user) return
		setError(null)
		void Promise.all([
			getMyStats(),
			getMyCalendar(now.getFullYear(), now.getMonth() + 1),
			getMyGames(),
		])
			.then(([nextStats, nextCalendar, nextGames]) => {
				setStats(nextStats)
				setCalendar(nextCalendar)
				setGames(nextGames)
			})
			.catch((requestError) => {
				if (isAuthError(requestError)) {
					dispatch(clearSession())
					setStats(null)
					setCalendar([])
					setGames([])
					setError('Tu sesión ha caducado. Inicia sesión de nuevo para ver tus estadísticas.')
					return
				}
				setError('No se pudieron cargar tus estadísticas.')
			})
	}, [dispatch, now, user])

	if (!user) {
		return (
			<div className='dashboard-page'>
				<h1 className='page-title'>Estadísticas</h1>
				<div className='panel state-panel'>
					<h2>Inicia sesión para ver tus datos</h2>
					<p className='muted'>
						Las estadísticas, el calendario y las partidas guardadas pertenecen a tu cuenta.
					</p>
					<Link className='btn primary' to='/account'>
						Ir a cuenta
					</Link>
					{error && <p className='error-text'>{error}</p>}
				</div>
			</div>
		)
	}

	const winRate = stats && stats.playedGames > 0 ? Math.round((stats.wonGames / stats.playedGames) * 100) : 0
	const firstWeekDay = calendar[0] ? (new Date(`${calendar[0].date}T00:00:00`).getDay() + 6) % 7 : 0
	const todayKey = localTodayKey()

	return (
		<div className='dashboard-page'>
			<div className='page-heading'>
				<div>
					<p className='eyebrow'>Tu progreso</p>
					<h1 className='page-title'>Estadísticas</h1>
				</div>
				<span className='status-pill'>{user.username}</span>
			</div>

			{stats && (
				<>
					<div className='metric-grid'>
						<Metric label='Partidas jugadas' value={stats.playedGames} />
						<Metric label='Victorias' value={stats.wonGames} />
						<Metric label='Porcentaje de victoria' value={stats.playedGames ? `${winRate}%` : '—'} />
						<Metric label='Mejor tiempo' value={formatDuration(stats.bestTimeSeconds)} />
						<Metric label='Pistas usadas' value={stats.totalHints} />
						<Metric label='Errores registrados' value={stats.totalMistakes} />
					</div>

					{stats.playedGames === 0 && (
						<div className='panel state-panel'>
							<h2>Todavía no tienes partidas terminadas</h2>
							<p className='muted'>Juega tu primer Sudoku para ver estadísticas útiles aquí.</p>
						</div>
					)}

					<div className='stats-grid'>
						<Breakdown title='Por dificultad' items={stats.byDifficulty} labelFormatter={translateDifficulty} />
						<Breakdown title='Por tamaño' items={stats.byGridSize} labelFormatter={(size) => `${size}x${size}`} />
					</div>
				</>
			)}

			<div className='panel calendar-panel'>
				<h2>Calendario</h2>
				<div className='calendar-grid calendar-grid--weekdays'>
					{weekDays.map((day) => (
						<strong key={day}>{day}</strong>
					))}
				</div>
				<div className='calendar-grid'>
					{Array.from({ length: firstWeekDay }, (_, index) => (
						<span className='calendar-day calendar-day--empty' key={`empty-${index}`} />
					))}
					{calendar.map((day) => {
						const active = day.completedGames > 0 || day.pendingGames > 0 || day.dailySudokuCompleted
						return (
							<div
								className={`calendar-day ${active ? 'has-activity' : ''} ${day.date === todayKey ? 'is-today' : ''}`}
								key={day.date}>
								<strong>{Number(day.date.slice(-2))}</strong>
								<span>{day.completedGames > 0 ? `${day.completedGames} fin.` : ''}</span>
								<span>{day.pendingGames > 0 ? `${day.pendingGames} pend.` : ''}</span>
							</div>
						)
					})}
				</div>
			</div>

			<div className='panel'>
				<h2>Partidas recientes</h2>
				<div className='history-list'>
					{games.slice(0, 8).map((game) => (
						<div className='history-row game-row' key={game.id}>
							<strong>#{game.id}</strong>
							<span>{translateDifficulty(game.difficulty)}</span>
							<span>
								{game.gridSize}x{game.gridSize}
							</span>
							<span>{translateStatus(game.status)}</span>
							{game.status === 'IN_PROGRESS' || game.status === 'PAUSED' ? (
								<Link className='btn compact' to={`/?gameId=${game.id}`}>
									Continuar
								</Link>
							) : (
								<Link className='btn compact' to='/'>
									Reintentar
								</Link>
							)}
						</div>
					))}
					{games.length === 0 && <p className='muted'>Todavía no hay partidas guardadas.</p>}
				</div>
			</div>
			{error && <p className='error-text'>{error}</p>}
		</div>
	)
}

const Metric = ({ label, value }: { label: string; value: string | number }) => (
	<div className='metric'>
		<span>{label}</span>
		<strong>{value}</strong>
	</div>
)

const Breakdown = ({
	title,
	items,
	labelFormatter,
}: {
	title: string
	items: UserStatsResponse['byDifficulty']
	labelFormatter: (label: string) => string
}) => (
	<div className='panel'>
		<h2>{title}</h2>
		<div className='history-list'>
			{Object.entries(items).map(([label, item]) => (
				<div className='history-row' key={label}>
					<strong>{labelFormatter(label)}</strong>
					<span>{item.playedGames} partidas</span>
					<span>{item.wonGames} ganadas</span>
					<span>{formatDuration(Math.round(item.averageTimeSeconds))} media</span>
					<span className='muted'>{item.totalHints} pistas</span>
				</div>
			))}
			{Object.keys(items).length === 0 && <p className='muted'>Sin datos todavía.</p>}
		</div>
	</div>
)
