import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react'
import { CATEGORY_LABELS, CATEGORIES, type GroundedCategory } from '../storage/types'

type CaptureFormProps = {
  onSubmit: (content: string, category?: GroundedCategory) => Promise<void> | void
  autoFocus?: boolean
  initialContent?: string
  submitLabel?: string
}

export function CaptureForm({ onSubmit, autoFocus = false, initialContent = '', submitLabel = '记录' }: CaptureFormProps) {
  const [content, setContent] = useState(initialContent)
  const [category, setCategory] = useState<GroundedCategory | undefined>()
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setContent(initialContent)
  }, [initialContent])

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  const save = async () => {
    if (!content.trim() || isSaving) return
    setIsSaving(true)
    try {
      await onSubmit(content, category)
      setContent('')
      setCategory(undefined)
      inputRef.current?.focus()
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    await save()
  }

  const handleKeyDown = async (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      await save()
    }
  }

  return (
    <form className="card capture-card" onSubmit={handleSubmit}>
      <textarea
        ref={inputRef}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="今天真实发生了什么？"
        aria-label="今天真实发生了什么"
      />
      <div className="category-row" aria-label="分类，可选">
        {CATEGORIES.map((item) => (
          <button
            className={`chip ${category === item ? 'active' : ''}`}
            key={item}
            type="button"
            onClick={() => setCategory((current) => (current === item ? undefined : item))}
          >
            {CATEGORY_LABELS[item]}
          </button>
        ))}
      </div>
      <div className="action-row">
        <span className="feedback">Cmd/Ctrl + Enter 可保存</span>
        <button className="primary-button" type="submit" disabled={!content.trim() || isSaving}>
          {isSaving ? '记录中' : submitLabel}
        </button>
      </div>
    </form>
  )
}
