import './DashboardPage.scss'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { LoginPrompt } from '@/components/elements/LoginGate/LoginGate'
import type { GameSessionResponse } from '@/services/sudokuApi'
import { deleteMyGame, getMyGames, isAuthError } from '@/services/sudokuApi'
import { useAppSelector } from '@/store/hooks'
import { formatDuration, translateDifficulty, translateStatus } from '@/utils/appHelpers'

type Granularity = 'day' | 'week' | 'month' | 'custom'

type ActivityPoint = {
	key: string
	label: string
	total: number
	wins: number
	losses: number
	other: number
}

const localDateKey = (date: Date) => {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

const parseLocalDate = (value: string) => new Date(`${value}T00:00:00`)

const getPeriodRange = (granularity: Exclude<Granularity, 'custom'>, anchor: Date) => {
	const from = new Date(anchor)
	const to = new Date(anchor)
	if (granularity === 'week') {
		const daysSinceMonday = (anchor.getDay() + 6) % 7
		from.setDate(anchor.getDate() - daysSinceMonday)
		to.setTime(from.getTime())
		to.setDate(from.getDate() + 6)
	} else if (granularity === 'month') {
		from.setDate(1)
		to.setMonth(anchor.getMonth() + 1, 0)
	}
	return { from: localDateKey(from), to: localDateKey(to) }
}

const formatPeriodLabel = (granularity: Granularity, fromDate: string, toDate: string) => {
	const from = parseLocalDate(fromDate)
	const to = parseLocalDate(toDate)
	if (granularity === 'day') {
		return from.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
	}
	if (granularity === 'month') {
		return from.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
	}
	if (granularity === 'week') {
		const start = from.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
		const end = to.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
		return `${start} – ${end}`
	}
	return `${from.toLocaleDateString('es-ES')} – ${to.toLocaleDateString('es-ES')}`
}

export const DashboardPage = () => {
	const { t } = useTranslation('common')
	const user = useAppSelector((state) => state.auth.user)
	const defaultRange = useMemo(() => getPeriodRange('month', new Date()), [])
	const [games, setGames] = useState<GameSessionResponse[]>([])
	const [granularity, setGranularity] = useState<Granularity>('month')
	const [fromDate, setFromDate] = useState(defaultRange.from)
	const [toDate, setToDate] = useState(defaultRange.to)
	const [error, setError] = useState<string | null>(null)
	const [deletingId, setDeletingId] = useState<number | null>(null)
	const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
	const selectPeriod = (nextGranularity: Granularity) => {
		setGranularity(nextGranularity)
		if (nextGranularity === 'custom') return
		const range = getPeriodRange(nextGranularity, new Date())
		setFromDate(range.from)
		setToDate(range.to)
	}
	const navigatePeriod = (direction: -1 | 1) => {
		if (granularity === 'custom') return
		const anchor = parseLocalDate(fromDate)
		if (granularity === 'day') anchor.setDate(anchor.getDate() + direction)
		if (granularity === 'week') anchor.setDate(anchor.getDate() + (direction * 7))
		if (granularity === 'month') anchor.setMonth(anchor.getMonth() + direction, 1)
		const range = getPeriodRange(granularity, anchor)
		setFromDate(range.from)
		setToDate(range.to)
	}

	const loadData = useCallback(() => {
		if (!user) return
		setError(null)
		void getMyGames()
			.then(setGames)
			.catch((requestError) => {
				setGames([])
				setError(isAuthError(requestError) ? 'El servidor no ha podido validar la sesión.' : 'No se pudieron cargar tus estadísticas.')
			})
	}, [user])

	useEffect(() => loadData(), [loadData])

	const filteredGames = useMemo(() => {
		const from = new Date(`${fromDate}T00:00:00`).getTime()
		const to = new Date(`${toDate}T23:59:59.999`).getTime()
		return games.filter((game) => {
			const started = new Date(game.startedAt).getTime()
			return started >= from && started <= to
		})
	}, [fromDate, games, toDate])

	const finishedGames = filteredGames.filter((game) => game.status === 'WON' || game.status === 'LOST')
	const wonGames = finishedGames.filter((game) => game.status === 'WON')
	const winRate = finishedGames.length ? Math.round((wonGames.length / finishedGames.length) * 100) : 0
	const averageTime = finishedGames.length
		? Math.round(finishedGames.reduce((sum, game) => sum + game.elapsedSeconds, 0) / finishedGames.length)
		: 0
	const bestTime = wonGames.length ? Math.min(...wonGames.map((game) => game.elapsedSeconds)) : 0
	const totalMistakes = filteredGames.reduce((sum, game) => sum + game.mistakes, 0)
	const totalHints = filteredGames.reduce((sum, game) => sum + game.hintsUsed, 0)
	const lastActiveGame = games.find((game) => game.status === 'IN_PROGRESS' || game.status === 'PAUSED')

	const activity = useMemo(() => {
		const points: ActivityPoint[] = []
		if (granularity === 'day') {
			for (let hour = 0; hour < 24; hour += 1) {
				const value = String(hour).padStart(2, '0')
				points.push({ key: value, label: `${value} h`, total: 0, wins: 0, losses: 0, other: 0 })
			}
		} else {
			const cursor = parseLocalDate(fromDate)
			const last = parseLocalDate(toDate)
			while (cursor <= last) {
				const key = localDateKey(cursor)
				const label = granularity === 'week'
					? cursor.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }).replace('.', '')
					: granularity === 'month'
						? String(cursor.getDate())
						: cursor.toLocaleDateString('es-ES', { day: 'numeric', month: 'numeric' })
				points.push({ key, label, total: 0, wins: 0, losses: 0, other: 0 })
				cursor.setDate(cursor.getDate() + 1)
			}
		}

		const byKey = new Map(points.map((point) => [point.key, point]))
		for (const game of filteredGames) {
			const startedAt = new Date(game.startedAt)
			const key = granularity === 'day' ? String(startedAt.getHours()).padStart(2, '0') : localDateKey(startedAt)
			const point = byKey.get(key)
			if (!point) continue
			point.total += 1
			if (game.status === 'WON') point.wins += 1
			else if (game.status === 'LOST') point.losses += 1
			else point.other += 1
		}
		return points
	}, [filteredGames, fromDate, granularity, toDate])

	const periodLabel = formatPeriodLabel(granularity, fromDate, toDate)
	const canGoNext = granularity !== 'custom' && toDate < localDateKey(new Date())
	const activityTitle = granularity === 'day' ? 'Actividad por hora' : granularity === 'week' ? 'Actividad de lunes a domingo' : 'Actividad por día'

	const difficultyData = useMemo(() => {
		const groups = new Map<string, { total: number; wins: number }>()
		for (const game of finishedGames) {
			const groupKey = `${game.difficulty}:${game.gridSize}`
			const current = groups.get(groupKey) ?? { total: 0, wins: 0 }
			current.total += 1
			if (game.status === 'WON') current.wins += 1
			groups.set(groupKey, current)
		}
		return [...groups.entries()]
	}, [finishedGames])

	const handleDeleteGame = async (sessionId: number) => {
		setDeletingId(sessionId)
		try {
			await deleteMyGame(sessionId)
			setConfirmDeleteId(null)
			setGames((current) => current.filter((game) => game.id !== sessionId))
		} catch {
			setError('No se pudo eliminar la partida.')
		} finally {
			setDeletingId(null)
		}
	}

	if (!user) {
		return <div className='dashboard-page'><LoginPrompt description='Inicia sesión para ver tu historial y estadísticas.' title='Estadísticas' /></div>
	}

	return (
		<div className='dashboard-page stats-dashboard'>
			<header className='stats-hero'>
				<div><p className='eyebrow'>{t('progress')}</p><h1>{t('statistics')}</h1><p className='muted'>Analiza tu evolución y descubre dónde puedes mejorar.</p></div>
				<span className='status-pill'>{user.username}</span>
			</header>

			{error && <p className='error-text'>{error}</p>}

			<section className='stats-filter panel' aria-label='Periodo de estadísticas'>
				<div className='stats-period-tabs' role='group' aria-label='Agrupar estadísticas'>
					{([['day', 'Diario'], ['week', 'Semanal'], ['month', 'Mensual'], ['custom', 'Personalizado']] as const).map(([value, label]) => (
						<button className={granularity === value ? 'is-active' : ''} key={value} onClick={() => selectPeriod(value)} type='button'>{label}</button>
					))}
				</div>
				{granularity === 'custom' ? <div className='stats-date-range'>
					<label>Desde<input type='date' value={fromDate} max={toDate} onChange={(event) => setFromDate(event.target.value)} /></label>
					<span aria-hidden='true'>→</span>
					<label>Hasta<input type='date' value={toDate} min={fromDate} onChange={(event) => setToDate(event.target.value)} /></label>
				</div> : <div className='stats-period-nav'>
					<button aria-label='Periodo anterior' onClick={() => navigatePeriod(-1)} type='button'>‹</button>
					<strong>{periodLabel}</strong>
					<button aria-label='Periodo siguiente' disabled={!canGoNext} onClick={() => navigatePeriod(1)} type='button'>›</button>
				</div>}
			</section>

			{lastActiveGame && (
				<section className='continue-banner'>
					<div><strong>{t('gameInProgress')}</strong><p className='muted'>{translateDifficulty(lastActiveGame.difficulty)} · {lastActiveGame.gridSize}×{lastActiveGame.gridSize} · {formatDuration(lastActiveGame.elapsedSeconds)}</p></div>
					<Link className='btn primary' to={lastActiveGame.dailyGame ? '/daily' : `/?gameId=${lastActiveGame.id}`}>{t('continue')}</Link>
				</section>
			)}

			<section className='stats-metrics'>
				<Metric label='Partidas' value={filteredGames.length} detail={`${finishedGames.length} terminadas`} />
				<Metric label='Victorias' value={`${winRate}%`} detail={`${wonGames.length} sudokus resueltos`} tone='success' />
				<Metric label='Tiempo medio' value={formatDuration(averageTime)} detail={bestTime ? `Mejor: ${formatDuration(bestTime)}` : 'Sin marca todavía'} />
				<Metric label='Ayudas' value={totalMistakes + totalHints} detail={`${totalMistakes} errores · ${totalHints} pistas`} tone='warning' />
			</section>

			<section className='stats-charts'>
				<div className='stats-chart-card stats-chart-card--wide'>
					<header><div><p className='eyebrow'>Actividad</p><h2>{activityTitle}</h2></div><span className='chart-legend'><i className='is-win' /> Ganadas <i className='is-loss' /> Con errores <i className='is-other' /> Otras</span></header>
					<ActivityChart data={activity} granularity={granularity} />
				</div>
				<div className='stats-chart-card success-card'>
					<div className='success-ring' style={{ '--success': `${winRate * 3.6}deg` } as React.CSSProperties}><strong>{winRate}%</strong><span>victorias</span></div>
					<div><p className='eyebrow'>Rendimiento</p><h2>{wonGames.length} de {finishedGames.length}</h2><p className='muted'>Partidas completadas correctamente.</p></div>
				</div>
				<div className='stats-chart-card difficulty-card'>
					<header><div><p className='eyebrow'>Dificultad</p><h2>Tasa de éxito</h2></div></header>
					<DifficultyChart data={difficultyData} />
				</div>
			</section>

			<section className='stats-history panel'>
				<header><div><p className='eyebrow'>Historial</p><h2>Partidas del periodo</h2></div><span className='muted'>{filteredGames.length} resultados</span></header>
				<div className='stats-history-list'>
					{filteredGames.slice(0, 8).map((game) => (
						<div className='stats-history-row' key={game.id}>
							<div className='history-game'><span className={`result-dot result-dot--${game.status.toLowerCase()}`} /><div><strong>{game.dailyGame ? 'Sudoku diario' : translateDifficulty(game.difficulty)}</strong><small>{new Date(game.startedAt).toLocaleDateString('es-ES')} · {game.gridSize}×{game.gridSize}</small></div></div>
							<span className={`history-status history-status--${game.status.toLowerCase()}`}>{translateStatus(game.status)}</span>
							<strong className='history-time'>{game.elapsedSeconds > 0 ? formatDuration(game.elapsedSeconds) : '—'}</strong>
							<div className='history-actions'><Link className='btn compact' to={game.dailyGame ? '/daily' : `/?gameId=${game.id}`}>{game.status === 'IN_PROGRESS' || game.status === 'PAUSED' ? 'Continuar' : 'Ver'}</Link><button aria-label='Eliminar partida' className='btn compact danger history-delete' onClick={() => setConfirmDeleteId(game.id)} title='Eliminar partida' type='button'><TrashIcon /></button></div>
						</div>
					))}
					{filteredGames.length === 0 && <div className='stats-empty'><strong>Sin partidas en este periodo</strong><span>Prueba a ampliar las fechas seleccionadas.</span></div>}
				</div>
			</section>

			{confirmDeleteId !== null && (
				<div className='confirm-modal-overlay' role='dialog' aria-modal='true' aria-labelledby='confirm-delete-title'>
					<div className='confirm-modal'><p className='eyebrow'>Eliminar partida</p><h2 id='confirm-delete-title'>¿Seguro que quieres eliminarla?</h2><p className='muted'>Esta acción no se puede deshacer.</p><div className='confirm-modal__actions'><button className='btn' onClick={() => setConfirmDeleteId(null)} type='button'>Cancelar</button><button className='btn danger' disabled={deletingId === confirmDeleteId} onClick={() => void handleDeleteGame(confirmDeleteId)} type='button'>{deletingId === confirmDeleteId ? 'Eliminando...' : 'Sí, eliminar'}</button></div></div>
				</div>
			)}
		</div>
	)
}

