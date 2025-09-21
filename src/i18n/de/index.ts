const modules = import.meta.glob<Record<string, unknown>>('./*.json', {
	eager: true,
	import: 'default',
})

type Namespace = string
type LocaleResources = Record<Namespace, Record<string, unknown>>

const es: LocaleResources = {}

for (const path in modules) {
	const ns = path.replace('./', '').replace('.json', '')
	es[ns] = modules[path]
}

export default es
