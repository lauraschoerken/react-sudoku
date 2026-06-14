import '@/components/Auth/containers/AuthPage.scss'

import { useState } from 'react'
import type { FormEvent } from 'react'

import { type Board } from '@/models/components/Sudoku'
import { type Difficulty, DifficultyOptions } from '@/models/utils/Difficulty'
import { type SubgridSize, SubgridSizeOptions } from '@/models/utils/Size'
import type { SudokuPuzzleResponse } from '@/services/sudokuApi'
import { generatePrintPack } from '@/services/sudokuApi'

const PrintableBoard = ({ board, title }: { board: Board; title: string }) => (
	<div className='print-card'>
		<h3>{title}</h3>
		<div className='print-board' style={{ gridTemplateColumns: `repeat(${board.length}, 1fr)` }}>
			{board.flat().map((value, index) => (
				<span key={index}>{value || ''}</span>
			))}
		</div>
	</div>
)

export const PrintPage = () => {
	const [quantity, setQuantity] = useState(4)
	const [subgridSize, setSubgridSize] = useState<SubgridSize>(3)
	const [difficulty, setDifficulty] = useState<Difficulty>(57)
	const [includeSolutions, setIncludeSolutions] = useState(true)
	const [pack, setPack] = useState<SudokuPuzzleResponse[]>([])
	const [error, setError] = useState<string | null>(null)

	const submit = async (event: FormEvent) => {
		event.preventDefault()
		setError(null)
		try {
			setPack(await generatePrintPack(quantity, subgridSize, difficulty, includeSolutions))
		} catch {
			setError('No se pudo generar el pack de sudokus.')
		}
	}

	return (
		<div className='print-page'>
			<h1 className='page-title'>Imprimir sudokus</h1>
			<form className='panel form-stack print-controls' onSubmit={submit}>
				<label>
					Cantidad
					<input
						type='number'
						min={1}
						max={50}
						value={quantity}
						onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))}
					/>
				</label>
				<label>
					Tamano
					<select
						value={subgridSize}
						onChange={(event) => setSubgridSize(Number(event.target.value) as SubgridSize)}>
						{SubgridSizeOptions.map(([name, value]) => (
							<option key={name} value={value}>
								{name}
							</option>
						))}
					</select>
				</label>
				<label>
					Dificultad
					<select
						value={difficulty}
						onChange={(event) => setDifficulty(Number(event.target.value) as Difficulty)}>
						{DifficultyOptions.map(([name, value]) => (
							<option key={name} value={value}>
								{name}
							</option>
						))}
					</select>
				</label>
				<label className='inline-row'>
					<input
						type='checkbox'
						checked={includeSolutions}
						onChange={(event) => setIncludeSolutions(event.target.checked)}
					/>
					Incluir soluciones
				</label>
				<div className='print-actions'>
					<button className='btn primary'>Generar</button>
					<button className='btn' type='button' onClick={() => window.print()} disabled={pack.length === 0}>
						Imprimir
					</button>
				</div>
				{error && <p className='error-text'>{error}</p>}
			</form>

			<div className='print-pack'>
				{pack.map((puzzle, index) => (
					<div className='print-sheet' key={puzzle.id}>
						<PrintableBoard board={puzzle.puzzle} title={`Sudoku ${index + 1}`} />
						{puzzle.solution && (
							<PrintableBoard board={puzzle.solution} title={`Solucion ${index + 1}`} />
						)}
					</div>
				))}
			</div>
		</div>
	)
}
