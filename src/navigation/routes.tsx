import { createBrowserRouter } from 'react-router-dom'

import Explanation from '@/components/Explanation/containers/Explanation'
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
	/*{
		path: '/explication',
		element: <IndexLayout layout='minimal' />,
		children: [{ index: true, element: <Explanation /> }],
	},*/
])
