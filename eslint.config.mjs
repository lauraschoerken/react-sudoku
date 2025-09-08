import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import importPlugin from 'eslint-plugin-import'
import simpleImportSort from 'eslint-plugin-simple-import-sort'

export default [
	{ ignores: ['dist/**', 'node_modules/**', 'public/**'] },

	js.configs.recommended,
	...tseslint.configs.recommended,

	{
		plugins: {
			'import': importPlugin,
			'simple-import-sort': simpleImportSort,
		},
		settings: {
			'import/parsers': {
				'@typescript-eslint/parser': ['.ts', '.tsx', '.d.ts'],
			},
			'import/resolver': {
				typescript: {
					project: ['./tsconfig.app.json'],
					alwaysTryTypes: true,
				},
				node: {
					extensions: ['.js', '.jsx', '.ts', '.tsx'],
				},
			},
		},
	},

	{
		files: ['**/*.{ts,tsx,js,jsx}'],
		rules: {
			'simple-import-sort/imports': 'error',
			'simple-import-sort/exports': 'error',
			'import/order': 'off',
			'import/no-duplicates': 'error',
			'import/no-unresolved': 'error',
			'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
		},
	},
]
