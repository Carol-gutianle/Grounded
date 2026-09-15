import { CATEGORY_LABELS, type GroundedEntry } from '../storage/types'
import { formatDate, formatTime } from '../utils/dates'

type EntryListProps = {
  entries: GroundedEntry[]
  emptyText?: string
  showDate?: boolean
  limit?: number
}

export function EntryList({ entries, emptyText = '今天还没有记录。\n不着急，发生了再写。', showDate = false, limit }: EntryListProps) {
  const visible = typeof limit === 'number' ? entries.slice(0, limit) : entries

  if (visible.length === 0) {
    return <p className="empty-state">{emptyText}</p>
  }

  return (
    <ul className="entry-list">
      {visible.map((entry) => (
        <li className="entry-item" key={entry.id}>
          <time className="entry-time" dateTime={new Date(entry.createdAt).toISOString()}>
            {showDate ? formatDate(entry.createdAt) : formatTime(entry.createdAt)}
          </time>
          <div>
            <p className="entry-content">{entry.content}</p>
            {(entry.category || entry.source?.type === 'webpage') && (
              <div className="entry-meta">
                {entry.category && <span>{CATEGORY_LABELS[entry.category]}</span>}
                {entry.source?.type === 'webpage' && <span>网页证据</span>}
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
