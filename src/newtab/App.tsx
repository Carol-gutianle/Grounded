import { useEffect, useMemo, useState } from 'react'
import { EntryList } from '../components/EntryList'
import { getEntriesByRange } from '../storage/entries'
import type { GroundedEntry } from '../storage/types'
import { formatLongDate, startOfToday, startOfTomorrow, startOfWeek } from '../utils/dates'

function openArchive() {
  if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
    window.location.href = chrome.runtime.getURL('archive.html')
  } else {
    window.location.href = '/archive.html'
  }
}

export default function App() {
  const [todayEntries, setTodayEntries] = useState<GroundedEntry[]>([])
  const [weekEntries, setWeekEntries] = useState<GroundedEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const dateLabel = useMemo(() => formatLongDate(new Date()), [])

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      try {
        const todayStart = startOfToday().getTime()
        const tomorrowStart = startOfTomorrow().getTime()
        const weekStart = startOfWeek().getTime()
        const now = Date.now() + 1
        const [today, week] = await Promise.all([
          getEntriesByRange(todayStart, tomorrowStart),
          getEntriesByRange(weekStart, now)
        ])
        setTodayEntries(today)
        setWeekEntries(week)
      } finally {
        setIsLoading(false)
      }
    }
    void load()
  }, [])

  return (
    <main className="app-shell">
      <div className="page-shell">
        <p className="kicker">Grounded</p>
        <h1>{dateLabel}</h1>
        <p className="subtitle">今天，你已经真实经历了这些。</p>

        <section className="card" style={{ padding: 24 }}>
          <div className="section-header" style={{ marginTop: 0 }}>
            <h2>今天已发生</h2>
            <button className="secondary-button" type="button" onClick={openArchive}>
              查看档案
            </button>
          </div>
          {isLoading ? <p className="empty-state">读取中。</p> : <EntryList entries={todayEntries} />}
        </section>

        <section className="card week-summary">
          本周，你已经留下 {weekEntries.length} 条现实记录。
          <br />
          这些事情已经发生过。
        </section>
      </div>
    </main>
  )
}
