import './DemoComponent.scss'

import { Card as DemoCard } from '@/components/elements'
import type { Demo } from '@/models/components/Demo'

interface Props {
	loading: boolean
	demos: Demo[]
	onReload: () => void
	error?: string
}

const DemoComponent: React.FC<Props> = (props) => {
	const { loading, error, demos, onReload } = props
	const hasData = demos.length > 0

	if (loading && !hasData) {
		return (
			<div className='demo-grid'>
				{Array.from({ length: 6 }).map((_, i) => (
					<div key={i} className='demo-card skeleton'>
						<div className='skeleton-img' />
						<div className='skeleton-line title' />
						<div className='skeleton-line' />
						<div className='skeleton-line short' />
						<div className='skeleton-pill' />
					</div>
				))}
			</div>
		)
	}

	if (error && !hasData) {
		return (
			<div className='demo-error'>
				<p>Error: {error}</p>
				<button onClick={onReload}>Reintentar</button>
			</div>
		)
	}

	return (
		<div>
			<div className='demo-toolbar'>
				<button onClick={onReload} disabled={loading}>
					{loading ? 'Actualizando…' : 'Recargar'}
				</button>
				{loading && <span className='spinner' aria-hidden='true' />}
			</div>

			<div
				className={`demo-grid ${loading ? 'is-refreshing' : ''}`}
				aria-busy={loading ? 'true' : 'false'}>
				{demos.map((d) => (
					<DemoCard key={d.id} demo={d} />
				))}
			</div>
		</div>
	)
}

export default DemoComponent
