import type { Board } from '@/models/components/Sudoku'

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

const shuffle = <T>(arr: T[]): T[] => {
	const copy = [...arr]
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[copy[i], copy[j]] = [copy[j], copy[i]]
	}
	return copy
}

const chunk = <T>(arr: T[], size: number): T[][] => {
	const out: T[][] = []
	for (let i = 0; i < arr.length; i += size) {
		out.push(arr.slice(i, i + size))
	}
	return out
}

export const hideCells = (board: Board, subgridSize: number, percentHidden: number): Board => {
	const size = subgridSize * subgridSize
	const totalCells = size * size
	const hiddenPercent = clamp(percentHidden, 0, 95)
	const cellsToHide = Math.floor(totalCells * (hiddenPercent / 100))
	const shuffledIndices = shuffle(Array.from({ length: totalCells }, (_, i) => i))
	const hiddenPositions = new Set(shuffledIndices.slice(0, cellsToHide))

	const flattened = board.flat()
	const masked = flattened.map((value, index) => (hiddenPositions.has(index) ? 0 : value))

	return chunk(masked, size) as Board
}
