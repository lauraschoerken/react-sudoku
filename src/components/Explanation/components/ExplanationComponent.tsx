import './ExplanationComponent.scss'


interface Props {
	loading: boolean
}

const ExplanationComponent: React.FC<Props> = (props) => {
	return (
		<div>
			<h1>Explicaion de como hacer un sodoku</h1>
		</div>
	)
}

export default ExplanationComponent
