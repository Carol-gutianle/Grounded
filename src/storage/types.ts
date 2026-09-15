export const CATEGORIES = ['work', 'research', 'life', 'body', 'relationship'] as const

export type GroundedCategory = (typeof CATEGORIES)[number]

export type GroundedEntrySource = {
  type: 'manual' | 'webpage'
  title?: string
  url?: string
}

export type GroundedEntry = {
  id: string
  content: string
  category?: GroundedCategory
  createdAt: number
  source?: GroundedEntrySource
}

export type CreateEntryInput = {
  content: string
  category?: GroundedCategory
  createdAt?: number
  source?: GroundedEntrySource
}

export type UpdateEntryPatch = Partial<Pick<GroundedEntry, 'content' | 'category' | 'createdAt' | 'source'>>

export const CATEGORY_LABELS: Record<GroundedCategory, string> = {
  work: '工作',
  research: '研究',
  life: '生活',
  body: '身体',
  relationship: '关系'
}
