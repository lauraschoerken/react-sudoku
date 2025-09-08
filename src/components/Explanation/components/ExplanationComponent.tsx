import './ExplanationComponent.scss'

interface Props {
	loading: boolean
}

/**
 * Componente de explicación de cómo jugar al Sudoku.
 * Presentado de manera clara, sencilla y visual,
 * para que cualquiera (incluso un niño) pueda entenderlo.
 */
const ExplanationComponent: React.FC<Props> = ({ loading }) => {
	if (loading) {
		return <p>Cargando explicación...</p>
	}

	return (
		<div className='explanation'>
			<h1>📖 ¿Cómo se juega al Sudoku?</h1>

			<p>
				El <strong>Sudoku</strong> es un juego de lógica y números. No necesitas saber matemáticas
				complicadas: ¡solo usar tu cabeza y paciencia!
			</p>

			<h2>🎯 Objetivo del juego</h2>
			<p>
				Completar el tablero rellenando las casillas vacías con números, sin repetirlos en cada{' '}
				<b>fila</b>, <b>columna</b> ni <b>cuadro pequeño</b>.
			</p>

			<img
				src='https://png.pngtree.com/png-vector/20220621/ourmid/pngtree-sudokuinspired-vector-template-of-a-3x3-puzzle-grid-with-square-cells-vector-png-image_31894736.png'
				alt='Tablero de Sudoku'
				className='sudoku-img'
			/>

			<h2>📐 Cómo está formado el tablero</h2>
			<ul>
				<li>
					El tablero clásico es de <b>9×9 casillas</b>.
				</li>
				<li>
					Está dividido en <b>9 cuadros pequeños</b> de 3×3 casillas.
				</li>
				<li>Algunas casillas ya vienen con números (estas no se pueden cambiar).</li>
			</ul>

			<h2>📝 Reglas básicas</h2>
			<ol>
				<li>
					En cada <b>fila</b> deben estar todos los números del 1 al 9,
					<b>sin repetir</b>.
				</li>
				<li>
					En cada <b>columna</b> deben estar todos los números del 1 al 9,
					<b>sin repetir</b>.
				</li>
				<li>
					En cada <b>cuadro pequeño de 3×3</b> también deben estar los números del 1 al 9,
					<b>sin repetir</b>.
				</li>
			</ol>

			<h2>🧩 Estrategias para empezar</h2>
			<ul>
				<li>
					Empieza mirando las <b>filas, columnas y cuadros</b> donde ya hay más números.
				</li>
				<li>
					Usa la lógica: si en una fila ya están los números 1, 2, 3, 5, 6, 7, 8 y 9, ¡la casilla
					que falta solo puede ser el <b>4</b>!
				</li>
				<li>
					No adivines al azar: el Sudoku se resuelve con <b>deducciones</b>, no con suerte.
				</li>
			</ul>

			<h2>🌟 Ejemplo sencillo</h2>
			<p>Imagina esta fila: </p>
			<pre className='example-row'>1 | 2 | | 4 | 5 | 6 | 7 | 8 | 9</pre>
			<p>
				¿Qué número falta? 👉 El <b>3</b>.
			</p>

			<h2>🎉 Y lo más importante...</h2>
			<p>
				¡Diviértete! El Sudoku es como un <b>rompecabezas</b> que entrenará tu mente, te hará pensar
				y cada vez serás más rápido.
			</p>

			<img
				src='https://media.tenor.com/6p7N_0EDsEcAAAAi/sudoku-puzzle.gif'
				alt='Sudoku divertido'
				className='fun-img'
			/>
		</div>
	)
}

export default ExplanationComponent
