const DISPLAY: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
}

export function formatDisplayDate(isoDate: string): string {
  const date = parseIsoDate(isoDate)
  if (!date) return ''
  return date.toLocaleDateString('en-US', DISPLAY)
}

export function formatDateRange(start?: string, end?: string): string {
  if (start && end) {
    return `${formatDisplayDate(start)} – ${formatDisplayDate(end)}`
  }
  if (start) return formatDisplayDate(start)
  if (end) return formatDisplayDate(end)
  return ''
}

export function nightsBetween(checkIn: string, checkOut: string): number | null {
  const start = parseIsoDate(checkIn)
  const end = parseIsoDate(checkOut)
  if (!start || !end) return null
  const nights = Math.round((end.getTime() - start.getTime()) / 86_400_000)
  return nights > 0 ? nights : null
}

function parseIsoDate(isoDate: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null
  const date = new Date(`${isoDate}T12:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

export function joinMetaParts(...parts: (string | undefined)[]): string {
  return parts.filter(Boolean).join(' · ')
}
