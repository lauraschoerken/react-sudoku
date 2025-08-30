import { fetchDemoMock } from '@/mocks/demo'
import type { ApiResult, Demo } from '@/models/components/Demo'

/**
 * Cambia esto a 'real' para usar la API real, o controla con .env:
 * VITE_API_MODE=mock | real
 */
const API_MODE = import.meta.env.VITE_API_MODE as 'mock' | 'real'

/**
 * Base URL (si usas back real). Configurable en .env:
 * VITE_API_BASE=https://jsonplaceholder.typicode.com
 */
const API_BASE = import.meta.env.VITE_API_BASE

export async function fetchDemos(signal?: AbortSignal): Promise<ApiResult<Demo[]>> {
	if (API_MODE === 'mock') {
		return fetchDemoMock()
	}

	try {
		const res = await fetch(`${API_BASE}/todos?_limit=5`, { signal })
		if (!res.ok) throw new Error(`HTTP ${res.status}`)
		const json = (await res.json()) as Demo[]
		return { data: json }
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Network error desconocido'
		return { data: [], error: message }
	}
}
