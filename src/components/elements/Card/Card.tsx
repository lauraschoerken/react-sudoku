import './Card.scss'

import { useState } from 'react'

import type { Demo } from '@/models/components/Demo'

interface Props {
	demo: Demo
}

export const Card: React.FC<Props> = (props) => {
	const { demo } = props
	const [loaded, setLoaded] = useState(false)

	return (
		<div className='demo-card'>
			<div className='demo-img-wrap'>
				{!loaded && <div className='demo-img-skeleton' />}
				<img
					src={demo.image}
					alt={demo.title}
					loading='lazy'
					onLoad={() => setLoaded(true)}
					style={{ opacity: loaded ? 1 : 0 }}
				/>
				{demo.completed && <span className='demo-badge'>✔</span>}
			</div>
			<h3>{demo.title}</h3>
			<p>{demo.description}</p>
		</div>
	)
}
