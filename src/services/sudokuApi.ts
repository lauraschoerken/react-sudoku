import type { Board } from '@/models/components/Sudoku'
import type { Difficulty } from '@/models/utils/Difficulty'

type TimerMode = 'NORMAL' | 'COUNTDOWN'
export type GameStatus = 'IN_PROGRESS' | 'PAUSED' | 'WON' | 'LOST' | 'ABANDONED'

export interface GameSessionResponse {
	id: number
	puzzleId: number
	subgridSize: number
	gridSize: number
	difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'
	initialBoard: Board
	currentBoard: Board
	status: GameStatus
	notes: Record<string, number[]>
	mistakes: number
	hintsUsed: number
	elapsedSeconds: number
	startedAt: string
	finishedAt: string | null
	dailyGame: boolean
}

export interface UserResponse {
	id: number
	username: string
	email: string
}

export interface AuthResponse {
	token: string
	user: UserResponse
}

export interface UserStatsResponse {
	playedGames: number
	wonGames: number
	lostGames: number
	bestTimeSeconds: number
	worstTimeSeconds: number
	averageTimeSeconds: number
	totalMistakes: number
	totalHints: number
}

export interface CalendarDayResponse {
	date: string
	completedGames: number
	pendingGames: number
	dailySudokuCompleted: boolean
}

export interface SudokuPuzzleResponse {
	id: number
	subgridSize: number
	gridSize: number
	difficulty: GameSessionResponse['difficulty']
	puzzle: Board
	solution: Board | null
}

export interface CellUpdateResponse {
	game: GameSessionResponse
	correct: boolean
	completed: boolean
}

export interface HintResponse {
	game: GameSessionResponse
	rowIndex: number
	colIndex: number
	value: number
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api'

const difficultyToApi = (difficulty: Difficulty): GameSessionResponse['difficulty'] => {
	if (difficulty <= 8) return 'EASY'
	if (difficulty <= 57) return 'MEDIUM'
	if (difficulty <= 65) return 'HARD'
	return 'EXPERT'
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
	const response = await fetch(`${API_BASE_URL}${path}`, {
		headers: { 'Content-Type': 'application/json', ...init?.headers },
		...init,
	})

	if (!response.ok) {
		throw new Error(`Sudoku API error ${response.status}`)
	}

	return response.json() as Promise<T>
}

export const createGame = (
	subgridSize: number,
	difficulty: Difficulty,
	options?: {
		userId?: number
		timerMode?: TimerMode
		countdownSeconds?: number
		maxErrors?: number
		errorWarningsEnabled?: boolean
	}
) =>
	request<GameSessionResponse>('/games', {
		method: 'POST',
		body: JSON.stringify({
			userId: options?.userId,
			subgridSize,
			difficulty: difficultyToApi(difficulty),
			timerMode: options?.timerMode ?? 'NORMAL',
			countdownSeconds: options?.countdownSeconds,
			maxErrors: options?.maxErrors,
			errorWarningsEnabled: options?.errorWarningsEnabled ?? false,
		}),
	})

export const updateCell = (
	gameId: number,
	rowIndex: number,
	colIndex: number,
	value: number,
	elapsedSeconds?: number
) =>
	request<CellUpdateResponse>(`/games/${gameId}/cell`, {
		method: 'PATCH',
		body: JSON.stringify({ rowIndex, colIndex, value, elapsedSeconds }),
	})

export const requestHint = (gameId: number) =>
	request<HintResponse>(`/games/${gameId}/hint`, {
		method: 'POST',
	})

export const updateNotes = (
	gameId: number,
	rowIndex: number,
	colIndex: number,
	notes: number[]
) =>
	request<GameSessionResponse>(`/games/${gameId}/notes`, {
		method: 'PATCH',
		body: JSON.stringify({ rowIndex, colIndex, notes }),
	})

export const finishGame = (gameId: number, status: GameStatus, elapsedSeconds?: number) =>
	request<GameSessionResponse>(`/games/${gameId}/finish`, {
		method: 'POST',
		body: JSON.stringify({ status, elapsedSeconds }),
	})

export const pauseGame = (gameId: number) =>
	request<GameSessionResponse>(`/games/${gameId}/pause`, {
		method: 'POST',
	})

export const resumeGame = (gameId: number) =>
	request<GameSessionResponse>(`/games/${gameId}/resume`, {
		method: 'POST',
	})

export const register = (username: string, email: string, password: string) =>
	request<AuthResponse>('/auth/register', {
		method: 'POST',
		body: JSON.stringify({ username, email, password }),
	})

export const login = (email: string, password: string) =>
	request<AuthResponse>('/auth/login', {
		method: 'POST',
		body: JSON.stringify({ email, password }),
	})

export const getTodayDailySudoku = () => request<SudokuPuzzleResponse>('/daily-sudoku/today')

export const startDailySudoku = (date: string, userId?: number) => {
	const query = userId ? `?userId=${userId}` : ''
	return request<GameSessionResponse>(`/daily-sudoku/${date}/start${query}`, { method: 'POST' })
}

export const getUserStats = (userId: number) =>
	request<UserStatsResponse>(`/users/${userId}/stats`)

export const getUserCalendar = (userId: number, year: number, month: number) =>
	request<CalendarDayResponse[]>(`/users/${userId}/calendar?year=${year}&month=${month}`)

export const getUserGames = (userId: number) =>
	request<GameSessionResponse[]>(`/users/${userId}/games`)
