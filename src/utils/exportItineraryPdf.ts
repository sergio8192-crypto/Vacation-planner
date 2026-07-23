import jsPDF from 'jspdf'
import {
  buildItineraryEntries,
  getTripDateRange,
  groupItineraryByDate,
  UNSCHEDULED_SORT_KEY,
  type ItineraryEntry,
  type ItineraryInput,
} from './buildItinerary'
import { formatDisplayDate, formatShortDate } from './dates'

interface ItineraryExportData extends ItineraryInput {
  tripName: string
}

const NAVY = [28, 42, 68] as const
const MAUVE = [215, 186, 178] as const
const MAUVE_DARK = [194, 158, 148] as const
const HEADER_SALMON = [205, 155, 140] as const

const PAGE_MARGIN = 14
const CONTENT_WIDTH = 182
const DAY_BOX_WIDTH = 22
const ICON_SIZE = 5

const emojiImageCache = new Map<string, string>()

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-') || 'vacation-itinerary'
}

function getEmojiImageDataUrl(emoji: string): string {
  const cached = emojiImageCache.get(emoji)
  if (cached) return cached

  const canvas = document.createElement('canvas')
  const size = 32
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `${size * 0.72}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`
  ctx.fillText(emoji, size / 2, size / 2)

  const dataUrl = canvas.toDataURL('image/png')
  emojiImageCache.set(emoji, dataUrl)
  return dataUrl
}

function ensurePageSpace(doc: jsPDF, y: number, needed: number): number {
  const pageHeight = doc.internal.pageSize.getHeight()
  if (y + needed <= pageHeight - 16) return y
  doc.addPage()
  return 18
}

function drawHeader(doc: jsPDF, tripName: string): number {
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFillColor(...NAVY)
  doc.rect(0, 0, pageWidth, 36, 'F')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(20)
  doc.setTextColor(...HEADER_SALMON)
  doc.text('Travel Itinerary', pageWidth / 2, 14, { align: 'center' })

  doc.setFontSize(13)
  doc.setTextColor(255, 255, 255)
  doc.text(tripName || 'Untitled trip', pageWidth / 2, 26, { align: 'center' })

  doc.setTextColor(0, 0, 0)
  return 44
}

function drawLabelRow(doc: jsPDF, y: number, label: string, value: string): number {
  const labelWidth = 36
  const valueWidth = CONTENT_WIDTH - labelWidth

  doc.setFillColor(...NAVY)
  doc.rect(PAGE_MARGIN, y, labelWidth, 9, 'F')

  doc.setFillColor(...MAUVE)
  doc.rect(PAGE_MARGIN + labelWidth, y, valueWidth, 9, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255)
  doc.text(label, PAGE_MARGIN + 2, y + 6)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  const lines = doc.splitTextToSize(value, valueWidth - 4)
  doc.text(lines[0] ?? value, PAGE_MARGIN + labelWidth + 2, y + 6)

  doc.setTextColor(0, 0, 0)
  return y + 11
}

function drawTravelDetails(
  doc: jsPDF,
  y: number,
  destination: string,
  arrival: string,
  departure: string,
): number {
  y = drawLabelRow(doc, y, 'DESTINATION:', destination)
  y = drawLabelRow(doc, y, 'ARRIVAL:', arrival)
  y = drawLabelRow(doc, y, 'DEPARTURE:', departure)
  return y + 4
}

function measureEntryHeight(doc: jsPDF, entry: ItineraryEntry, textWidth: number): number {
  const text = `${entry.categoryLabel}: ${entry.name} — ${entry.details}`
  const lines = doc.splitTextToSize(text, textWidth)
  return Math.max(7, lines.length * 4.8 + 1.5)
}

