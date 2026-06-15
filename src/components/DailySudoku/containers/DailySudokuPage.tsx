import '@/components/Auth/containers/AuthPage.scss'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import type { GameSessionResponse, SudokuPuzzleResponse } from '@/services/sudokuApi'
import { getDailySudokuResult, getTodayDailySudoku, startDailySudoku } from '@/services/sudokuApi'
import { useAppSelector } from '@/store/hooks'
import { localTodayKey, translateDifficulty, translateStatus } from '@/utils/appHelpers'

export const DailySudokuPage = () => {
	const navigate = useNavigate()
	const user = useAppSelector((s) => s.auth.user)
	const dateKey = useMemo(() => localTodayKey(), [])
	const [puzzle, setPuzzle] = useState<SudokuPuzzleResponse | null>(null)
	const [game, setGame] = useState<GameSessionResponse | null>(null)
	const [loading, setLoading] = useState(true)
	const [starting, setStarting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const loadDaily = useCallback(async () => {
		setLoading(true)
		setError(null)
		try {
			const nextPuzzle = await getTodayDailySudoku()
			setPuzzle(nextPuzzle)
			if (user) {
				try {
					setGame(await getDailySudokuResult(dateKey))
				} catch {
					setGame(null)
				}
			} else {
				setGame(null)
			}
		} catch {
			setError('No se pudo cargar el Sudoku diario. Revisa la conexión e inténtalo de nuevo.')
		} finally {
			setLoading(false)
		}
	}, [dateKey, user])

	useEffect(() => {
		void loadDaily()
	}, [loadDaily])

	const start = async () => {
		setStarting(true)
		setError(null)
		try {
			const nextGame = await startDailySudoku(dateKey)
			setGame(nextGame)
			navigate(`/?gameId=${nextGame.id}`)
		} catch {
			setError('No se pudo iniciar el Sudoku diario.')
		} finally {
			setStarting(false)
		}
	}

	const ctaLabel = game
		? game.status === 'WON' || game.status === 'LOST'
			? 'Ver resultado'
			: 'Continuar'
		: 'Jugar diario'

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

			{!loading && error && !puzzle && (
				<div className='panel state-panel'>
					<p className='error-text'>{error}</p>
					<button className='btn primary' onClick={loadDaily}>
						Reintentar
					</button>
				</div>
			)}

			{!loading && puzzle && (
				<div className='daily-card'>
					<div className='daily-card__copy'>
						<p className='eyebrow'>{translateDifficulty(puzzle.difficulty)}</p>
						<h2>{game ? translateStatus(game.status) : 'Disponible'}</h2>
						<p className='muted'>
							Todos juegan el mismo tablero hoy. Inicia sesión para guardar tu progreso, historial y
							resultado diario.
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
								Reintentar
							</button>
						</div>
						{game && (
							<p className='muted'>
								Partida #{game.id}, {game.gridSize}x{game.gridSize}.
							</p>
						)}
						{error && <p className='error-text'>{error}</p>}
					</div>

					<div
						className='daily-board'
						aria-label='Vista previa del Sudoku diario'
						style={{ gridTemplateColumns: `repeat(${puzzle.gridSize}, minmax(1.5rem, 2.2rem))` }}>
						{puzzle.puzzle.flat().map((value, index) => (
							<span className='daily-cell' key={index}>
								{value || ''}
							</span>
						))}
					</div>
				</div>
			)}
		</div>
	)
}
