import { useState } from 'react'
import { CaptureForm } from '../components/CaptureForm'
import { EntryList } from '../components/EntryList'
import { useEntries } from '../components/useEntries'
import { createEntry } from '../storage/entries'
import type { GroundedCategory } from '../storage/types'

function openArchive() {
  if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
    chrome.tabs.create({ url: chrome.runtime.getURL('archive.html') })
  } else {
    window.open('/archive.html', '_blank')
  }
}

export default function App() {
  const { entries, isLoading, refresh } = useEntries('today')
  const [feedback, setFeedback] = useState('')

  const handleCreate = async (content: string, category?: GroundedCategory) => {
    await createEntry({ content, category, source: { type: 'manual' } })
    await refresh()
    setFeedback('已记录。')
    window.setTimeout(() => setFeedback(''), 1600)
  }

  return (
    <main className="app-shell popup-shell">
      <p className="kicker">Grounded</p>
      <h1>已发生</h1>
      <p className="subtitle">少一点想象，多一点已发生。</p>

      <CaptureForm onSubmit={handleCreate} autoFocus />
      <div className="feedback" role="status" aria-live="polite">
        {feedback}
      </div>

      <section>
        <div className="section-header">
          <h2>今天</h2>
          <button className="text-button" type="button" onClick={openArchive}>
            查看全部
          </button>
        </div>
        {isLoading ? <p className="empty-state">读取中。</p> : <EntryList entries={entries} limit={5} />}
      </section>
    </main>
  )
}
