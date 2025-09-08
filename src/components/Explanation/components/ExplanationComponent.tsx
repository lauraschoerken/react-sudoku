import './ExplanationComponent.scss'

import { useTranslation } from 'react-i18next'

interface Props {
	loading: boolean
}


const ExplanationComponent: React.FC<Props> = ({ loading }) => {
	const { t } = useTranslation('explication')

	if (loading) {
		return <p>{t('loading')}</p>
	}

	return (
		<div className='explanation'>
			<h1>{t('title')}</h1>
			<p>{t('intro')}</p>
			<h2>{t('objectiveTitle')}</h2>
			<p>{t('objectiveText')}</p>
			<img
				src='https://png.pngtree.com/png-vector/20220621/ourmid/pngtree-sudokuinspired-vector-template-of-a-3x3-puzzle-grid-with-square-cells-vector-png-image_31894736.png'
				alt={t('boardImageAlt')}
				className='sudoku-img'
			/>
			<h2>{t('boardTitle')}</h2>
			<ul>
				<li>{t('boardList.item1')}</li>
				<li>{t('boardList.item2')}</li>
				<li>{t('boardList.item3')}</li>
			</ul>
			<h2>{t('rulesTitle')}</h2>
			<ol>
				<li>{t('rulesList.item1')}</li>
				<li>{t('rulesList.item2')}</li>
				<li>{t('rulesList.item3')}</li>
			</ol>
			<h2>{t('strategiesTitle')}</h2>
			<ul>
				<li>{t('strategiesList.item1')}</li>
				<li>{t('strategiesList.item2')}</li>
				<li>{t('strategiesList.item3')}</li>
			</ul>
			<h2>{t('exampleTitle')}</h2>
			<p>{t('exampleRowLabel')}</p>
			<pre className='example-row'>{t('exampleRowValue')}</pre>
			<p>{t('exampleAnswer')}</p>

			<h2>{t('funTitle')}</h2>
			<p>{t('funText')}</p>
			<img
				src='https://media.tenor.com/6p7N_0EDsEcAAAAi/sudoku-puzzle.gif'
				alt={t('funImageAlt')}
				className='fun-img'
			/>
		</div>
	)
}

export default ExplanationComponent
