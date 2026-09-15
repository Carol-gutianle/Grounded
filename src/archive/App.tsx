import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { deleteEntry, getEntries, importEntries, updateEntry } from '../storage/entries'
import { CATEGORY_LABELS, CATEGORIES, type GroundedCategory, type GroundedEntry } from '../storage/types'
import { formatDate, formatTime } from '../utils/dates'

type EditingState = {
  id: string
  content: string
  category: GroundedCategory | ''
}

function categoryFromValue(value: string): GroundedCategory | undefined {
  return CATEGORIES.includes(value as GroundedCategory) ? (value as GroundedCategory) : undefined
}

function downloadText(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function escapeMarkdown(text: string) {
  return text.replace(/\r\n/g, '\n').trim()
}

function entriesToMarkdown(entries: GroundedEntry[]) {
  const groups = new Map<string, GroundedEntry[]>()
  for (const entry of entries) {
    const key = formatDate(entry.createdAt)
    groups.set(key, [...(groups.get(key) ?? []), entry])
  }

  const lines = ['# Grounded / 已发生', '']
  for (const [date, items] of groups) {
    lines.push(`## ${date}`, '')
    for (const entry of items) {
      const category = entry.category ? ` [${CATEGORY_LABELS[entry.category]}]` : ''
      const source = entry.source?.url ? ` (${entry.source.url})` : ''
      const content = escapeMarkdown(entry.content).replace(/\n/g, '\n  ')
      lines.push(`- ${formatTime(entry.createdAt)}${category} ${content}${source}`)
    }
    lines.push('')
  }
  return lines.join('\n')
}

function todaySlug() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function parseImportPayload(payload: unknown): GroundedEntry[] {
  if (Array.isArray(payload)) return payload as GroundedEntry[]
  if (payload && typeof payload === 'object' && Array.isArray((payload as { entries?: unknown }).entries)) {
    return (payload as { entries: GroundedEntry[] }).entries
  }
  throw new Error('无法识别这个备份文件。')
}

export default function App() {
  const [entries, setEntries] = useState<GroundedEntry[]>([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<GroundedCategory | ''>('')
  const [date, setDate] = useState('')
  const [editing, setEditing] = useState<EditingState | null>(null)
  const [message, setMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const refresh = async () => setEntries(await getEntries())

  useEffect(() => {
    void refresh()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return entries.filter((entry) => {
      if (category && entry.category !== category) return false
      if (date) {
        const entryDate = new Date(entry.createdAt)
        const localDate = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}-${String(entryDate.getDate()).padStart(2, '0')}`
        if (localDate !== date) return false
      }
      if (!q) return true
      const haystack = `${entry.content} ${entry.source?.title ?? ''} ${entry.source?.url ?? ''}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [category, date, entries, query])

  const showMessage = (text: string) => {
    setMessage(text)
    window.setTimeout(() => setMessage(''), 2400)
  }

  const handleExportJson = () => {
    const payload = {
      app: 'Grounded / 已发生',
      version: 1,
      exportedAt: new Date().toISOString(),
      entries
    }
    downloadText(`grounded-backup-${todaySlug()}.json`, JSON.stringify(payload, null, 2), 'application/json')
    showMessage('已导出 JSON 备份。')
  }

  const handleExportMarkdown = () => {
    downloadText(`grounded-${todaySlug()}.md`, entriesToMarkdown(entries), 'text/markdown')
    showMessage('已导出 Markdown。')
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const text = await file.text()
      const payload = JSON.parse(text) as unknown
      const imported = parseImportPayload(payload)
      const ok = window.confirm(`将导入 ${imported.length} 条记录。\n\n确定继续？\n\n默认会与现有记录合并，相同 id 的记录会被覆盖。`)
      if (!ok) return
      const next = await importEntries(imported, 'merge')
      setEntries(next)
      showMessage(`已导入 ${imported.length} 条记录。`)
    } catch (error) {
      const reason = error instanceof Error ? error.message : '导入失败。'
      window.alert(reason)
    }
  }

  const handleDelete = async (entry: GroundedEntry) => {
    const ok = window.confirm('删除这条已发生记录？')
    if (!ok) return
    await deleteEntry(entry.id)
    await refresh()
  }

  const handleEditSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!editing?.content.trim()) return
    await updateEntry(editing.id, {
      content: editing.content,
      category: editing.category || undefined
    })
    setEditing(null)
    await refresh()
  }

  return (
    <main className="app-shell">
      <div className="page-shell">
        <p className="kicker">Grounded Archive</p>
        <h1>已发生</h1>
        <p className="subtitle">这里是已经发生过的现实档案。只回看，不催促。</p>

        <section className="card backup-card" aria-label="备份与迁移">
          <div>
            <h2>备份</h2>
            <p>记录仍保存在本机。你可以随时导出备份，也可以从 JSON 备份导入。</p>
          </div>
          <div className="backup-actions">
            <button className="secondary-button" type="button" onClick={handleExportJson} disabled={entries.length === 0}>
              导出 JSON
            </button>
            <button className="secondary-button" type="button" onClick={handleExportMarkdown} disabled={entries.length === 0}>
              导出 Markdown
            </button>
            <button className="primary-button" type="button" onClick={handleImportClick}>
              导入 JSON
            </button>
            <input ref={fileInputRef} type="file" accept="application/json,.json" hidden onChange={handleImportFile} />
          </div>
        </section>
        <div className="feedback" role="status" aria-live="polite">
          {message}
        </div>

        <div className="archive-toolbar">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索关键词" aria-label="搜索关键词" />
          <select value={category} onChange={(event) => setCategory(categoryFromValue(event.target.value) ?? '')} aria-label="分类筛选">
            <option value="">全部分类</option>
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {CATEGORY_LABELS[item]}
              </option>
            ))}
          </select>
          <input value={date} onChange={(event) => setDate(event.target.value)} type="date" aria-label="日期筛选" />
        </div>

        {filtered.length === 0 ? (
          <p className="empty-state">没有找到记录。</p>
        ) : (
          filtered.map((entry) => (
            <article className="card archive-item" key={entry.id}>
              {editing?.id === entry.id ? (
                <form onSubmit={handleEditSubmit}>
                  <textarea value={editing.content} onChange={(event) => setEditing({ ...editing, content: event.target.value })} autoFocus />
                  <div className="category-row">
                    <select value={editing.category} onChange={(event) => setEditing({ ...editing, category: categoryFromValue(event.target.value) ?? '' })}>
                      <option value="">无分类</option>
                      {CATEGORIES.map((item) => (
                        <option key={item} value={item}>
                          {CATEGORY_LABELS[item]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="item-actions">
                    <button className="secondary-button" type="button" onClick={() => setEditing(null)}>
                      取消
                    </button>
                    <button className="primary-button" type="submit" disabled={!editing.content.trim()}>
                      保存
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="entry-meta">
                    <time dateTime={new Date(entry.createdAt).toISOString()}>
                      {formatDate(entry.createdAt)} {formatTime(entry.createdAt)}
                    </time>
                    {entry.category && <span>{CATEGORY_LABELS[entry.category]}</span>}
                    {entry.source?.type === 'webpage' && <span>网页证据</span>}
                  </div>
                  <p className="entry-content" style={{ marginTop: 8 }}>{entry.content}</p>
                  {entry.source?.url && (
                    <p className="entry-meta source-link">
                      <a href={entry.source.url} target="_blank" rel="noreferrer">
                        {entry.source.title || entry.source.url}
                      </a>
                    </p>
                  )}
                  <div className="item-actions">
                    <button className="text-button" type="button" onClick={() => setEditing({ id: entry.id, content: entry.content, category: entry.category ?? '' })}>
                      编辑
                    </button>
                    <button className="text-button" type="button" onClick={() => void handleDelete(entry)}>
                      删除
                    </button>
                  </div>
                </>
              )}
            </article>
          ))
        )}
      </div>
    </main>
  )
}
