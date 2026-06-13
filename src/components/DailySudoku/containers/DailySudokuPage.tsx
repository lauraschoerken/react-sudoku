import '@/components/Auth/containers/AuthPage.scss'

import { useEffect, useState } from 'react'

import type { GameSessionResponse, SudokuPuzzleResponse } from '@/services/sudokuApi'
import { getTodayDailySudoku, startDailySudoku } from '@/services/sudokuApi'
import { useAppSelector } from '@/store/hooks'

const todayKey = () => new Date().toISOString().slice(0, 10)

export const DailySudokuPage = () => {
	const user = useAppSelector((s) => s.auth.user)
	const [puzzle, setPuzzle] = useState<SudokuPuzzleResponse | null>(null)
	const [game, setGame] = useState<GameSessionResponse | null>(null)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		void getTodayDailySudoku()
			.then(setPuzzle)
			.catch(() => setError('No se pudo cargar el sudoku diario.'))
	}, [])

	const start = async () => {
		setError(null)
		try {
			setGame(await startDailySudoku(todayKey(), user?.id))
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
					Iniciar diario
				</button>
				{game && (
					<p>
						Partida diaria #{game.id} creada. Dificultad {game.difficulty}, tamano{' '}
						{game.gridSize}x{game.gridSize}.
					</p>
				)}
				{!user && <p className='muted'>Entra con tu cuenta para guardar el resultado diario.</p>}
				{error && <p className='error-text'>{error}</p>}
			</div>
		</div>
	)
}
