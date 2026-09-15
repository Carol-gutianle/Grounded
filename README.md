# Grounded / 已发生

**少一点想象，多一点已发生。**

Grounded is a calm Chrome Extension for recording what has already happened. It is intentionally not a todo list, not a habit tracker, and not a productivity dashboard.

## Features

- Quick capture from the extension popup
- Optional category: 工作 / 研究 / 生活 / 身体 / 关系
- Local-first storage with `chrome.storage.local`
- Today view in popup
- New Tab replacement that shows today's reality log and this week's record count
- Archive page with search, date filter, category filter, edit, delete, JSON backup import/export, and Markdown export
- Keyboard shortcut: `Cmd+Shift+G` on macOS, `Ctrl+Shift+G` elsewhere
- Context menu: **Add to Grounded** for saving webpage evidence
- Fully offline; no login, backend, analytics, cloud sync, streaks, or gamification

## Tech Stack

- Chrome Extension Manifest V3
- Vite
- React
- TypeScript
- Plain CSS

## Development

```bash
npm install
npm run build
```

The production extension is generated in `dist/`.

## Install in Chrome Developer Mode

1. Run `npm install && npm run build`.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the generated `dist/` folder.
6. Pin **Grounded / 已发生** if you want quick popup access.

## Usage

### Popup

Click the extension icon, type what truly happened today, optionally choose a category, and press **记录**. `Enter`, `Cmd+Enter`, or `Ctrl+Enter` saves the entry.

### New Tab

Opening a new tab shows today's existing records and a quiet weekly count.

### Archive

Click **查看全部** in the popup or **查看档案** on the New Tab page to view, search, edit, and delete historical records.

The Archive page also includes backup controls:

- **导出 JSON**: downloads a full backup that can be imported later.
- **导入 JSON**: merges a previous Grounded backup into local storage. Records with the same `id` are overwritten.
- **导出 Markdown**: downloads a readable journal-style archive grouped by date.

### Keyboard Shortcut

Use `Cmd+Shift+G` / `Ctrl+Shift+G` to open a quick capture page. You can customize this at `chrome://extensions/shortcuts`.

### Context Menu

Right-click a webpage, link, or selected text, then choose **Add to Grounded**. Grounded saves it as webpage evidence with title, URL, and current time.

## Data Model

Entries are stored under the key `grounded_entries`:

```ts
type GroundedEntry = {
  id: string
  content: string
  category?: 'work' | 'research' | 'life' | 'body' | 'relationship'
  createdAt: number
  source?: {
    type: 'manual' | 'webpage'
    title?: string
    url?: string
  }
}
```

## Product Boundaries

This MVP intentionally avoids:

- Todo lists
- Deadlines
- Calendar planning
- Habit tracking
- Streaks
- Gamification
- AI scoring
- Productivity ratings
- Social sharing
- Backend services
