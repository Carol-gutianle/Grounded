export function startOfToday(date = new Date()) {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  return start
}

export function startOfTomorrow(date = new Date()) {
  const start = startOfToday(date)
  start.setDate(start.getDate() + 1)
  return start
}

export function startOfWeek(date = new Date()) {
  const start = startOfToday(date)
  const day = start.getDay() || 7
  start.setDate(start.getDate() - day + 1)
  return start
}

export function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(timestamp)
}

export function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
    .format(timestamp)
    .replaceAll('/', '.')
}

export function formatLongDate(date = new Date()) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
    .format(date)
    .replaceAll('/', '.')
}

export function isSameDay(timestamp: number, date = new Date()) {
  const start = startOfToday(date).getTime()
  const end = startOfTomorrow(date).getTime()
  return timestamp >= start && timestamp < end
}
