export interface Demo {
	id: number
	title: string
	image: string
	description: string
	completed: boolean
}

export interface ApiResult<T> {
	data: T
	error?: string
}