const Metric = ({ label, value, detail, tone }: { label: string; value: string | number; detail: string; tone?: 'success' | 'warning' }) => (
	<div className={`stats-metric ${tone ? `stats-metric--${tone}` : ''}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
)

const TrashIcon = () => (
	<svg aria-hidden='true' fill='none' height='16' viewBox='0 0 24 24' width='16'>
		<path d='M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5' stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' strokeWidth='1.8' />
	</svg>
)

const ActivityChart = ({ data, granularity }: { data: ActivityPoint[]; granularity: Granularity }) => {
	const max = Math.max(1, ...data.map((value) => value.total))
	return (
		<div className={`activity-chart activity-chart--${granularity}`}>
			{data.map((value) => (
				<div className='activity-column' key={value.key} title={`${value.label}: ${value.total} partidas · ${value.wins} ganadas · ${value.losses} con errores · ${value.other} otras`}>
					<div className='activity-bar' style={{ height: value.total ? `${Math.max(8, (value.total / max) * 100)}%` : '0' }}>
						<span className='is-win' style={{ height: `${value.total ? (value.wins / value.total) * 100 : 0}%` }} />
						<span className='is-loss' style={{ height: `${value.total ? (value.losses / value.total) * 100 : 0}%` }} />
						<span className='is-other' style={{ height: `${value.total ? (value.other / value.total) * 100 : 0}%` }} />
					</div>
					<small>{value.label}</small>
				</div>
			))}
		</div>
	)
}

const DifficultyChart = ({ data }: { data: Array<[string, { total: number; wins: number }]> }) => data.length ? (
	<div className='difficulty-bars'>{data.map(([label, value]) => { const [difficulty, size] = label.split(':'); const rate = value.total ? Math.round((value.wins / value.total) * 100) : 0; return <div key={label}><span><strong>{translateDifficulty(difficulty)} · {size}×{size}</strong><small>{rate}% · {value.wins}/{value.total}</small></span><i><b style={{ width: `${rate}%` }} /></i></div> })}</div>
) : <div className='chart-empty'>Sin partidas terminadas.</div>
