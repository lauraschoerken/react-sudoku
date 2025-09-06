import './SudokuComponent.scss'

import { useCallback, useEffect, useState } from 'react'

import { useSudoku } from '@/hooks/useSudoku'
import { type Difficulty, DifficultyOptions } from '@/models/utils/Difficulty'
import { type SubgridSize, SubgridSizeOptions } from '@/models/utils/Size'

import { VictoryOverlay } from '../../elements/Victory/VictoryOverlayComponent'

/**
 * SudokuComponent
 *
 * Componente de interfaz para jugar al Sudoku.
 * - Usa el hook useSudoku para la lógica de juego.
 * - Nombres explícitos (rowIndex/colIndex) en lugar de r/c.
 * - Dificultad tipada y sin enum (compatible con erasableSyntaxOnly).
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


	const [selectedCell, setSelectedCell] = useState<{
		rowIndex: number | null
		colIndex: number | null
	}>({ rowIndex: null, colIndex: null })

	const selectedValue =
		selectedCell.rowIndex !== null && selectedCell.colIndex !== null
			? puzzle[selectedCell.rowIndex][selectedCell.colIndex] !== 0
				? puzzle[selectedCell.rowIndex][selectedCell.colIndex]
				: userGrid[selectedCell.rowIndex][selectedCell.colIndex] || 0
			: 0

	const handleCellChange = useCallback(
		(rowIndex: number, colIndex: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
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
		[setCell, gridSize]
	)

	const [isComplete, setIsComplete] = useState(false)
	useEffect(() => {
		const allFilled = userGrid.every((row) => row.every((cell) => cell !== 0))
		const anyError = errors.some((row) => row.some(Boolean))
		setIsComplete(allFilled && !anyError)
	}, [userGrid, errors])

	return (
		<div>
			<div className='sudoku-toolbar' role='toolbar' aria-label='Controles de sudoku'>
				<button className='btn primary' onClick={newGame}>
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
			</div>

			<div className='sudoku-wrap'>
				<table className='sudoku' data-subgrid={subgridSize}>
					<tbody>
						{puzzle.map((row, rowIndex) => (
							<tr key={rowIndex}>
								{row.map((givenValue, colIndex) => {
									const isGiven = givenValue !== 0
									const playerValue = userGrid[rowIndex][colIndex]
									const hasError = errors[rowIndex][colIndex]
									const cellValue = isGiven ? givenValue : playerValue

									const isInSameRowOrCol =
										selectedCell.rowIndex !== null &&
										selectedCell.colIndex !== null &&
										(rowIndex === selectedCell.rowIndex || colIndex === selectedCell.colIndex)

									const isSameNumberHighlighted = selectedValue && cellValue === selectedValue

									return (
										<td
											key={colIndex}
											onClick={() => setSelectedCell({ rowIndex, colIndex })}
											onFocus={() => setSelectedCell({ rowIndex, colIndex })}
											tabIndex={0}
											className={[
												isGiven ? 'given' : '',
												hasError ? 'error' : '',
												isInSameRowOrCol ? 'in-plus' : '',
												isSameNumberHighlighted ? 'same-number' : '',
											]
												.filter(Boolean)
												.join(' ')}>
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
													disabled={isComplete}
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

			<VictoryOverlay
				isOpen={isComplete}
				onClose={() => setIsComplete(false)}
				onNewGame={newGame}
			/>
		</div>
	)
}
