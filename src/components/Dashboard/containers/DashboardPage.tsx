import '@/components/Auth/containers/AuthPage.scss'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { LoginPrompt } from '@/components/elements/LoginGate/LoginGate'
import type { CalendarDayResponse, GameSessionResponse, UserStatsResponse } from '@/services/sudokuApi'
import {
	deleteMyGame,
	getMyCalendar,
	getMyGames,
	getMyStats,
	isAuthError,
	SudokuApiError,
} from '@/services/sudokuApi'
import { useAppSelector } from '@/store/hooks'
import { formatDuration, localTodayKey, translateDifficulty, translateStatus } from '@/utils/appHelpers'

const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export const DashboardPage = () => {
	const { t } = useTranslation('common')
	const user = useAppSelector((state) => state.auth.user)
	const initialMonth = useMemo(() => new Date(), [])
	const [calendarCursor, setCalendarCursor] = useState({
		year: initialMonth.getFullYear(),
		month: initialMonth.getMonth() + 1,
	})
	const [stats, setStats] = useState<UserStatsResponse | null>(null)
	const [calendar, setCalendar] = useState<CalendarDayResponse[]>([])
	const [games, setGames] = useState<GameSessionResponse[]>([])
	const [error, setError] = useState<string | null>(null)
	const [deletingId, setDeletingId] = useState<number | null>(null)
	const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
	const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null)

	const loadData = useCallback(() => {
		if (!user) return
		setError(null)
		void Promise.all([
			getMyStats(),
			getMyCalendar(calendarCursor.year, calendarCursor.month),
			getMyGames(),
		])
			.then(([nextStats, nextCalendar, nextGames]) => {
				setStats(nextStats)
				setCalendar(nextCalendar)
				setGames(nextGames)
			})
			.catch((requestError) => {
				if (isAuthError(requestError)) {
					setStats(null)
					setCalendar([])
					setGames([])
					const status = requestError instanceof SudokuApiError ? ` (HTTP ${requestError.status})` : ''
					setError(`El servidor no ha podido validar la sesión${status}. Tu usuario sigue conectado.`)
					return
				}
				setError('No se pudieron cargar tus estadisticas.')
			})
	}, [calendarCursor, user])

	useEffect(() => {
		loadData()
	}, [loadData])

	const handleDeleteGame = async (sessionId: number) => {
		setDeletingId(sessionId)
		try {
			await deleteMyGame(sessionId)
			setConfirmDeleteId(null)
			setGames((currentGames) => currentGames.filter((game) => game.id !== sessionId))
			void loadData()
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
	const selectedDayGames = selectedCalendarDay
		? games.filter((game) => game.startedAt.slice(0, 10) === selectedCalendarDay)
		: []
	const monthLabel = new Date(calendarCursor.year, calendarCursor.month - 1, 1).toLocaleDateString('es-ES', {
		month: 'long',
		year: 'numeric',
	})

	return (
		<div className='dashboard-page'>
			<div className='page-heading'>
				<div>
					<p className='eyebrow'>{t('progress')}</p>
					<h1 className='page-title'>{t('statistics')}</h1>
				</div>
				<span className='status-pill'>{user.username}</span>
			</div>

			{error && <p className='error-text'>{error}</p>}

			{lastActiveGame && (
				<div className='continue-banner'>
					<div>
						<strong>{t('gameInProgress')}</strong>
						<p className='muted'>
							#{lastActiveGame.id}, {translateDifficulty(lastActiveGame.difficulty)},{' '}
							{lastActiveGame.gridSize}x{lastActiveGame.gridSize},{' '}
							{translateStatus(lastActiveGame.status)}
						</p>
					</div>
					<Link
						className='btn primary'
						to={`/?gameId=${lastActiveGame.id}${lastActiveGame.dailyGame ? '&daily=1' : ''}`}>
						{t('continue')}
					</Link>
				</div>
			)}

			{stats && (
				<>
					<div className='metric-grid'>
						<Metric label={t('gamesPlayed')} value={stats.playedGames} />
						<Metric label={t('wins')} value={stats.wonGames} />
						<Metric label={t('winRate')} value={stats.playedGames ? `${winRate}%` : '-'} />
						<Metric label={t('bestTime')} value={formatDuration(stats.bestTimeSeconds)} />
						<Metric label={t('hintsUsed')} value={stats.totalHints} />
						<Metric label={t('mistakes')} value={stats.totalMistakes} />
					</div>

					{stats.playedGames === 0 && (
						<div className='panel state-panel'>
							<h2>{t('noFinishedGames')}</h2>
							<p className='muted'>{t('firstGameHint')}</p>
						</div>
					)}

					<div className='stats-grid'>
						<Breakdown title={t('byDifficulty')} items={stats.byDifficulty} labelFormatter={translateDifficulty} />
						<Breakdown title={t('bySize')} items={stats.byGridSize} labelFormatter={(size) => `${size}x${size}`} />
					</div>
				</>
			)}

			<div className='panel calendar-panel'>
				<div className='calendar-heading'>
					<h2>{t('calendar')}</h2>
					<div className='calendar-nav' aria-label={t('navigateCalendar')}>
						<button
							className='btn compact'
							type='button'
							onClick={() =>
								setCalendarCursor(({ year, month }) =>
									month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }
								)
							}
							aria-label={t('previousMonth')}>
							&lt;
						</button>
						<strong>{monthLabel}</strong>
						<button
							className='btn compact'
							type='button'
							onClick={() =>
								setCalendarCursor(({ year, month }) =>
									month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 }
								)
							}
							aria-label={t('nextMonth')}>
							&gt;
						</button>
					</div>
				</div>
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
							<button
								className={`calendar-day ${active ? 'has-activity' : ''} ${day.date === todayKey ? 'is-today' : ''}`}
								key={day.date}
								onClick={() => setSelectedCalendarDay(day.date)}
								type='button'>
								<strong>{Number(day.date.slice(-2))}</strong>
								{day.completedGames > 0 && <span>{day.completedGames} fin.</span>}
								{day.pendingGames > 0 && <span>{day.pendingGames} pend.</span>}
								{day.dailySudokuCompleted && <span>Diario</span>}
							</button>
						)
					})}
				</div>
			</div>

			{selectedCalendarDay && (
				<div className='panel selected-day-panel'>
					<h2>{selectedCalendarDay}</h2>
					{selectedDayGames.length > 0 ? (
						<div className='selected-day-list'>
							{selectedDayGames.map((game) => (
								<div className='selected-day-row' key={game.id}>
									<strong>#{game.id}</strong>
									<span>{translateDifficulty(game.difficulty)}</span>
									<span>{game.gridSize}x{game.gridSize}</span>
									<span>{translateStatus(game.status)}</span>
								</div>
							))}
						</div>
					) : (
						<p className='muted'>No hay partidas guardadas ese día.</p>
					)}
				</div>
			)}

			<div className='panel'>
				<h2>{t('recentGames')}</h2>
				<div className='history-list'>
			{games.map((game) => (
						<div className='history-row game-row' key={game.id}>
							<strong>#{game.id}</strong>
							<span>{translateDifficulty(game.difficulty)}</span>
							<span>
								{game.gridSize}x{game.gridSize}
							</span>
							<span>{translateStatus(game.status)}</span>
							{game.status === 'WON' ? (
								<Link className='btn compact' to={game.dailyGame ? '/daily' : '/?new=1'}>
									{game.dailyGame ? t('viewDaily') : t('playAgain')}
								</Link>
							) : game.status === 'LOST' ? (
								<Link className='btn compact' to={`/?gameId=${game.id}${game.dailyGame ? '&daily=1' : ''}`}>
									{t('retry')}
								</Link>
							) : (
								<Link className='btn compact' to={`/?gameId=${game.id}${game.dailyGame ? '&daily=1' : ''}`}>
									{t('continue')}
								</Link>
							)}
							<button className='btn compact danger' onClick={() => setConfirmDeleteId(game.id)}>
								{t('delete')}
							</button>
						</div>
					))}
					{games.length === 0 && <p className='muted'>Todavia no hay partidas guardadas.</p>}
				</div>
			</div>

			{confirmDeleteId !== null && (
				<div className='confirm-modal-overlay' role='dialog' aria-modal='true' aria-labelledby='confirm-delete-title'>
					<div className='confirm-modal'>
						<p className='eyebrow'>{t('gameLabel')} #{confirmDeleteId}</p>
						<h2 id='confirm-delete-title'>¿Seguro que quieres eliminar esta partida?</h2>
						<p className='muted'>Esta acción no se puede deshacer.</p>
						<div className='confirm-modal__actions'>
							<button className='btn' onClick={() => setConfirmDeleteId(null)} type='button'>
								{t('cancel')}
							</button>
							<button
								className='btn danger'
								disabled={deletingId === confirmDeleteId}
								onClick={() => void handleDeleteGame(confirmDeleteId)}
								type='button'>
								{deletingId === confirmDeleteId ? 'Eliminando...' : 'Sí, eliminar'}
							</button>
						</div>
					</div>
				</div>
			)}
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
