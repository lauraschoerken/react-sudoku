import '@/components/Auth/containers/AuthPage.scss'

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import type { CalendarDayResponse, UserStatsResponse } from '@/services/sudokuApi'
import { getUserCalendar, getUserStats } from '@/services/sudokuApi'
import { useAppSelector } from '@/store/hooks'

export const DashboardPage = () => {
	const user = useAppSelector((s) => s.auth.user)
	const now = useMemo(() => new Date(), [])
	const [stats, setStats] = useState<UserStatsResponse | null>(null)
	const [calendar, setCalendar] = useState<CalendarDayResponse[]>([])
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!user) return
		setError(null)
		void Promise.all([
			getUserStats(user.id),
			getUserCalendar(user.id, now.getFullYear(), now.getMonth() + 1),
		])
			.then(([nextStats, nextCalendar]) => {
				setStats(nextStats)
				setCalendar(nextCalendar)
			})
			.catch(() => setError('No se pudieron cargar tus estadisticas.'))
	}, [now, user])

	if (!user) {
		return (
			<div className='dashboard-page'>
				<h1 className='page-title'>Estadisticas</h1>
				<div className='panel'>
					<p>Necesitas iniciar sesion para ver tus partidas y calendario.</p>
					<Link className='btn' to='/account'>
						Ir a cuenta
					</Link>
				</div>
			</div>
		)
	}

	return (
		<div className='dashboard-page'>
			<h1 className='page-title'>Estadisticas</h1>
			{stats && (
				<div className='metric-grid'>
					<div className='metric'>
						<span>Partidas</span>
						<strong>{stats.playedGames}</strong>
					</div>
					<div className='metric'>
						<span>Ganadas</span>
						<strong>{stats.wonGames}</strong>
					</div>
					<div className='metric'>
						<span>Mejor tiempo</span>
						<strong>{stats.bestTimeSeconds}s</strong>
					</div>
					<div className='metric'>
						<span>Pistas</span>
						<strong>{stats.totalHints}</strong>
					</div>
				</div>
			)}

			<div className='panel' style={{ marginTop: '1rem' }}>
				<h2>Calendario</h2>
				<div className='calendar-grid'>
					{calendar.map((day) => {
						const active = day.completedGames > 0 || day.pendingGames > 0 || day.dailySudokuCompleted
						return (
							<div className={`calendar-day ${active ? 'has-activity' : ''}`} key={day.date}>
								<strong>{Number(day.date.slice(-2))}</strong>
								<span className='muted'>
									{day.completedGames} fin. / {day.pendingGames} pend.
								</span>
							</div>
						)
					})}
				</div>
			</div>
			{error && <p className='error-text'>{error}</p>}
		</div>
	)
}
