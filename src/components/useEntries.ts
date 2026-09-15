import { useCallback, useEffect, useState } from 'react'
import { getEntries, getEntriesByDate } from '../storage/entries'
import type { GroundedEntry } from '../storage/types'

type Mode = 'all' | 'today'

export function useEntries(mode: Mode = 'all') {
  const [entries, setEntries] = useState<GroundedEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      setEntries(mode === 'today' ? await getEntriesByDate(new Date()) : await getEntries())
    } finally {
      setIsLoading(false)
    }
  }, [mode])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) return
    const listener = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
      if (areaName === 'local' && changes.grounded_entries) void refresh()
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [refresh])

  return { entries, isLoading, refresh }
}
