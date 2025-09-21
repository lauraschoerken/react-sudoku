import './SudokuComponent.scss'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import DigitalTimer from '@/components/elements/Timer/Timer'
import { useSudoku } from '@/hooks/useSudoku'
import { type Difficulty, DifficultyOptions } from '@/models/utils/Difficulty'
import { type SubgridSize, SubgridSizeOptions } from '@/models/utils/Size'
import { useAppSelector } from '@/store/hooks'

import { ResultOverlay } from '../../elements/Result/ResultOverlayComponent'

export default function SudokuComponent() {
	const {
		puzzle,
		userGrid,
		errors,
		setCell,
		subgridSize,
		setSubgridSize,
		newGame,
		difficulty,
		setDifficulty,
		gridSize,
	} = useSudoku(3)

	const {
		errorsActive,
		errorsLimit,
		errorsLimiterEnabled,
		timerEnabled,
		timerMode,
		timerSeconds, // 👈 segundos del countdown desde Redux
	} = useAppSelector((s) => s.settings)

	const [mistakes, setMistakes] = useState(0)
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

	const limitReached = errorsLimiterEnabled && mistakes >= errorsLimit

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

		if (newMistakes > 0) setMistakes((m) => m + newMistakes)
		prevUserGridRef.current = userGrid
	}, [userGrid, errors])

	// Derrota por límite de errores
	useEffect(() => {
		if (limitReached && !isEnded) {
			setIsEnded(true)
			setShowLose(true)
			setLoseReason('errors')
		}
	}, [limitReached, isEnded])

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
			if (isEnded) return
			if (limitReached) return

			const raw = e.target.value
			if (raw === '') {
				setCell(rowIndex, colIndex, null)
				return
			}
			const n = Number(raw)
			if (!Number.isInteger(n)) return
			if (n < 1 || n > gridSize) return
			setCell(rowIndex, colIndex, n)
		},
		[setCell, gridSize, limitReached, isEnded]
	)

	// Detectar victoria → finalizar partida y abrir overlay
	useEffect(() => {
		const allFilled = userGrid.every((row) => row.every((cell) => cell !== 0))
		const anyError = errors.some((row) => row.some(Boolean))
		if (allFilled && !anyError && !isEnded) {
			setIsEnded(true)
			setShowWin(true)
		}
	}, [userGrid, errors, isEnded])

	// Nuevo puzzle (distinto) + reiniciar reloj
	const handleNewGame = () => {
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
								? `Errores cometidos: ${mistakes} / ${errorsLimit}`
								: `Errores cometidos: ${mistakes}`
						}>
						{errorsLimiterEnabled ? (
							<span>
								Errores: {mistakes} / {errorsLimit}
							</span>
						) : (
							<span>Errores: {mistakes}</span>
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
														<input
															aria-label={`fila ${rowIndex + 1}, columna ${colIndex + 1}`}
															inputMode='numeric'
															type='number'
															min={1}
															max={gridSize}
															value={playerValue === 0 ? '' : playerValue}
															onChange={handleCellChange(rowIndex, colIndex)}
															className={hasError ? 'input-error' : undefined}
															disabled={isEnded} // bloqueado si la partida terminó
														/>
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
								running={runFlag && !isEnded} // se para al terminar la partida
								resetSignal={resetSignal}
								onFinish={() => {
									if (!isEnded) {
										setIsEnded(true)
										setShowLose(true)
										setLoseReason('time')
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
