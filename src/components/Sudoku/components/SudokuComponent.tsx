import './SudokuComponent.scss'

import { useSudoku } from './SudokuGenerator'

export default function SudokuComponent() {
	const { grid, subgridSize, setSubgridSize, newGame, difficulty, setDifficulty } = useSudoku(3)

	const handleChangeSize = (e: React.ChangeEvent<HTMLSelectElement>): void => {
		const next = parseInt(e.target.value, 10)
		setSubgridSize(next)
	}

	const handleDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
		const next = parseInt(e.target.value, 10) // % oculto
		setDifficulty(next) // el hook regenerará el puzzle automáticamente
	}
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
						<option value={60}>Fácil (60% oculto)</option>
						<option value={70}>Normal (70% oculto)</option>
						<option value={80}>Difícil (80% oculto)</option>
					</select>
				</label>
			</div>

			<div className='sudoku-wrap'>
				<table className='sudoku' data-subgrid={subgridSize}>
					<tbody>
						{grid.map((row, r) => (
							<tr key={r}>
								{row.map((v, c) => (
									<td key={c}>{v === 0 ? '' : v}</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}
