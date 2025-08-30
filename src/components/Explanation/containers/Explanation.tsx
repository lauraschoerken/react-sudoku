import { useState } from 'react'

import ExplanationComponent from '../components/ExplanationComponent'

const Explanation = () => {
	const [loading] = useState(false)

	return <ExplanationComponent loading={loading} />
}

export default Explanation
