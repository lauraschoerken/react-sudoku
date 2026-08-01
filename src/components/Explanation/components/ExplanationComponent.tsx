import './ExplanationComponent.scss'
import { useTranslation } from 'react-i18next'

interface Props {
	loading: boolean
}

const sampleBoard = [
	[5, 3, 0, 0, 7, 0, 0, 0, 0],
	[6, 0, 0, 1, 9, 5, 0, 0, 0],
	[0, 9, 8, 0, 0, 0, 0, 6, 0],
	[8, 0, 0, 0, 6, 0, 0, 0, 3],
	[4, 0, 0, 8, 0, 3, 0, 0, 1],
	[7, 0, 0, 0, 2, 0, 0, 0, 6],
	[0, 6, 0, 0, 0, 0, 2, 8, 0],
	[0, 0, 0, 4, 1, 9, 0, 0, 5],
	[0, 0, 0, 0, 8, 0, 0, 7, 9],
]

const ExplanationComponent: React.FC<Props> = ({ loading }) => {
	const { t } = useTranslation('explication')
	if (loading) {
		return <p>Cargando explicación...</p>
	}

	return (
		<div className='explanation'>
			<section className='explanation-hero'>
				<div>
					<p className='eyebrow'>Guía completa</p>
					<h1>Cómo jugar al Sudoku</h1>
					<p>
						El objetivo es completar el tablero usando cada número <strong>una sola vez</strong> por
						fila, columna y subcuadrícula. No necesitas matemáticas, solo lógica.
					</p>
				</div>
				<div className='example-board example-board--9' aria-label='Ejemplo visual de Sudoku 9×9'>
					{sampleBoard.flat().map((value, index) => (
						<span key={index} className={value !== 0 ? 'given' : 'empty'}>
							{value !== 0 ? value : ''}
						</span>
					))}
				</div>
			</section>

			<div className='explanation-grid'>
				<InfoBlock
					icon='🎯'
					 title={t('objectiveTitle')}
					text='Rellena todas las casillas vacías sin repetir números en ninguna fila, columna ni caja. Cada número del 1 al N debe aparecer exactamente una vez en cada zona.'
				/>
				<InfoBlock
					icon='📐'
					title='Tamaños disponibles'
					text='Mini (4×4): ideal para principiantes. Clásico (9×9): el más popular. Grande (16×16): para expertos. El tamaño determina qué números se usan (1-4, 1-9, 1-16).'
				/>
				<InfoBlock
					icon='⚡'
					title={t('rulesTitle')}
					text='Fácil (8% vacío), Medio (57%), Difícil (65%), Experto (70%). Más celdas vacías significa más combinaciones a evaluar y mayor complejidad lógica.'
				/>
				<InfoBlock
					icon='💡'
					title={t('strategiesTitle')}
					text='Pulsa el botón "Pista" para que el juego rellene automáticamente la siguiente celda vacía con su valor correcto. Cada pista se registra en tus estadísticas.'
				/>
			</div>

			<section className='explanation-section'>
				<h2>Modo notas</h2>
				<p>
					Activa el <strong>modo notas</strong> pulsando el botón "Notas" de la barra de
					herramientas. En este modo, los números que introduces se guardan como <em>candidatos</em>{' '}
					en la celda, no como valor definitivo. Esto te permite razonar qué valores son posibles
					antes de decidirte.
				</p>
				<ul className='explanation-list'>
					<li>Los candidatos aparecen como números pequeños en la celda.</li>
					<li>
						Al introducir un valor definitivo en una celda, sus candidatos desaparecen
						automáticamente.
					</li>
					<li>Las notas se guardan en el servidor y se recuperan al reanudar la partida.</li>
					<li>Pulsa el mismo número dos veces en modo notas para eliminarlo.</li>
				</ul>
			</section>

			<section className='explanation-section'>
				<h2>Errores y límite</h2>
				<p>
					En <strong>Ajustes → Errores</strong> puedes configurar cómo el juego gestiona los fallos:
				</p>
				<ul className='explanation-list'>
					<li>
						<strong>Mostrar errores:</strong> las celdas incorrectas se muestran resaltadas en rojo.
					</li>
					<li>
						<strong>Límite de errores:</strong> si activas esta opción, al superar el número máximo
						configurado (ej. 3) la partida termina con derrota.
					</li>
					<li>
						Si no activas el límite, puedes cometer todos los errores que quieras sin penalización
						final.
					</li>
				</ul>
			</section>

			<section className='explanation-section'>
				<h2>Cronómetro</h2>
				<p>El cronómetro mide cuánto tardas en completar cada sudoku. Tienes dos modos:</p>
				<ul className='explanation-list'>
					<li>
						<strong>Normal:</strong> cuenta hacia arriba desde 0. Tu tiempo queda registrado en
						estadísticas.
					</li>
					<li>
						<strong>Cuenta atrás:</strong> empieza desde el tiempo configurado (ej. 10 minutos). Si
						llegas a 0 antes de terminar, pierdes la partida.
					</li>
					<li>
						Puedes <strong>pausar</strong> el juego en cualquier momento. El tiempo se detiene y el
						tablero se oculta.
					</li>
				</ul>
			</section>

			<section className='explanation-section'>
				<h2>Sudoku diario</h2>
				<p>
					Cada día se genera un nuevo sudoku especial,{' '}
					<strong>igual para todos los usuarios</strong>. Puedes acceder al diario desde la sección
					"Diario" del menú.
				</p>
				<ul className='explanation-list'>
					<li>Todos juegan el mismo tablero ese día.</li>
					<li>Cada uno tiene sus propias notas y su propio progreso.</li>
					<li>El progreso se guarda automáticamente al volver otro día.</li>
					<li>
						Usa el <strong>calendario</strong> para acceder a sudokus de días anteriores.
					</li>
					<li>Los días completados aparecen marcados en el calendario.</li>
				</ul>
			</section>

			<section className='explanation-section'>
				<h2>Estadísticas</h2>
				<p>
					En la sección <strong>Stats</strong> puedes ver tu historial completo:
				</p>
				<ul className='explanation-list'>
					<li>Número de partidas jugadas, ganadas y perdidas.</li>
					<li>Mejor tiempo, tiempo medio y total de errores y pistas usadas.</li>
					<li>Desglose por dificultad y tamaño de tablero.</li>
					<li>Calendario de actividad mensual para ver en qué días has jugado.</li>
					<li>Lista de partidas recientes con opción de continuar o borrar.</li>
				</ul>
			</section>

			<section className='explanation-section'>
				<h2>Imprimir sudokus</h2>
				<p>
					Desde la sección <strong>Herramientas → Imprimir</strong> puedes generar un pack de
					sudokus para imprimir en papel:
				</p>
				<ul className='explanation-list'>
					<li>Elige la cantidad (1-50), el tamaño y la dificultad.</li>
					<li>Opcional: incluir las soluciones al final.</li>
					<li>Pulsa "Imprimir PDF" para abrir el diálogo de impresión del navegador.</li>
				</ul>
			</section>

			<section className='explanation-section'>
				<h2>Consejos para resolver un sudoku</h2>
				<ul className='explanation-list'>
					<li>
						Empieza por las filas, columnas o cajas con <strong>menos celdas vacías</strong>.
					</li>
					<li>
						Busca el número que ya aparece más veces en el tablero y localiza dónde más puede ir.
					</li>
					<li>Usa las notas para anotar candidatos y descártalos progresivamente.</li>
					<li>Si una celda solo puede tener un valor (único candidato), ponlo directamente.</li>
					<li>
						Si en una caja solo hay una celda que puede tener cierto número, ese es el valor
						correcto.
					</li>
					<li>No adivines: un sudoku bien construido siempre tiene una única solución lógica.</li>
				</ul>
			</section>
		</div>
	)
}

const InfoBlock = ({ icon, title, text }: { icon: string; title: string; text: string }) => (
	<section className='explanation-card'>
		<div className='explanation-card__icon'>{icon}</div>
		<h2>{title}</h2>
		<p>{text}</p>
	</section>
)

export default ExplanationComponent
