import './SudokuComponent.scss'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import DigitalTimer from '@/components/elements/Timer/Timer'
import { useSudoku } from '@/hooks/useSudoku'
import { type Difficulty, DifficultyOptions } from '@/models/utils/Difficulty'
import { type SubgridSize, SubgridSizeOptions } from '@/models/utils/Size'
import { useAppSelector } from '@/store/hooks'

import { VictoryOverlay } from '../../elements/Victory/VictoryOverlayComponent'

/**
 * SudokuComponent
 *
 * - Conteo de errores ACUMULADOS (mistakes):
 *   Se incrementa cada vez que el usuario introduce un valor incorrecto en una celda.
 *   Aunque luego lo corrija, el error ya cuenta para el límite.
 * - Límite: si errorsLimiterEnabled && mistakes >= errorsLimit → se deshabilita la entrada.
 * - Visual: si errorsActive === false, no se muestran estilos/clases de error.
 */
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

	const { errorsActive, errorsLimit, errorsLimiterEnabled, timerEnabled, timerMode } =
		useAppSelector((s) => s.settings)

	const [mistakes, setMistakes] = useState(0)

	const prevUserGridRef = useRef<number[][] | null>(null)

	useEffect(() => {
		setMistakes(0)
		prevUserGridRef.current = userGrid
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

	const [selectedCell, setSelectedCell] = useState<{
		rowIndex: number | null
		colIndex: number | null
	}>({ rowIndex: null, colIndex: null })

	const selectedValue = useMemo(() => {
		if (selectedCell.rowIndex === null || selectedCell.colIndex === null) return 0
		const r = selectedCell.rowIndex
		const c = selectedCell.colIndex
		return puzzle[r][c] !== 0 ? puzzle[r][c] : userGrid[r][c] || 0
	}, [selectedCell, puzzle, userGrid])

	const handleCellChange = useCallback(
		(rowIndex: number, colIndex: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
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
		[setCell, gridSize, limitReached]
	)

	const [isComplete, setIsComplete] = useState(false)
	useEffect(() => {
		const allFilled = userGrid.every((row) => row.every((cell) => cell !== 0))
		const anyError = errors.some((row) => row.some(Boolean))
		setIsComplete(allFilled && !anyError)
	}, [userGrid, errors])

	const handleNewGame = () => {
		setMistakes(0)
		setSelectedCell({ rowIndex: null, colIndex: null })
		newGame()
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
						onChange={(e) => setSubgridSize(parseInt(e.target.value, 10) as SubgridSize)}
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
						onChange={(e) => setDifficulty(parseInt(e.target.value, 10) as Difficulty)}
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

				{limitReached && (
					<div className='errors-limit-banner' role='alert'>
						Límite de errores alcanzado. No puedes introducir más valores.
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

											// Visualmente ocultamos errores si errorsActive === false
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
															disabled={isComplete || limitReached}
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
								mode={timerMode}
								seconds={1 * 60}
								forceHours={timerMode === 'normal'}
								onFinish={() => console.log('¡Tiempo!')}
							/>
						</div>
					)}
				</div>
			</div>

			<VictoryOverlay
				isOpen={isComplete}
				onClose={() => setIsComplete(false)}
				onNewGame={handleNewGame}
			/>
		</div>
	)
}
