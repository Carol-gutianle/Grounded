import type { CreateEntryInput, GroundedEntry, UpdateEntryPatch } from './types'

export const STORAGE_KEY = 'grounded_entries'

type StorageShape = {
  [STORAGE_KEY]?: GroundedEntry[]
}

const hasChromeStorage = () =>
  typeof chrome !== 'undefined' && Boolean(chrome.storage?.local)

const memoryStore: StorageShape = {}

const sortEntries = (entries: GroundedEntry[]) =>
  [...entries].sort((a, b) => b.createdAt - a.createdAt)

const generateId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const getLocal = async (): Promise<StorageShape> => {
  if (!hasChromeStorage()) return memoryStore
  return chrome.storage.local.get(STORAGE_KEY) as Promise<StorageShape>
}

const setLocal = async (entries: GroundedEntry[]) => {
  const next = sortEntries(entries)
  if (!hasChromeStorage()) {
    memoryStore[STORAGE_KEY] = next
    return
  }
  await chrome.storage.local.set({ [STORAGE_KEY]: next })
}

export async function getEntries(): Promise<GroundedEntry[]> {
  const result = await getLocal()
  return sortEntries(result[STORAGE_KEY] ?? [])
}

export async function createEntry(input: CreateEntryInput): Promise<GroundedEntry> {
  const content = input.content.trim()
  if (!content) throw new Error('Entry content is required')

  const entries = await getEntries()
  const entry: GroundedEntry = {
    id: generateId(),
    content,
    category: input.category,
    createdAt: input.createdAt ?? Date.now(),
    source: input.source ?? { type: 'manual' }
  }
  await setLocal([entry, ...entries])
  return entry
}

export async function updateEntry(id: string, patch: UpdateEntryPatch): Promise<GroundedEntry | undefined> {
  const entries = await getEntries()
  let updated: GroundedEntry | undefined
  const next = entries.map((entry) => {
    if (entry.id !== id) return entry
    updated = {
      ...entry,
      ...patch,
      content: patch.content !== undefined ? patch.content.trim() : entry.content
    }
    return updated
  })

  if (updated?.content === '') {
    throw new Error('Entry content is required')
  }

  await setLocal(next)
  return updated
}

export async function deleteEntry(id: string): Promise<void> {
  const entries = await getEntries()
  await setLocal(entries.filter((entry) => entry.id !== id))
}


export async function replaceEntries(entries: GroundedEntry[]): Promise<void> {
  await setLocal(entries)
}

export async function importEntries(entries: GroundedEntry[], mode: 'merge' | 'replace' = 'merge'): Promise<GroundedEntry[]> {
  const normalized = entries
    .filter((entry) => entry && typeof entry.content === 'string' && typeof entry.createdAt === 'number')
    .map((entry) => ({
      ...entry,
      id: entry.id || generateId(),
      content: entry.content.trim(),
      source: entry.source ?? { type: 'manual' as const }
    }))
    .filter((entry) => entry.content)

  if (mode === 'replace') {
    await setLocal(normalized)
    return getEntries()
  }

  const existing = await getEntries()
  const byId = new Map<string, GroundedEntry>()
  for (const entry of existing) byId.set(entry.id, entry)
  for (const entry of normalized) byId.set(entry.id, entry)
  await setLocal([...byId.values()])
  return getEntries()
}

export async function getEntry(id: string): Promise<GroundedEntry | undefined> {
  const entries = await getEntries()
  return entries.find((entry) => entry.id === id)
}

export async function getEntriesByRange(start: number, end: number): Promise<GroundedEntry[]> {
  const entries = await getEntries()
  return entries.filter((entry) => entry.createdAt >= start && entry.createdAt < end)
}

export async function getEntriesByDate(date: Date): Promise<GroundedEntry[]> {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 1)
  return getEntriesByRange(start.getTime(), end.getTime())
}

export async function searchEntries(keyword: string): Promise<GroundedEntry[]> {
  const q = keyword.trim().toLowerCase()
  const entries = await getEntries()
  if (!q) return entries
  return entries.filter((entry) => {
    const source = `${entry.source?.title ?? ''} ${entry.source?.url ?? ''}`.toLowerCase()
    return entry.content.toLowerCase().includes(q) || source.includes(q)
  })
}
