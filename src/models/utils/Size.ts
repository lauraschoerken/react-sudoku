import { SUBGRID_SIZE_ENTRIES } from '@/utils/constants'

export type SubgridSizeName = (typeof SUBGRID_SIZE_ENTRIES)[number][0]
export type SubgridSize = (typeof SUBGRID_SIZE_ENTRIES)[number][1]

export const SubgridSizes = Object.fromEntries(SUBGRID_SIZE_ENTRIES) as Record<
	SubgridSizeName,
	SubgridSize
>

export const SubgridSizeOptions = SUBGRID_SIZE_ENTRIES
