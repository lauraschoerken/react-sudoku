import '@/components/Auth/containers/AuthPage.scss'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import SudokuComponent from '../components/SudokuComponent'
import { getActiveGame } from '@/services/sudokuApi'
import { useAppSelector } from '@/store/hooks'
import { translateDifficulty, formatDuration } from '@/utils/appHelpers'

export const Sudoku = () => {
	const user = useAppSelector((s) => s.auth.user)
	const [searchParams] = useSearchParams()
	const requestedGameId = useMemo(() => {
		const raw = searchParams.get('gameId')
		if (!raw) return undefined
		const parsed = Number(raw)
		return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
	}, [searchParams])
	const dailyMode = searchParams.get('daily') === '1'
	const newGameRequested = searchParams.get('new') === '1'
	const [resumeGameId, setResumeGameId] = useState<number | null>(null)
	const [resumeInfo, setResumeInfo] = useState<{
		difficulty: string
		gridSize: number
		elapsed: number
		status: string
	} | null>(null)
	const [showModal, setShowModal] = useState(false)
	const [activeGameId, setActiveGameId] = useState<number | undefined>(undefined)
	const [skipActiveCheck, setSkipActiveCheck] = useState(false)
	const [checked, setChecked] = useState(!user || requestedGameId !== undefined || newGameRequested)

	useEffect(() => {
		if (!user || requestedGameId !== undefined || newGameRequested) {
			setChecked(true)
			return
		}
		void getActiveGame()
			.then((game) => {
				if (!game.started) {
					setActiveGameId(game.id)
					return
				}
				setResumeGameId(game.id)
				setResumeInfo({
					difficulty: game.difficulty,
					gridSize: game.gridSize,
					elapsed: game.elapsedSeconds,
					status: game.status,
				})
				setShowModal(true)
			})
			.catch(() => {
				// No active game – proceed to new game
			})
			.finally(() => setChecked(true))
		// Only run once when user changes
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [newGameRequested, requestedGameId, user?.id])

	const handleResume = () => {
		if (resumeGameId) setActiveGameId(resumeGameId)
		setShowModal(false)
	}

	const handleNewGame = () => {
		setActiveGameId(undefined)
		setSkipActiveCheck(true)
		setShowModal(false)
	}

	if (!checked) {
		return (
			<div className='game-loading'>
				<div className='game-loading__spinner' />
				<p className='muted'>Cargando tu sesión...</p>
			</div>
		)
	}

	return (
		<>
			{showModal && resumeInfo && (
				<div className='resume-modal-overlay'>
					<div className='resume-modal'>
						<h2>Partida en curso</h2>
						<p className='muted'>
							Tienes una partida de {translateDifficulty(resumeInfo.difficulty)}{' '}
							{resumeInfo.gridSize}×{resumeInfo.gridSize} en curso.{' '}
							{resumeInfo.elapsed > 0 && `Tiempo: ${formatDuration(resumeInfo.elapsed)}.`}
						</p>
						<div className='resume-modal__actions'>
							<button className='btn primary' onClick={handleResume}>
								Continuar partida
							</button>
							<button className='btn' onClick={handleNewGame}>
								Nueva partida
							</button>
						</div>
					</div>
				</div>
			)}

			{!showModal && (
				<SudokuComponent
					dailyMode={dailyMode}
					initialGameId={requestedGameId ?? activeGameId}
					skipActiveGameCheck={skipActiveCheck || newGameRequested}
				/>
			)}
		</>
	)
}
