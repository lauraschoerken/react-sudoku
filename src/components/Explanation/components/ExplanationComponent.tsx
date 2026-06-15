import './ExplanationComponent.scss'

interface Props {
	loading: boolean
}

const sampleBoard = [
	[5, 3, 0, 0],
	[0, 0, 3, 4],
	[3, 4, 0, 0],
	[0, 0, 4, 2],
]

const ExplanationComponent: React.FC<Props> = ({ loading }) => {
	if (loading) {
		return <p>Cargando explicación...</p>
	}

	return (
		<div className='explanation'>
			<section className='explanation-hero'>
				<div>
					<p className='eyebrow'>Guía rápida</p>
					<h1>Cómo jugar al Sudoku</h1>
					<p>
						El objetivo es completar el tablero usando cada número una sola vez por fila, columna y
						subcuadrícula.
					</p>
				</div>
				<div className='example-board' aria-label='Ejemplo visual de Sudoku'>
					{sampleBoard.flat().map((value, index) => (
						<span key={index}>{value || ''}</span>
					))}
				</div>
			</section>

			<div className='explanation-grid'>
				<InfoBlock
					title='Objetivo'
					text='Rellena todas las casillas vacías sin contradecir las pistas iniciales.'
				/>
				<InfoBlock
					title='Reglas básicas'
					text='Cada fila, columna y caja debe contener todos los números válidos del tablero.'
				/>
				<InfoBlock
					title='Notas'
					text='Activa el modo notas para guardar candidatos en una celda mientras razonas.'
				/>
				<InfoBlock
					title='Consejos'
					text='Empieza por filas o cajas con pocas casillas vacías y descarta candidatos visibles.'
				/>
			</div>
		</div>
	)
}

const InfoBlock = ({ title, text }: { title: string; text: string }) => (
	<section className='explanation-card'>
		<h2>{title}</h2>
		<p>{text}</p>
	</section>
)

export default ExplanationComponent
