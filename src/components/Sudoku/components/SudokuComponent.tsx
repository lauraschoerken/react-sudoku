import './SudokuComponent.scss'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import DigitalTimer from '@/components/elements/Timer/Timer'
import { useSudoku } from '@/hooks/useSudoku'
import { type Difficulty, DifficultyOptions } from '@/models/utils/Difficulty'
import { type SubgridSize, SubgridSizeOptions } from '@/models/utils/Size'
import { useAppSelector } from '@/store/hooks'
import { clearStoredGameTime, persistGameTimeOnExit, storeGameTime } from '@/services/sudokuApi'
import { isBoardValidSolution } from '@/utils/appHelpers'

import { ResultOverlay } from '../../elements/Result/ResultOverlayComponent'

type SudokuComponentProps = {
	initialGameId?: number
	skipActiveGameCheck?: boolean
	dailyMode?: boolean
	dailyDate?: string
	onCompleted?: () => void
}

export default function SudokuComponent({
	initialGameId: initialGameIdProp,
	skipActiveGameCheck,
	dailyMode = false,
	dailyDate,
	onCompleted,
}: SudokuComponentProps = {}) {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const { t } = useTranslation('common')
	const { errorsActive, errorsLimit, errorsLimiterEnabled, timerEnabled, timerMode, timerSeconds } =
		useAppSelector((s) => s.settings)
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
			dailyDate,
			initialGameId,
			userId: authUser?.id,
			errorWarningsEnabled: errorsActive,
			maxErrors: errorsLimiterEnabled ? errorsLimit : undefined,
			timerMode,
			countdownSeconds: timerSeconds,
			skipActiveGameCheck: skipActiveGameCheck ?? false,
		}),
		[
			dailyDate,
			authUser?.id,
			errorsActive,
			errorsLimit,
			errorsLimiterEnabled,
			initialGameId,
			timerMode,
			timerSeconds,
			skipActiveGameCheck,
		]
	)

	const {
		puzzle,
		userGrid,
		errors,
		notes,
		setCell,
		toggleNote,
		subgridSize,
		newGame,
		difficulty,
		gridSize,
		backendMistakes,
		elapsedSeconds,
		backendTimerMode,
		backendCountdownSeconds,
		hintsUsed,
		requestHint,
		finishGame,
		pauseGame,
		resumeGame,
		resetGame,
		persistElapsedTime,
		syncGameSettings,
		gameId,
		gameStatus,
		isDailyGame,
		hintedCells,
		usingBackend,
		gameLoading,
		gameError,
	} = useSudoku(3, undefined, sudokuOptions)

	const [mistakes, setMistakes] = useState(0)
	const [timerElapsed, setTimerElapsed] = useState(0)
	const [notesMode, setNotesMode] = useState(false)
	const effectiveTimerMode = usingBackend ? backendTimerMode : timerMode
	const effectiveTimerSeconds = usingBackend
		? (backendCountdownSeconds ?? timerSeconds)
		: timerSeconds
	const prevUserGridRef = useRef<number[][] | null>(null)
	const puzzleSignature = useMemo(() => puzzle.map((row) => row.join(',')).join('|'), [puzzle])

	// Estado de final de partida (bloquea inputs y pausa reloj)
	const [isEnded, setIsEnded] = useState(false)

	// Overlays independientes de isEnded
	const [showWin, setShowWin] = useState(false)
	const [showLose, setShowLose] = useState(false)
	const [loseReason, setLoseReason] = useState<'time' | 'errors' | null>(null)
	const [retryError, setRetryError] = useState<string | null>(null)
	const [resetting, setResetting] = useState(false)
	const [abandoningDaily, setAbandoningDaily] = useState(false)
	const [showNewModal, setShowNewModal] = useState(false)
	const [creatingNewGame, setCreatingNewGame] = useState(false)
	const [newSize, setNewSize] = useState<SubgridSize>(subgridSize)
	const [newDifficulty, setNewDifficulty] = useState<Difficulty>(difficulty)

	// Señal para reiniciar el temporizador (sin ocultarlo) + control de arranque diferido
	const [resetSignal, setResetSignal] = useState(0)
	const [runFlag, setRunFlag] = useState(true) // controla running en el Timer
	const isPaused = gameStatus === 'PAUSED'
	const timerElapsedRef = useRef(0)
	const finishingPromiseRef = useRef<Promise<unknown> | null>(null)
	const settingsSyncRef = useRef('')
	useEffect(() => {
		if (!timerEnabled && isPaused) resumeGame()
	}, [isPaused, resumeGame, timerEnabled])
	useEffect(() => {
		timerElapsedRef.current = timerElapsed
		if (usingBackend && gameId !== null && !isEnded) storeGameTime(gameId, timerElapsed)
	}, [gameId, isEnded, timerElapsed, usingBackend])

	useEffect(() => {
		if (!timerEnabled || !usingBackend || gameId === null || isEnded) return
		const persistBeforeExit = () => {
			storeGameTime(gameId, timerElapsedRef.current)
			persistGameTimeOnExit(gameId, timerElapsedRef.current)
		}
		const persistWhenHidden = () => {
			if (document.visibilityState === 'hidden') persistBeforeExit()
		}
		window.addEventListener('pagehide', persistBeforeExit)
		document.addEventListener('visibilitychange', persistWhenHidden)
		return () => {
			window.removeEventListener('pagehide', persistBeforeExit)
			document.removeEventListener('visibilitychange', persistWhenHidden)
		}
	}, [gameId, isEnded, timerEnabled, usingBackend])

	useEffect(() => {
		if (!usingBackend || gameId === null || isEnded) return
		const signature = [
			gameId,
			timerMode,
			timerSeconds,
			errorsActive,
			errorsLimiterEnabled ? errorsLimit : 'none',
		].join(':')
		if (settingsSyncRef.current === signature) return
		settingsSyncRef.current = signature
		void syncGameSettings({
			timerMode: timerMode === 'countdown' ? 'COUNTDOWN' : 'NORMAL',
			countdownSeconds: timerMode === 'countdown' ? timerSeconds : undefined,
			maxErrors: errorsLimiterEnabled ? errorsLimit : undefined,
			errorWarningsEnabled: errorsActive,
		})
	}, [
		errorsActive,
		errorsLimit,
		errorsLimiterEnabled,
		gameId,
		isEnded,
		syncGameSettings,
		timerMode,
		timerSeconds,
		usingBackend,
	])

	useEffect(() => {
		if (!timerEnabled || !usingBackend || gameId === null || isEnded || isPaused) return
		const syncId = window.setInterval(() => {
			void persistElapsedTime(timerElapsedRef.current)
		}, 5000)
		return () => {
			window.clearInterval(syncId)
			void persistElapsedTime(timerElapsedRef.current)
		}
	}, [gameId, isEnded, isPaused, persistElapsedTime, timerEnabled, usingBackend])

	const restartTimer = () => {
		setRunFlag(false)
		setResetSignal((n) => n + 1)
	}
	useEffect(() => {
		const id = setTimeout(() => setRunFlag(true), 0)
		return () => clearTimeout(id)
	}, [resetSignal])

	useEffect(() => {
		setTimerElapsed(elapsedSeconds)
		setMistakes(0)
		prevUserGridRef.current = userGrid
		setIsEnded(false)
		setShowWin(false)
		setShowLose(false)
		setLoseReason(null)
		setRetryError(null)
	}, [puzzleSignature])

	useEffect(() => {
		if (gameId !== null && isEnded) clearStoredGameTime(gameId)
	}, [gameId, isEnded])

	const displayMistakes = usingBackend ? backendMistakes : mistakes
	const limitReached = errorsLimiterEnabled && displayMistakes >= errorsLimit
	const isDailyView = dailyMode || isDailyGame

	// ── Loading / error state ────────────────────────────────────────────────
	useEffect(() => {
		if (gameStatus === 'WON') {
			setIsEnded(true)
			setShowLose(false)
			setLoseReason(null)
			return
		}
		if (gameStatus === 'LOST') {
			setIsEnded(true)
			setShowLose(true)
			setLoseReason(
				backendTimerMode === 'countdown' &&
				backendCountdownSeconds !== undefined &&
				elapsedSeconds >= backendCountdownSeconds
					? 'time'
					: 'errors'
			)
			return
		}
		if (gameStatus === 'ABANDONED' && !isDailyGame) {
			void resumeGame()
		}
	}, [backendCountdownSeconds, backendTimerMode, elapsedSeconds, gameStatus, isDailyGame, resumeGame])

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
			finishingPromiseRef.current = finishGame('LOST', timerElapsed)
		}
	}, [finishGame, limitReached, isEnded])

	const [selectedCell, setSelectedCell] = useState<{
		rowIndex: number | null
		colIndex: number | null
	}>({
		rowIndex: null,
		colIndex: null,
	})
	const [heldNumber, setHeldNumber] = useState<number | null>(null)
	const [isCoarsePointer, setIsCoarsePointer] = useState(false)
	const longPressTimerRef = useRef<number | null>(null)
	const longPressTriggeredRef = useRef(false)

	useEffect(() => {
		const media = window.matchMedia('(pointer: coarse)')
		const updatePointer = () => setIsCoarsePointer(media.matches)
		updatePointer()
		media.addEventListener('change', updatePointer)
		return () => media.removeEventListener('change', updatePointer)
	}, [])

	useEffect(() => {
		setHeldNumber(null)
	}, [puzzleSignature])

	const selectedValue = useMemo(() => {
		if (heldNumber !== null) return heldNumber
		if (selectedCell.rowIndex === null || selectedCell.colIndex === null) return 0
		const r = selectedCell.rowIndex
		const c = selectedCell.colIndex
		return puzzle[r][c] !== 0 ? puzzle[r][c] : userGrid[r][c] || 0
	}, [heldNumber, selectedCell, puzzle, userGrid])

	const applyNumberToCell = useCallback((rowIndex: number, colIndex: number, value: number | null) => {
		if (isEnded || isPaused || limitReached) return
		if (puzzle[rowIndex][colIndex] !== 0 || hintedCells.has(`${rowIndex}:${colIndex}`)) return
		if (value === null) {
			setCell(rowIndex, colIndex, null, timerElapsed)
			return
		}
		if (notesMode) toggleNote(rowIndex, colIndex, value)
		else setCell(rowIndex, colIndex, value, timerElapsed)
	}, [hintedCells, isEnded, isPaused, limitReached, notesMode, puzzle, setCell, timerElapsed, toggleNote])

	const selectCell = useCallback((rowIndex: number, colIndex: number) => {
		setSelectedCell({ rowIndex, colIndex })
		if (heldNumber !== null) applyNumberToCell(rowIndex, colIndex, heldNumber)
	}, [applyNumberToCell, heldNumber])

	const clearLongPressTimer = useCallback(() => {
		if (longPressTimerRef.current !== null) window.clearTimeout(longPressTimerRef.current)
		longPressTimerRef.current = null
	}, [])

	useEffect(() => () => clearLongPressTimer(), [clearLongPressTimer])

	const beginNumberPress = useCallback((value: number) => {
		longPressTriggeredRef.current = false
		clearLongPressTimer()
		longPressTimerRef.current = window.setTimeout(() => {
			longPressTriggeredRef.current = true
			setHeldNumber((current) => current === value ? null : value)
			if ('vibrate' in navigator) navigator.vibrate(25)
		}, 450)
	}, [clearLongPressTimer])

	const tapNumber = useCallback((value: number) => {
		clearLongPressTimer()
		if (longPressTriggeredRef.current) {
			longPressTriggeredRef.current = false
			return
		}
		setHeldNumber(null)
		if (selectedCell.rowIndex === null || selectedCell.colIndex === null) return
		applyNumberToCell(selectedCell.rowIndex, selectedCell.colIndex, value)
	}, [applyNumberToCell, clearLongPressTimer, selectedCell])

	const eraseSelectedCell = useCallback(() => {
		setHeldNumber(null)
		if (selectedCell.rowIndex === null || selectedCell.colIndex === null) return
		applyNumberToCell(selectedCell.rowIndex, selectedCell.colIndex, null)
	}, [applyNumberToCell, selectedCell])

	const handleCellChange = useCallback(
		(rowIndex: number, colIndex: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
			if (isEnded || isPaused) return
			if (limitReached) return

			const raw = e.target.value
			if (raw === '') {
				applyNumberToCell(rowIndex, colIndex, null)
				return
			}
			const n = Number(raw)
			if (!Number.isInteger(n)) return
			if (n < 1 || n > gridSize) return
			applyNumberToCell(rowIndex, colIndex, n)
		},
		[applyNumberToCell, gridSize, limitReached, isEnded, isPaused]
	)

	// Detectar victoria → finalizar partida y abrir overlay
	useEffect(() => {
		const allFilled = userGrid.every((row) => row.every((cell) => cell !== 0))
		const validSolution = isBoardValidSolution(userGrid, puzzle, subgridSize)
		if (allFilled && validSolution && !isEnded) {
			setIsEnded(true)
			setShowWin(true)
			void finishGame('WON').then(() => onCompleted?.())
		}
	}, [userGrid, puzzle, subgridSize, isEnded, finishGame, onCompleted])

	// Nuevo puzzle (distinto) + reiniciar reloj
	const handleNewGame = () => {
		if (isDailyGame) {
			navigate('/daily')
			return
		}
		setNewSize(subgridSize)
		setNewDifficulty(difficulty)
		setShowNewModal(true)
	}

	const handleCreateNewGame = async () => {
		if (creatingNewGame) return
		setCreatingNewGame(true)
		try {
			if (!isEnded) await finishGame('ABANDONED')
			setMistakes(0)
			setSelectedCell({ rowIndex: null, colIndex: null })
			setIsEnded(false)
			setShowWin(false)
			setShowLose(false)
			setLoseReason(null)
			setShowNewModal(false)
			newGame(newSize, newDifficulty)
			restartTimer()
		} finally {
			setCreatingNewGame(false)
		}
	}

	// Reintentar el mismo puzzle + reiniciar reloj
	const handleRetrySame = async () => {
		if (resetting) return
		setResetting(true)
		setRetryError(null)
		try {
			await finishingPromiseRef.current
		} catch {
			// El reinicio sigue siendo posible aunque fallase la sincronización final.
		}
		void resetGame()
			.then((resetSuccessful) => {
				if (!resetSuccessful) throw new Error('No se pudo reiniciar la partida')
				setMistakes(0)
				setSelectedCell({ rowIndex: null, colIndex: null })
				setIsEnded(false)
				setShowWin(false)
				setShowLose(false)
				setLoseReason(null)
				restartTimer()
			})
			.catch(() => {
				setRetryError('No se pudo reiniciar la partida. Comprueba tu sesión y vuelve a intentarlo.')
				setShowLose(true)
			})
			.finally(() => setResetting(false))
	}

	const handleAbandonDaily = () => {
		if (!isDailyGame || abandoningDaily || isEnded) return
		setAbandoningDaily(true)
		void finishGame('ABANDONED').finally(() => {
			setAbandoningDaily(false)
			navigate('/daily')
		})
	}

	if (gameLoading) {
		return (
			<div className='game-loading'>
				<div className='game-loading__spinner' />
				<p className='muted'>{t('loadingSudoku')}</p>
			</div>
		)
	}

	if (gameError) {
		return (
			<div className='game-loading'>
				<p className='error-text'>{gameError}</p>
				<button className='btn primary' onClick={() => newGame()}>
					{t('retry')}
				</button>
			</div>
		)
	}

	return (
		<div>
			{!authUser && (
				<div className='guest-warning' role='status'>
					Estas jugando sin iniciar sesión. Tu progreso no se guardará al cerrar o recargar la página.
				</div>
			)}
			<div className='sudoku-toolbar' role='toolbar' aria-label='Controles de sudoku'>
				{!isDailyView && (
					<button className='btn primary' onClick={handleNewGame}>
						{t('newGame')}
					</button>
				)}

				<button className='btn' onClick={requestHint} disabled={isEnded || isPaused}>
					{t('hint')}{hintsUsed > 0 ? ` (${hintsUsed})` : ''}
				</button>

				<button
					className={`btn ${notesMode ? 'active' : ''}`}
					onClick={() => setNotesMode((value) => !value)}
					aria-pressed={notesMode}>
					{t('notes')}
				</button>

				{timerEnabled && <button
					className={`btn ${isPaused ? 'active' : ''}`}
					onClick={isPaused ? resumeGame : () => pauseGame(timerElapsed)}
					disabled={isEnded}>
					{isPaused ? t('resume') : t('pause')}
				</button>}

				{!isDailyView && <details className='sudoku-more'>
					<summary className='btn' aria-label='Más opciones' title='Más opciones'>...</summary>
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
				</details>}

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
								{t('errors')}: {displayMistakes} / {errorsLimit}
							</span>
						) : (
								<span>{t('errors')}: {displayMistakes}</span>
						)}
					</div>
				)}
			</div>

			{showNewModal && (
				<div className='sudoku-modal-overlay' role='dialog' aria-modal='true' aria-label='Nuevo sudoku'>
					<div className='sudoku-new-modal'>
						<div>
							<p className='eyebrow'>{t('newSession')}</p>
							<h2>{t('chooseSudoku')}</h2>
							<p className='muted'>Se mantienen como propuesta el tamaño y la dificultad usados anteriormente.</p>
						</div>
						<label>
							Tamaño
							<select value={newSize} onChange={(event) => setNewSize(Number(event.target.value) as SubgridSize)}>
								{SubgridSizeOptions.map(([name, value]) => (
									<option key={name} value={value}>{name} ({value}×{value})</option>
								))}
							</select>
						</label>
						<label>
							Dificultad
							<select value={newDifficulty} onChange={(event) => setNewDifficulty(Number(event.target.value) as Difficulty)}>
								{DifficultyOptions.map(([name, value]) => (
									<option key={name} value={value}>{name} ({value}% ocultas)</option>
								))}
							</select>
						</label>
						<div className='sudoku-new-modal__actions'>
							<button className='btn' onClick={() => setShowNewModal(false)} type='button'>{t('cancel')}</button>
							<button className='btn primary' disabled={creatingNewGame} onClick={() => void handleCreateNewGame()} type='button'>
								{creatingNewGame ? t('generating') : t('generate')}
							</button>
						</div>
					</div>
				</div>
			)}

			<div className={`sudoku-stage ${isPaused ? 'sudoku-stage--paused' : ''}`}>
				<div className='sudoku-boardbox'>
					<div className='sudoku-wrap'>
						<table className='sudoku' data-subgrid={subgridSize} style={{ '--grid-size': gridSize } as React.CSSProperties}>
							<tbody>
								{puzzle.map((row, rowIndex) => (
									<tr key={rowIndex}>
										{row.map((givenValue, colIndex) => {
										const isHinted = hintedCells.has(`${rowIndex}:${colIndex}`)
										const isGiven = givenValue !== 0 || isHinted
											const playerValue = userGrid[rowIndex][colIndex]
											const cellNotes = notes[`${rowIndex}:${colIndex}`] ?? []
											const hasError = errorsActive ? errors[rowIndex][colIndex] : false
										const cellValue = isGiven ? givenValue || playerValue : playerValue

											const isInSameRowOrCol =
												selectedCell.rowIndex !== null &&
												selectedCell.colIndex !== null &&
												(rowIndex === selectedCell.rowIndex || colIndex === selectedCell.colIndex)

											const isSameNumberHighlighted = selectedValue && cellValue === selectedValue
											const isSelected = rowIndex === selectedCell.rowIndex && colIndex === selectedCell.colIndex

											const cellClass = [
												isGiven ? 'given' : '',
												hasError ? 'error' : '',
												notesMode ? 'notes-mode' : '',
												isInSameRowOrCol ? 'in-plus' : '',
												isSameNumberHighlighted ? 'same-number' : '',
												isSelected ? 'selected-cell' : '',
											]
												.filter(Boolean)
												.join(' ')

											return (
												<td
													key={colIndex}
													onClick={() => selectCell(rowIndex, colIndex)}
												onContextMenu={(event) => {
													if (cellValue) event.preventDefault()
												}}
													onFocus={() => setSelectedCell({ rowIndex, colIndex })}
												onPointerCancel={clearLongPressTimer}
												onPointerDown={() => {
													if (cellValue) beginNumberPress(cellValue)
												}}
												onPointerLeave={clearLongPressTimer}
												onPointerUp={clearLongPressTimer}
													tabIndex={0}
													className={cellClass}>
													{isGiven ? (
												<span aria-label={isHinted ? 'pista fija' : 'celda dada'}>{cellValue}</span>
													) : (
														<>
															{playerValue === 0 && cellNotes.length > 0 && (
																<div
																	className='notes-grid'
																	style={{ gridTemplateColumns: `repeat(${subgridSize}, 1fr)` }}
																	aria-hidden='true'>
																	{Array.from({ length: gridSize }, (_, noteIndex) => {
																		const note = noteIndex + 1
																		return (
																			<span key={note}>{cellNotes.includes(note) ? note : ''}</span>
																		)
																	})}
																</div>
															)}
															<input
																aria-label={`fila ${rowIndex + 1}, columna ${colIndex + 1}`}
																inputMode={isCoarsePointer ? 'none' : 'numeric'}
																type='number'
																min={1}
																max={gridSize}
																value={playerValue === 0 ? '' : playerValue}
																onChange={handleCellChange(rowIndex, colIndex)}
																readOnly={isCoarsePointer}
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

					<div className={`sudoku-keypad ${heldNumber !== null ? 'has-held-number' : ''}`} aria-label='Teclado numérico del Sudoku'>
						<div className='sudoku-keypad__numbers' data-grid-size={gridSize} style={{ gridTemplateColumns: `repeat(${gridSize > 9 ? 8 : gridSize}, minmax(0, 1fr))` }}>
							{Array.from({ length: gridSize }, (_, index) => index + 1).map((value) => (
								<button
									aria-label={heldNumber === value ? `${value} fijado. Mantén pulsado para soltarlo` : `Número ${value}. Mantén pulsado para fijarlo`}
									aria-pressed={heldNumber === value}
									className={heldNumber === value ? 'is-held' : ''}
									disabled={isEnded || isPaused}
									key={value}
									onClick={() => tapNumber(value)}
									onContextMenu={(event) => event.preventDefault()}
									onPointerCancel={clearLongPressTimer}
									onPointerDown={(event) => {
										event.currentTarget.setPointerCapture(event.pointerId)
										beginNumberPress(value)
									}}
									onPointerUp={clearLongPressTimer}
									type='button'>
									{value}
								</button>
							))}
						</div>
						<button className='sudoku-keypad__erase' disabled={isEnded || isPaused} onClick={eraseSelectedCell} type='button' aria-label='Borrar casilla seleccionada'>⌫</button>
						<div className='sudoku-keypad__status' role='status'>
							{heldNumber !== null ? <><strong>{heldNumber} en la mano</strong><span>Toca las casillas para añadirlo.</span><button onClick={() => setHeldNumber(null)} type='button'>Soltar</button></> : <span>Mantén pulsado un número del tablero o del teclado para llevarlo.</span>}
						</div>
					</div>

					{timerEnabled && (
						<div className='sudoku-timer-stick'>
							<DigitalTimer
								key={resetSignal}
								mode={effectiveTimerMode}
								seconds={effectiveTimerSeconds}
								initialSeconds={elapsedSeconds}
								onTick={(shownSeconds) =>
									setTimerElapsed(
										effectiveTimerMode === 'countdown'
											? Math.max(0, effectiveTimerSeconds - shownSeconds)
											: shownSeconds
									)
								}
								forceHours={effectiveTimerMode === 'normal'}
								running={runFlag && !isEnded && !isPaused} // se para al terminar la partida
								resetSignal={resetSignal}
								onToggleRunning={isPaused ? resumeGame : () => pauseGame(timerElapsed)}
								controlsDisabled={isEnded}
								onFinish={() => {
									if (!isEnded) {
										setIsEnded(true)
										setShowLose(true)
										setLoseReason('time')
										finishingPromiseRef.current = finishGame(
											'LOST',
											effectiveTimerMode === 'countdown' ? effectiveTimerSeconds : timerElapsed
										)
									}
								}}
							/>
						</div>
					)}
				</div>
			</div>

			{isDailyView && !isEnded && (
				<div className='daily-game-actions'>
					<button className='btn' disabled={abandoningDaily} onClick={handleAbandonDaily} type='button'>
										{abandoningDaily ? t('generating') : t('abandonDaily')}
					</button>
				</div>
			)}

			{/* Victoria */}
			<ResultOverlay
				isOpen={showWin}
				variant='win'
				title={isDailyGame ? 'Sudoku diario completado' : undefined}
				message={
					isDailyGame
						? 'Has completado el reto diario. Puedes revisar otros días o volver a jugar cuando quieras.'
						: undefined
				}
				onClose={() => (isDailyGame ? navigate('/daily') : setShowWin(false))}
				onPrimary={() => {
					if (isDailyGame) {
						navigate('/?new=1')
						return
					}
					setShowWin(false)
					handleNewGame()
				}}
							primaryLabel={isDailyGame ? t('newNormalGame') : undefined}
							closeLabel={isDailyGame ? t('reviewDaily') : undefined}
			/>

			{/* Derrota (errores o tiempo) */}
			<ResultOverlay
				isOpen={showLose}
				variant='lose'
				loseReason={loseReason ?? undefined}
				message={retryError ?? undefined}
				onClose={() => setShowLose(false)}
				onPrimary={handleRetrySame}
				primaryDisabled={resetting}
				primaryLabel={resetting ? 'Reiniciando...' : undefined}
			/>
		</div>
	)
}
