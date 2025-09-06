import './SudokuComponent.scss'

import { useCallback, useEffect, useState } from 'react'

import { useSudoku } from './SudokuGenerator'
import { VictoryOverlay } from './VictoryOverlayComponent'

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

	const handleChangeSize = (e: React.ChangeEvent<HTMLSelectElement>): void => {
		const next = parseInt(e.target.value, 10)
		setSubgridSize(next)
	}

	const handleDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
		const next = parseInt(e.target.value, 10)
		setDifficulty(next)
	}

	const [selected, setSelected] = useState<{ r: number | null; c: number | null }>({
		r: null,
		c: null,
	})

	const selectedValue =
		selected.r !== null && selected.c !== null
			? puzzle[selected.r][selected.c] !== 0
				? puzzle[selected.r][selected.c]
				: userGrid[selected.r][selected.c] || 0
			: 0

	const handleCellChange = useCallback(
		(r: number, c: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
			const raw = e.target.value
			if (raw === '') {
				setCell(r, c, null)
				return
			}
			const n = Number(raw)
			if (!Number.isInteger(n)) return
			if (n < 1 || n > gridSize) return
			setCell(r, c, n)
		},
		[setCell, gridSize]
	)
	const [isComplete, setIsComplete] = useState(false)
	useEffect(() => {
		const filled = userGrid.every((row) => row.every((n) => n !== 0))
		const anyError = errors.some((row) => row.some(Boolean))
		setIsComplete(filled && !anyError)
	}, [userGrid, errors])
	return (
		<div>
			<div className='sudoku-toolbar' role='toolbar' aria-label='Controles de sudoku'>
				<button className='btn primary' onClick={newGame}>
					Nuevo
				</button>

				<label className='sudoku-size'>
					Tamaño:
					<select value={subgridSize} onChange={handleChangeSize}>
						<option value={2}>2×2</option>
						<option value={3}>3×3</option>
						<option value={4}>4×4</option>
					</select>
				</label>

				<label className='sudoku-size'>
					Dificultad:
					<select value={difficulty} onChange={handleDifficultyChange}>
						<option value={5}>Fácil (52% oculto)</option>
						<option value={60}>Normal (60% oculto)</option>
						<option value={67}>Difícil (67% oculto)</option>
						<option value={75}>Experto (75% oculto)</option>
					</select>
				</label>
			</div>

			<div className='sudoku-wrap'>
				<table className='sudoku' data-subgrid={subgridSize}>
					<tbody>
						{puzzle.map((row, r) => (
							<tr key={r}>
								{row.map((v, c) => {
									const given = v !== 0
									const val = userGrid[r][c]
									const hasError = errors[r][c]
									return (
										<td
											key={c}
											onClick={() => setSelected({ r, c })}
											onFocus={() => setSelected({ r, c })}
											tabIndex={0}
											className={[
												given ? 'given' : '',
												hasError ? 'error' : '',
												selected.r !== null &&
												selected.c !== null &&
												(r === selected.r || c === selected.c)
													? 'in-plus'
													: '',
												(() => {
													const cellVal = given ? v : val
													return selectedValue && cellVal === selectedValue ? 'same-number' : ''
												})(),
											]
												.filter(Boolean)
												.join(' ')}>
											{given ? (
												<span aria-label='celda dada'>{v}</span>
											) : (
												<input
													aria-label={`fila ${r + 1}, columna ${c + 1}`}
													inputMode='numeric'
													type='number'
													min={1}
													max={gridSize}
													value={val === 0 ? '' : val}
													onChange={handleCellChange(r, c)}
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
