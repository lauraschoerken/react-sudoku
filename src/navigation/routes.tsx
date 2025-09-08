import { createBrowserRouter } from 'react-router-dom'

import Explanation from '@/components/Explanation/containers/Explanation'
import { Settings } from '@/components/Settings/containers/Settings'
import { Sudoku } from '@/components/Sudoku/containers/Sudoku'
import { IndexLayout } from '@/layouts'

export const router = createBrowserRouter([
	{
		path: '/',
		element: <IndexLayout />,
		children: [
			{ index: true, element: <Sudoku /> },
			{ path: 'explication', element: <Explanation /> },
			// { path: '*', element: <NotFound /> },
		],
	},
	{
		path: '/settings',
		element: <IndexLayout layout='minimal' />,
		children: [{ index: true, element: <Settings /> }],
	},
])
