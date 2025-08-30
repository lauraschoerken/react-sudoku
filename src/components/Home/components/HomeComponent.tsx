import './HomeComponent.scss'

import homeImage from '@/assets/home.svg'

interface Props {
	name: string
	onChangeCounter: (delta: number) => void
}

const HomeComponent: React.FC<Props> = (props) => {
	const { name, onChangeCounter } = props
	return (
		<div className='home'>
			<div className='home__content'>
				<h1 className='home__title'>{name}</h1>
				<div className='home__buttons'>
					<button className='btn btn--secondary' onClick={() => onChangeCounter(-1)}>
						←
					</button>
					<button className='btn btn--primary' onClick={() => onChangeCounter(1)}>
						→
					</button>
				</div>
			</div>

			<div className='home__image'>
				<img src={homeImage} alt='Home illustration' />
			</div>
		</div>
	)
}

export default HomeComponent
