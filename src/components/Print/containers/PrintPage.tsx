import '@/components/Auth/containers/AuthPage.scss'

import { useState } from 'react'
import type { FormEvent } from 'react'

import { type Difficulty, DifficultyOptions } from '@/models/utils/Difficulty'
import { type SubgridSize, SubgridSizeOptions } from '@/models/utils/Size'
import type { SudokuPuzzleResponse } from '@/services/sudokuApi'
import { generatePrintPack } from '@/services/sudokuApi'

const PrintableBoard = ({ board, title }: { board: number[][]; title: string }) => {
	const size = board.length
	return (
		<div className='print-card'>
			<h3>{title}</h3>
			<div className='print-board' style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
				{board.flat().map((value, index) => (
					<span key={index}>{value !== 0 ? value : ''}</span>
				))}
			</div>
		</div>
	)
}

export const PrintPage = () => {
	const [quantity, setQuantity] = useState(4)
	const [subgridSize, setSubgridSize] = useState<SubgridSize>(3)
	const [difficulty, setDifficulty] = useState<Difficulty>(57)
	const [includeSolutions, setIncludeSolutions] = useState(true)
	const [pack, setPack] = useState<SudokuPuzzleResponse[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const submit = async (event: FormEvent) => {
		event.preventDefault()
		setError(null)
		setLoading(true)
		try {
			const result = await generatePrintPack(quantity, subgridSize, difficulty, includeSolutions)
			setPack(result)
		} catch (err) {
			const status = (err as { status?: number }).status
			if (status === 401 || status === 403) {
				setError('No tienes permiso para generar el pack. Inicia sesión e inténtalo de nuevo.')
			} else if (status === 400) {
				setError('Parámetros incorrectos. Verifica la cantidad, tamaño y dificultad.')
			} else {
				setError('No se pudo generar el pack de sudokus. Comprueba la conexión e inténtalo de nuevo.')
			}
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className='print-page'>
			<div className='page-heading no-print'>
				<div>
					<p className='eyebrow'>Herramientas</p>
					<h1 className='page-title'>Imprimir sudokus</h1>
				</div>
				{pack.length > 0 && (
					<span className='status-pill'>{pack.length} sudokus generados</span>
				)}
			</div>

			<form className='panel form-stack print-controls no-print' onSubmit={submit}>
				<label>
					Cantidad
					<input
						type='number'
						min={1}
						max={50}
						value={quantity}
						onChange={(event) => setQuantity(Math.min(50, Math.max(1, Number(event.target.value))))}
					/>
				</label>
				<label>
					Tamaño
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
					<button className='btn primary' disabled={loading}>
						{loading ? 'Generando...' : 'Generar'}
					</button>
					<button
						className='btn'
						type='button'
						onClick={() => window.print()}
						disabled={pack.length === 0 || loading}>
						🖨️ Imprimir PDF
					</button>
				</div>
				{error && <p className='error-text'>{error}</p>}
			</form>

			{pack.length === 0 && !loading && !error && (
				<div className='panel state-panel no-print' style={{ marginTop: '1rem' }}>
					<p className='muted'>Configura los parámetros y pulsa "Generar" para ver los sudokus antes de imprimir.</p>
				</div>
			)}

			<div className='print-pack'>
				{pack.map((puzzle, index) => (
					<div className='print-sheet' key={puzzle.id}>
						<PrintableBoard board={puzzle.puzzle} title={`Sudoku ${index + 1}`} />
						{puzzle.solution && (
							<PrintableBoard board={puzzle.solution} title={`Solución ${index + 1}`} />
						)}
					</div>
				))}
			</div>
		</div>
	)
}
