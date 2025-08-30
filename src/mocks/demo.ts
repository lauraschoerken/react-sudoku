import type { ApiResult, Demo } from '@/models/components/Demo'

const MOCK_DATA: Demo[] = [
	{
		id: 1,
		title: 'Aprender React',
		image: 'https://picsum.photos/400/250?random=1',
		description: 'Crear interfaces de usuario con componentes reutilizables.',
		completed: false,
	},
	{
		id: 2,
		title: 'Configurar Vite',
		image: 'https://picsum.photos/400/250?random=2',
		description: 'Usar Vite para un entorno de desarrollo rápido.',
		completed: true,
	},
	{
		id: 3,
		title: 'Integrar i18n',
		image: 'https://picsum.photos/400/250?random=3',
		description: 'Añadir soporte multilenguaje a la app.',
		completed: false,
	},
	{
		id: 4,
		title: 'Dark Mode',
		image: 'https://picsum.photos/400/250?random=4',
		description: 'Implementar el cambio entre tema claro y oscuro.',
		completed: true,
	},
	{
		id: 5,
		title: 'Diseño con SCSS',
		image: 'https://picsum.photos/400/250?random=5',
		description: 'Usar variables y mixins para mantener consistencia.',
		completed: true,
	},
	{
		id: 6,
		title: 'Pruebas Unitarias',
		image: 'https://picsum.photos/400/250?random=6',
		description: 'Asegurar que los componentes funcionan correctamente.',
		completed: false,
	},
	{
		id: 7,
		title: 'Configurar ESLint',
		image: 'https://picsum.photos/400/250?random=7',
		description: 'Mantener el código limpio y consistente.',
		completed: true,
	},
	{
		id: 8,
		title: 'Mock de API',
		image: 'https://picsum.photos/400/250?random=8',
		description: 'Simular llamadas al backend con mocks locales.',
		completed: false,
	},
	{
		id: 9,
		title: 'Deploy en Vercel',
		image: 'https://picsum.photos/400/250?random=9',
		description: 'Publicar la aplicación de forma sencilla en Vercel.',
		completed: false,
	},
	{
		id: 10,
		title: 'Documentación',
		image: 'https://picsum.photos/400/250?random=10',
		description: 'Escribir guías y ejemplos para nuevos desarrolladores.',
		completed: true,
	},
]

export async function fetchDemoMock(): Promise<ApiResult<Demo[]>> {
	//simula latencia
	await new Promise((r) => setTimeout(r, 600))
	return { data: MOCK_DATA }
}
