const modules = import.meta.glob<Record<string, unknown>>('./*.json', {
	eager: true,
	import: 'default',
})

type Namespace = string
type LocaleResources = Record<Namespace, Record<string, unknown>>

const en: LocaleResources = {}

for (const path in modules) {
	const ns = path.replace('./', '').replace('.json', '')
	en[ns] = modules[path]
}

export default en
