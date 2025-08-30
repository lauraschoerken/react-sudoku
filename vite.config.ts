import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
	const envRoot = path.resolve(__dirname, 'enviroments')
	const common = loadEnv(mode, envRoot, 'VITE_')
	const byModeDir =
		mode === 'dev'
			? path.resolve(envRoot, 'dev')
			: mode === 'prod'
				? path.resolve(envRoot, 'prod')
				: envRoot

	const byMode = loadEnv(mode, byModeDir, 'VITE_')
	const env = { ...common, ...byMode }

	return {
		plugins: [react()],
		envDir: envRoot,
		resolve: { alias: { '@': path.resolve(__dirname, 'src') } },

		define: {
			__APP_NAME__: JSON.stringify(env.VITE_APP_NAME ?? 'App'),
		},
	}
})
