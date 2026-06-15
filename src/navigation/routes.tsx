import { createBrowserRouter } from 'react-router-dom'

import { AuthPage } from '@/components/Auth/containers/AuthPage'
import { DailySudokuPage } from '@/components/DailySudoku/containers/DailySudokuPage'
import { DashboardPage } from '@/components/Dashboard/containers/DashboardPage'
import Explanation from '@/components/Explanation/containers/Explanation'
import { PrintPage } from '@/components/Print/containers/PrintPage'
import { Settings } from '@/components/Settings/containers/Settings'
import { Sudoku } from '@/components/Sudoku/containers/Sudoku'
import { IndexLayout } from '@/layouts'

export const router = createBrowserRouter([
	{
		path: '/',
		element: <IndexLayout />,
		children: [
			{ index: true, element: <Sudoku /> },
			{ path: 'daily', element: <DailySudokuPage /> },
			{ path: 'dashboard', element: <DashboardPage /> },
			{ path: 'print', element: <PrintPage /> },
			{ path: 'account', element: <AuthPage /> },
			{ path: 'explication', element: <Explanation /> },
			{ path: 'settings', element: <Settings /> },
			// { path: '*', element: <NotFound /> },
		],
	},
])
