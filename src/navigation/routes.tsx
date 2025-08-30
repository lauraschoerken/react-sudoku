import { createBrowserRouter } from 'react-router-dom'

import { Home } from '@/components/Home/containers/Home'
import { IndexLayout } from '@/layouts'

import Demo from '../components/Demo/containers/Demo'

export const router = createBrowserRouter([
	{
		path: '/',
		element: <IndexLayout />,
		children: [
			{ index: true, element: <Home /> },
			// { path: '*', element: <NotFound /> },
		],
	},
	{
		path: '/demo',
		element: <IndexLayout layout='minimal' />,
		children: [{ index: true, element: <Demo /> }],
	},
])
