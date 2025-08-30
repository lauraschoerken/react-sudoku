import './layout.scss'

import { MainLayout } from './Main/MainLayout'
import { MinimalLayout } from './Minimal/MinimalLayaout'

type IndexLayoutProps = {
	layout?: 'main' | 'minimal'
}

export const IndexLayout = ({ layout = 'main' }: IndexLayoutProps) => {
	if (layout === 'minimal') {
		return <MinimalLayout />
	}
	return <MainLayout />
}
