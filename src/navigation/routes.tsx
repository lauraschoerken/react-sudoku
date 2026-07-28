import { createBrowserRouter } from 'react-router-dom'
import type { ReactNode } from 'react'

import { AuthPage } from '@/components/Auth/containers/AuthPage'
import { DailySudokuPage } from '@/components/DailySudoku/containers/DailySudokuPage'
import { DashboardPage } from '@/components/Dashboard/containers/DashboardPage'
import Explanation from '@/components/Explanation/containers/Explanation'
import { LoginPrompt } from '@/components/elements/LoginGate/LoginGate'
import { PrintPage } from '@/components/Print/containers/PrintPage'
import { Settings } from '@/components/Settings/containers/Settings'
import { Sudoku } from '@/components/Sudoku/containers/Sudoku'
import { IndexLayout } from '@/layouts'
import { useAppSelector } from '@/store/hooks'

const RequireSession = ({ children }: { children: ReactNode }) => {
	const session = useAppSelector((state) => state.auth)
	if (!session.token || !session.user) {
		return (
			<LoginPrompt
				description='Inicia sesión para acceder a esta sección y guardar tu progreso.'
				title='Sesión necesaria'
			/>
		)
	}
	return children
}

export const router = createBrowserRouter([
	{
		path: '/',
		element: <IndexLayout />,
		children: [
			{ index: true, element: <Sudoku /> },
			{ path: 'daily', element: <RequireSession><DailySudokuPage /></RequireSession> },
			{ path: 'dashboard', element: <RequireSession><DashboardPage /></RequireSession> },
			{ path: 'print', element: <RequireSession><PrintPage /></RequireSession> },
			{ path: 'account', element: <AuthPage /> },
			{ path: 'explication', element: <Explanation /> },
			{ path: 'settings', element: <RequireSession><Settings /></RequireSession> },
			// { path: '*', element: <NotFound /> },
		],
	},
])