function drawActivityEntry(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  entry: ItineraryEntry,
): number {
  const textX = x + ICON_SIZE + 2
  const textWidth = width - ICON_SIZE - 4
  const text = `${entry.categoryLabel}: ${entry.name} — ${entry.details}`
  const lines = doc.splitTextToSize(text, textWidth)
  const blockHeight = Math.max(7, lines.length * 4.8 + 1.5)

  const image = getEmojiImageDataUrl(entry.icon)
  if (image) {
    doc.addImage(image, 'PNG', x, y + 0.5, ICON_SIZE, ICON_SIZE)
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  doc.text(lines, textX, y + 4)

  return blockHeight
}

function drawDaySection(
  doc: jsPDF,
  y: number,
  dayNumber: number,
  shortDate: string,
  entries: ItineraryEntry[],
): number {
  const rightX = PAGE_MARGIN + DAY_BOX_WIDTH + 2
  const rightWidth = CONTENT_WIDTH - DAY_BOX_WIDTH - 2
  const textWidth = rightWidth - ICON_SIZE - 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)

  const entryHeights = entries.map((entry) => measureEntryHeight(doc, entry, textWidth))
  const contentHeight = entryHeights.reduce((sum, height) => sum + height, 0) + 8
  const sectionHeight = Math.max(30, contentHeight)

  y = ensurePageSpace(doc, y, sectionHeight + 8)

  doc.setFillColor(...NAVY)
  doc.rect(PAGE_MARGIN, y, DAY_BOX_WIDTH, sectionHeight, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(255, 255, 255)
  doc.text('DAY', PAGE_MARGIN + DAY_BOX_WIDTH / 2, y + 7, { align: 'center' })

  doc.setFontSize(16)
  doc.text(String(dayNumber).padStart(2, '0'), PAGE_MARGIN + DAY_BOX_WIDTH / 2, y + 16, {
    align: 'center',
  })

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(shortDate, PAGE_MARGIN + DAY_BOX_WIDTH / 2, y + sectionHeight - 5, { align: 'center' })

  doc.setDrawColor(...MAUVE_DARK)
  doc.setLineWidth(0.35)
  doc.rect(rightX, y, rightWidth, sectionHeight)

  let entryY = y + 5
  for (let i = 0; i < entries.length; i += 1) {
    const height = drawActivityEntry(doc, rightX + 3, entryY, rightWidth - 6, entries[i])
    entryY += height
  }

  doc.setTextColor(0, 0, 0)
  return y + sectionHeight + 6
}

function drawOtherPlansSection(doc: jsPDF, y: number, entries: ItineraryEntry[]): number {
  const rightX = PAGE_MARGIN + DAY_BOX_WIDTH + 2
  const rightWidth = CONTENT_WIDTH - DAY_BOX_WIDTH - 2
  const textWidth = rightWidth - ICON_SIZE - 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const entryHeights = entries.map((entry) => measureEntryHeight(doc, entry, textWidth))
  const contentHeight = entryHeights.reduce((sum, height) => sum + height, 0) + 8
  const sectionHeight = Math.max(24, contentHeight)

  y = ensurePageSpace(doc, y, sectionHeight + 16)

  doc.setFillColor(...NAVY)
  doc.rect(PAGE_MARGIN, y, DAY_BOX_WIDTH, sectionHeight, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(255, 255, 255)
  doc.text('OTHER', PAGE_MARGIN + DAY_BOX_WIDTH / 2, y + 8, { align: 'center' })
  doc.text('PLANS', PAGE_MARGIN + DAY_BOX_WIDTH / 2, y + 12, { align: 'center' })

  doc.setDrawColor(...MAUVE_DARK)
  doc.setLineWidth(0.35)
  doc.rect(rightX, y, rightWidth, sectionHeight)

  let entryY = y + 5
  for (let i = 0; i < entries.length; i += 1) {
    const height = drawActivityEntry(doc, rightX + 3, entryY, rightWidth - 6, entries[i])
    entryY += height
  }

  doc.setTextColor(0, 0, 0)
  return y + sectionHeight + 8
}

function drawImportantInformation(doc: jsPDF, y: number, tripName: string, entryCount: number): number {
  y = ensurePageSpace(doc, y, 40)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text('IMPORTANT INFORMATION', PAGE_MARGIN, y)
  y += 5

  const boxHeight = 34
  doc.setFillColor(...MAUVE)
  doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, boxHeight, 'F')

  const bullets = [
    `Keep a copy of this itinerary for ${tripName || 'your trip'} while traveling.`,
    `This plan includes ${entryCount} selected booking${entryCount === 1 ? '' : 's'} from your Voyage planner.`,
    'Confirm check-in times, terminals, and reservation details with providers before departure.',
    'Save emergency contacts and travel insurance details with your trip documents.',
  ]

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(0, 0, 0)

  let bulletY = y + 6
  for (const bullet of bullets) {
    doc.text('•', PAGE_MARGIN + 3, bulletY)
    const lines = doc.splitTextToSize(bullet, CONTENT_WIDTH - 10)
    doc.text(lines, PAGE_MARGIN + 7, bulletY)
    bulletY += lines.length * 4.2 + 1.5
  }

  return y + boxHeight + 6
}

export function exportItineraryToPdf(data: ItineraryExportData): void {
  const entries = buildItineraryEntries(data)
  const dayGroups = groupItineraryByDate(entries)
  const tripDates = getTripDateRange(data)
  const doc = new jsPDF()

  const tripName = data.tripName || 'Untitled trip'
  let y = drawHeader(doc, tripName)

  const destination = tripName
  const arrival = tripDates ? formatDisplayDate(tripDates.arrival) : 'See day-by-day plan below'
  const departure = tripDates ? formatDisplayDate(tripDates.departure) : 'See day-by-day plan below'
  y = drawTravelDetails(doc, y, destination, arrival, departure)

  if (dayGroups.length === 0) {
    y = ensurePageSpace(doc, y, 20)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(120, 120, 120)
    doc.text('No selected items to include in this itinerary.', PAGE_MARGIN, y)
    doc.save(`${sanitizeFilename(tripName)}-itinerary.pdf`)
    return
  }

  let dayNumber = 0
  for (const group of dayGroups) {
    if (group.sortKey === UNSCHEDULED_SORT_KEY) {
      y = drawOtherPlansSection(doc, y, group.entries)
      continue
    }

    dayNumber += 1
    y = drawDaySection(doc, y, dayNumber, formatShortDate(group.sortKey), group.entries)
  }

  y = drawImportantInformation(doc, y, tripName, entries.length)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(120, 120, 120)
  doc.text('Generated by Voyage', PAGE_MARGIN, doc.internal.pageSize.getHeight() - 8)

  doc.save(`${sanitizeFilename(tripName)}-itinerary.pdf`)
}
