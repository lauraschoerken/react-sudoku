import '@/components/Auth/containers/AuthPage.scss'

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { GameSessionResponse, SudokuPuzzleResponse } from '@/services/sudokuApi'
import { getDailySudokuResult, getTodayDailySudoku, startDailySudoku } from '@/services/sudokuApi'
import { useAppSelector } from '@/store/hooks'

const todayKey = () => new Date().toISOString().slice(0, 10)

export const DailySudokuPage = () => {
	const navigate = useNavigate()
	const user = useAppSelector((s) => s.auth.user)
	const [puzzle, setPuzzle] = useState<SudokuPuzzleResponse | null>(null)
	const [game, setGame] = useState<GameSessionResponse | null>(null)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		void getTodayDailySudoku()
			.then(setPuzzle)
			.catch(() => setError('No se pudo cargar el sudoku diario.'))
	}, [])

	useEffect(() => {
		if (!user) return
		void getDailySudokuResult(todayKey())
			.then(setGame)
			.catch(() => {
				// No daily game has been started yet for this user.
			})
	}, [user])

	const start = async () => {
		setError(null)
		try {
			const nextGame = await startDailySudoku(todayKey())
			setGame(nextGame)
			navigate(`/?gameId=${nextGame.id}`)
		} catch {
			setError('No se pudo iniciar el sudoku diario.')
		}
	}

	return (
		<div className='daily-page'>
			<h1 className='page-title'>Sudoku diario</h1>
			<div className='panel'>
				<p className='muted'>{todayKey()}</p>
				{puzzle && (
					<div className='daily-board' aria-label='Sudoku diario'>
						{puzzle.puzzle.flat().map((value, index) => (
							<span className='daily-cell' key={index}>
								{value || ''}
							</span>
						))}
					</div>
				)}
				<button className='btn primary' onClick={start}>
					{game ? 'Continuar diario' : 'Iniciar diario'}
				</button>
				{game && (
					<p>
						Partida diaria #{game.id}. Estado {game.status}. Dificultad {game.difficulty}, tamano{' '}
						{game.gridSize}x{game.gridSize}.
					</p>
				)}
				{!user && <p className='muted'>Entra con tu cuenta para guardar el resultado diario.</p>}
				{error && <p className='error-text'>{error}</p>}
			</div>
		</div>
	)
}
