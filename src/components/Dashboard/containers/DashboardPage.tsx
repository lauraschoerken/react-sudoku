import '@/components/Auth/containers/AuthPage.scss'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { LoginPrompt } from '@/components/elements/LoginGate/LoginGate'
import type { CalendarDayResponse, GameSessionResponse, UserStatsResponse } from '@/services/sudokuApi'
import { deleteMyGame, getMyCalendar, getMyGames, getMyStats, isAuthError } from '@/services/sudokuApi'
import { clearSession } from '@/store/features/auth/authSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { formatDuration, localTodayKey, translateDifficulty, translateStatus } from '@/utils/appHelpers'

const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export const DashboardPage = () => {
	const dispatch = useAppDispatch()
	const user = useAppSelector((state) => state.auth.user)
	const now = useMemo(() => new Date(), [])
	const [stats, setStats] = useState<UserStatsResponse | null>(null)
	const [calendar, setCalendar] = useState<CalendarDayResponse[]>([])
	const [games, setGames] = useState<GameSessionResponse[]>([])
	const [error, setError] = useState<string | null>(null)
	const [deletingId, setDeletingId] = useState<number | null>(null)
	const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

	const loadData = useCallback(() => {
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
					setError('Tu sesion ha caducado. Inicia sesion de nuevo para ver tus estadisticas.')
					return
				}
				setError('No se pudieron cargar tus estadisticas.')
			})
	}, [dispatch, now, user])

	useEffect(() => {
		loadData()
	}, [loadData])

	const handleDeleteGame = async (sessionId: number) => {
		setDeletingId(sessionId)
		try {
			await deleteMyGame(sessionId)
			setConfirmDeleteId(null)
			loadData()
		} catch {
			setError('No se pudo eliminar la partida.')
		} finally {
			setDeletingId(null)
		}
	}

	if (!user) {
		return (
			<div className='dashboard-page'>
				<LoginPrompt
					description='Inicia sesion para ver tu historial, calendario y estadisticas.'
					title='Estadisticas'
				/>
			</div>
		)
	}

	const lastActiveGame = games.find((game) => game.status === 'IN_PROGRESS' || game.status === 'PAUSED')
	const winRate = stats && stats.playedGames > 0 ? Math.round((stats.wonGames / stats.playedGames) * 100) : 0
	const firstWeekDay = calendar[0] ? (new Date(`${calendar[0].date}T00:00:00`).getDay() + 6) % 7 : 0
	const todayKey = localTodayKey()

	return (
		<div className='dashboard-page'>
			<div className='page-heading'>
				<div>
					<p className='eyebrow'>Tu progreso</p>
					<h1 className='page-title'>Estadisticas</h1>
				</div>
				<span className='status-pill'>{user.username}</span>
			</div>

			{error && <p className='error-text'>{error}</p>}

			{lastActiveGame && (
				<div className='continue-banner'>
					<div>
						<strong>Partida en curso</strong>
						<p className='muted'>
							#{lastActiveGame.id}, {translateDifficulty(lastActiveGame.difficulty)},{' '}
							{lastActiveGame.gridSize}x{lastActiveGame.gridSize},{' '}
							{translateStatus(lastActiveGame.status)}
						</p>
					</div>
					<Link className='btn primary' to={`/?gameId=${lastActiveGame.id}`}>
						Continuar partida
					</Link>
				</div>
			)}

			{stats && (
				<>
					<div className='metric-grid'>
						<Metric label='Partidas jugadas' value={stats.playedGames} />
						<Metric label='Victorias' value={stats.wonGames} />
						<Metric label='Porcentaje de victoria' value={stats.playedGames ? `${winRate}%` : '-'} />
						<Metric label='Mejor tiempo' value={formatDuration(stats.bestTimeSeconds)} />
						<Metric label='Pistas usadas' value={stats.totalHints} />
						<Metric label='Errores registrados' value={stats.totalMistakes} />
					</div>

					{stats.playedGames === 0 && (
						<div className='panel state-panel'>
							<h2>Todavia no tienes partidas terminadas</h2>
							<p className='muted'>Juega tu primer Sudoku para ver estadisticas utiles aqui.</p>
						</div>
					)}

					<div className='stats-grid'>
						<Breakdown title='Por dificultad' items={stats.byDifficulty} labelFormatter={translateDifficulty} />
						<Breakdown title='Por tamano' items={stats.byGridSize} labelFormatter={(size) => `${size}x${size}`} />
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
								{day.completedGames > 0 && <span>{day.completedGames} fin.</span>}
								{day.pendingGames > 0 && <span>{day.pendingGames} pend.</span>}
								{day.dailySudokuCompleted && <span>Diario</span>}
							</div>
						)
					})}
				</div>
			</div>

			<div className='panel'>
				<h2>Partidas recientes</h2>
				<div className='history-list'>
					{games.map((game) => (
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
									Jugar nuevo
								</Link>
							)}
							{confirmDeleteId === game.id ? (
								<div className='confirm-row'>
									<button
										className='btn compact danger'
										disabled={deletingId === game.id}
										onClick={() => void handleDeleteGame(game.id)}>
										{deletingId === game.id ? '...' : 'Confirmar borrar'}
									</button>
									<button className='btn compact' onClick={() => setConfirmDeleteId(null)}>
										Cancelar
									</button>
								</div>
							) : (
								<button className='btn compact danger' onClick={() => setConfirmDeleteId(game.id)}>
									Borrar
								</button>
							)}
						</div>
					))}
					{games.length === 0 && <p className='muted'>Todavia no hay partidas guardadas.</p>}
				</div>
			</div>
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
			{Object.keys(items).length === 0 && <p className='muted'>Sin datos todavia.</p>}
		</div>
	</div>
)
