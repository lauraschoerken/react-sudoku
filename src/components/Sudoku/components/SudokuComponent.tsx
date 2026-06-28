import './SudokuComponent.scss'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import DigitalTimer from '@/components/elements/Timer/Timer'
import { useSudoku } from '@/hooks/useSudoku'
import { type Difficulty, DifficultyOptions } from '@/models/utils/Difficulty'
import { type SubgridSize, SubgridSizeOptions } from '@/models/utils/Size'
import { useAppSelector } from '@/store/hooks'
import { isBoardValidSolution } from '@/utils/appHelpers'

import { ResultOverlay } from '../../elements/Result/ResultOverlayComponent'

type SudokuComponentProps = {
	initialGameId?: number
}

export default function SudokuComponent({ initialGameId: initialGameIdProp }: SudokuComponentProps = {}) {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const {
		errorsActive,
		errorsLimit,
		errorsLimiterEnabled,
		timerEnabled,
		timerMode,
		timerSeconds,
	} = useAppSelector((s) => s.settings)
	const authUser = useAppSelector((s) => s.auth.user)
	const initialGameId = useMemo(() => {
		if (initialGameIdProp) return initialGameIdProp
		const raw = searchParams.get('gameId')
		if (!raw) return undefined
		const parsed = Number(raw)
		return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
	}, [initialGameIdProp, searchParams])
	const sudokuOptions = useMemo(
		() => ({
			initialGameId,
			userId: authUser?.id,
			errorWarningsEnabled: errorsActive,
			maxErrors: errorsLimiterEnabled ? errorsLimit : undefined,
			timerMode,
			countdownSeconds: timerSeconds,
		}),
		[authUser?.id, errorsActive, errorsLimit, errorsLimiterEnabled, initialGameId, timerMode, timerSeconds]
	)

	const {
		puzzle,
		userGrid,
		errors,
		notes,
		setCell,
		toggleNote,
		subgridSize,
		setSubgridSize,
		newGame,
		difficulty,
		setDifficulty,
		gridSize,
		backendMistakes,
		hintsUsed,
		requestHint,
		finishGame,
		pauseGame,
		resumeGame,
		gameStatus,
		isDailyGame,
		usingBackend,
	} = useSudoku(3, undefined, sudokuOptions)


	const [mistakes, setMistakes] = useState(0)
	const [notesMode, setNotesMode] = useState(false)
	const prevUserGridRef = useRef<number[][] | null>(null)

	// Estado de final de partida (bloquea inputs y pausa reloj)
	const [isEnded, setIsEnded] = useState(false)

	// Overlays independientes de isEnded
	const [showWin, setShowWin] = useState(false)
	const [showLose, setShowLose] = useState(false)
	const [loseReason, setLoseReason] = useState<'time' | 'errors' | null>(null)

	// Señal para reiniciar el temporizador (sin ocultarlo) + control de arranque diferido
	const [resetSignal, setResetSignal] = useState(0)
	const [runFlag, setRunFlag] = useState(true) // controla running en el Timer

	const restartTimer = () => {
		setRunFlag(false)
		setResetSignal((n) => n + 1)
	}
	useEffect(() => {
		const id = setTimeout(() => setRunFlag(true), 0)
		return () => clearTimeout(id)
	}, [resetSignal])

	useEffect(() => {
		setMistakes(0)
		prevUserGridRef.current = userGrid
		setIsEnded(false)
		setShowWin(false)
		setShowLose(false)
		setLoseReason(null)
	}, [puzzle])

	const displayMistakes = usingBackend ? backendMistakes : mistakes
	const limitReached = errorsLimiterEnabled && displayMistakes >= errorsLimit
	const isPaused = gameStatus === 'PAUSED'

	useEffect(() => {
		if (gameStatus === 'WON') {
			setIsEnded(true)
			setShowLose(false)
			setLoseReason(null)
			return
		}
		if (gameStatus === 'LOST') {
			setIsEnded(true)
		}
	}, [gameStatus])

	useEffect(() => {
		const prev = prevUserGridRef.current
		if (!prev) {
			prevUserGridRef.current = userGrid
			return
		}

		let newMistakes = 0
		const size = userGrid.length

		for (let r = 0; r < size; r++) {
			for (let c = 0; c < size; c++) {
				const before = prev[r][c]
				const now = userGrid[r][c]
				if (before !== now && now !== 0) {
					if (errors[r][c]) newMistakes += 1
				}
			}
		}

		if (errorsActive && newMistakes > 0) setMistakes((m) => m + newMistakes)
		prevUserGridRef.current = userGrid
	}, [userGrid, errors, errorsActive])

	// Derrota por límite de errores
	useEffect(() => {
		if (limitReached && !isEnded) {
			setIsEnded(true)
			setShowLose(true)
			setLoseReason('errors')
			finishGame('LOST')
		}
	}, [finishGame, limitReached, isEnded])

	const [selectedCell, setSelectedCell] = useState<{
		rowIndex: number | null
		colIndex: number | null
	}>({
		rowIndex: null,
		colIndex: null,
	})

	const selectedValue = useMemo(() => {
		if (selectedCell.rowIndex === null || selectedCell.colIndex === null) return 0
		const r = selectedCell.rowIndex
		const c = selectedCell.colIndex
		return puzzle[r][c] !== 0 ? puzzle[r][c] : userGrid[r][c] || 0
	}, [selectedCell, puzzle, userGrid])

	const handleCellChange = useCallback(
		(rowIndex: number, colIndex: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
			if (isEnded || isPaused) return
			if (limitReached) return

			const raw = e.target.value
			if (raw === '') {
				setCell(rowIndex, colIndex, null)
				return
			}
			const n = Number(raw)
			if (!Number.isInteger(n)) return
			if (n < 1 || n > gridSize) return
			if (notesMode) {
				toggleNote(rowIndex, colIndex, n)
				e.currentTarget.value = ''
				return
			}
			setCell(rowIndex, colIndex, n)
		},
		[setCell, gridSize, limitReached, isEnded, isPaused, notesMode, toggleNote]
	)

	// Detectar victoria → finalizar partida y abrir overlay
	useEffect(() => {
		const allFilled = userGrid.every((row) => row.every((cell) => cell !== 0))
		const validSolution = isBoardValidSolution(userGrid, puzzle, subgridSize)
		if (allFilled && validSolution && !isEnded) {
			setIsEnded(true)
			setShowWin(true)
			finishGame('WON')
		}
	}, [userGrid, puzzle, subgridSize, isEnded, finishGame])

	// Nuevo puzzle (distinto) + reiniciar reloj
	const handleNewGame = () => {
		if (!isEnded) finishGame('ABANDONED')
		if (isDailyGame) {
			navigate('/daily')
			return
		}
		setMistakes(0)
		setSelectedCell({ rowIndex: null, colIndex: null })
		setIsEnded(false)
		setShowWin(false)
		setShowLose(false)
		setLoseReason(null)
		newGame()
		restartTimer()
	}

	// Reintentar el mismo puzzle + reiniciar reloj
	const handleRetrySame = () => {
		if (!isEnded) finishGame('ABANDONED')
		const size = userGrid.length
		for (let r = 0; r < size; r++) {
			for (let c = 0; c < size; c++) {
				if (puzzle[r][c] === 0) setCell(r, c, null)
			}
		}
		setMistakes(0)
		setSelectedCell({ rowIndex: null, colIndex: null })
		setIsEnded(false)
		setShowWin(false)
		setShowLose(false)
		setLoseReason(null)
		restartTimer()
	}

	// Cambiar tamaño → reinicia reloj
	const handleChangeSize = (value: SubgridSize) => {
		if (!isEnded) finishGame('ABANDONED')
		setSubgridSize(value)
		setMistakes(0)
		setIsEnded(false)
		setShowWin(false)
		setShowLose(false)
		setLoseReason(null)
		restartTimer()
	}

	// Cambiar dificultad → reinicia reloj
	const handleChangeDifficulty = (value: Difficulty) => {
		if (!isEnded) finishGame('ABANDONED')
		setDifficulty(value)
		setMistakes(0)
		setIsEnded(false)
		setShowWin(false)
		setShowLose(false)
		setLoseReason(null)
		restartTimer()
	}

	return (
		<div>
			<div className='sudoku-toolbar' role='toolbar' aria-label='Controles de sudoku'>
				<button className='btn primary' onClick={handleNewGame}>
					Nuevo
				</button>

				<button className='btn' onClick={requestHint} disabled={isEnded || !usingBackend}>
					Pista{hintsUsed > 0 ? ` (${hintsUsed})` : ''}
				</button>

				<button
					className={`btn ${notesMode ? 'active' : ''}`}
					onClick={() => setNotesMode((value) => !value)}
					aria-pressed={notesMode}>
					Notas
				</button>

				<button
					className={`btn ${isPaused ? 'active' : ''}`}
					onClick={isPaused ? resumeGame : pauseGame}
					disabled={isEnded || !usingBackend}>
					{isPaused ? 'Reanudar' : 'Pausar'}
				</button>

				<details className='sudoku-more'>
					<summary className='btn'>Más opciones</summary>
					<div className='sudoku-more__menu'>
						<Link className='btn compact' to='/print'>
							Imprimir sudokus
						</Link>
						<button className='btn compact' onClick={handleRetrySame} type='button'>
							Reiniciar
						</button>
						<Link className='btn compact' to='/settings'>
							Ajustes rápidos
						</Link>
					</div>
				</details>

				<label className='sudoku-size'>
					Tamaño:
					<select
						value={subgridSize}
						onChange={(e) => handleChangeSize(parseInt(e.target.value, 10) as SubgridSize)}
						aria-label='Tamaño de subcuadrícula'>
						{SubgridSizeOptions.map(([name, value]) => (
							<option key={name} value={value}>
								{name} ({value}×{value})
							</option>
						))}
					</select>
				</label>

				<label className='sudoku-size'>
					Dificultad:
					<select
						value={difficulty}
						onChange={(e) => handleChangeDifficulty(parseInt(e.target.value, 10) as Difficulty)}
						aria-label='Nivel de dificultad'>
						{DifficultyOptions.map(([name, value]) => (
							<option key={name} value={value}>
								{name} ({value}% celdas ocultas)
							</option>
						))}
					</select>
				</label>

				{errorsActive && (
					<div
						className={`errors-counter ${errorsLimiterEnabled ? 'with-limit' : ''}`}
						aria-live='polite'
						title={
							errorsLimiterEnabled
								? `Errores cometidos: ${displayMistakes} / ${errorsLimit}`
								: `Errores cometidos: ${displayMistakes}`
						}>
						{errorsLimiterEnabled ? (
							<span>
								Errores: {displayMistakes} / {errorsLimit}
							</span>
						) : (
							<span>Errores: {displayMistakes}</span>
						)}
					</div>
				)}
			</div>

			<div className='sudoku-stage'>
				<div className='sudoku-boardbox'>
					<div className='sudoku-wrap'>
						<table className='sudoku' data-subgrid={subgridSize}>
							<tbody>
								{puzzle.map((row, rowIndex) => (
									<tr key={rowIndex}>
										{row.map((givenValue, colIndex) => {
											const isGiven = givenValue !== 0
											const playerValue = userGrid[rowIndex][colIndex]
											const cellNotes = notes[`${rowIndex}:${colIndex}`] ?? []
											const hasError = errorsActive ? errors[rowIndex][colIndex] : false
											const cellValue = isGiven ? givenValue : playerValue

											const isInSameRowOrCol =
												selectedCell.rowIndex !== null &&
												selectedCell.colIndex !== null &&
												(rowIndex === selectedCell.rowIndex || colIndex === selectedCell.colIndex)

											const isSameNumberHighlighted = selectedValue && cellValue === selectedValue

											const cellClass = [
												isGiven ? 'given' : '',
												hasError ? 'error' : '',
												notesMode ? 'notes-mode' : '',
												isInSameRowOrCol ? 'in-plus' : '',
												isSameNumberHighlighted ? 'same-number' : '',
											]
												.filter(Boolean)
												.join(' ')

											return (
												<td
													key={colIndex}
													onClick={() => setSelectedCell({ rowIndex, colIndex })}
													onFocus={() => setSelectedCell({ rowIndex, colIndex })}
													tabIndex={0}
													className={cellClass}>
													{isGiven ? (
														<span aria-label='celda dada'>{givenValue}</span>
													) : (
														<>
															{playerValue === 0 && cellNotes.length > 0 && (
																<div
																	className='notes-grid'
																	style={{ gridTemplateColumns: `repeat(${subgridSize}, 1fr)` }}
																	aria-hidden='true'>
																	{Array.from({ length: gridSize }, (_, noteIndex) => {
																		const note = noteIndex + 1
																		return <span key={note}>{cellNotes.includes(note) ? note : ''}</span>
																	})}
																</div>
															)}
														<input
															aria-label={`fila ${rowIndex + 1}, columna ${colIndex + 1}`}
															inputMode='numeric'
															type='number'
															min={1}
															max={gridSize}
															value={notesMode ? '' : playerValue === 0 ? '' : playerValue}
															onChange={handleCellChange(rowIndex, colIndex)}
															className={hasError ? 'input-error' : undefined}
															disabled={isEnded || isPaused} // bloqueado si la partida terminó
														/>
														</>
													)}
												</td>
											)
										})}
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{timerEnabled && (
						<div className='sudoku-timer-stick'>
							<DigitalTimer
								key={resetSignal}
								mode={timerMode}
								seconds={timerSeconds} // 👈 usa los segundos desde Redux
								forceHours={timerMode === 'normal'}
								running={runFlag && !isEnded && !isPaused} // se para al terminar la partida
								resetSignal={resetSignal}
								onFinish={() => {
									if (!isEnded) {
										setIsEnded(true)
										setShowLose(true)
										setLoseReason('time')
										finishGame('LOST', timerSeconds)
									}
								}}
							/>
						</div>
					)}
				</div>
			</div>

			{/* Victoria */}
			<ResultOverlay
				isOpen={showWin}
				variant='win'
				onClose={() => setShowWin(false)}
				onPrimary={handleNewGame}
				primaryLabel={isDailyGame ? 'Volver al diario' : undefined}
				closeLabel={isDailyGame ? 'Ver tablero' : undefined}
			/>

			{/* Derrota (errores o tiempo) */}
			<ResultOverlay
				isOpen={showLose}
				variant='lose'
				loseReason={loseReason ?? undefined}
				onClose={() => setShowLose(false)}
				onPrimary={handleRetrySame}
			/>
		</div>
	)
}
