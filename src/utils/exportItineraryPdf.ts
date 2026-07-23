import jsPDF from 'jspdf'
import {
  buildItineraryEntries,
  getTripDateRange,
  groupItineraryByDate,
  UNSCHEDULED_SORT_KEY,
  type ItineraryDayGroup,
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

const PAGE_MARGIN = 12
const CONTENT_WIDTH = 186
const DATE_BOX_WIDTH = 16
const ICON_SIZE = 3.5
const PAGE_BOTTOM = 287

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

function getDateColumnLines(sortKey: string): string[] {
  if (sortKey === UNSCHEDULED_SORT_KEY) {
    return ['Other']
  }

  const short = formatShortDate(sortKey)
  const parts = short.split(' ')
  if (parts.length === 2) {
    return parts
  }
  return [short]
}

function drawHeader(doc: jsPDF, tripName: string, scale: number): number {
  const pageWidth = doc.internal.pageSize.getWidth()
  const headerHeight = 26 * scale

  doc.setFillColor(...NAVY)
  doc.rect(0, 0, pageWidth, headerHeight, 'F')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(16 * scale)
  doc.setTextColor(...HEADER_SALMON)
  doc.text('Travel Itinerary', pageWidth / 2, 10 * scale, { align: 'center' })

  doc.setFontSize(11 * scale)
  doc.setTextColor(255, 255, 255)
  doc.text(tripName || 'Untitled trip', pageWidth / 2, 20 * scale, { align: 'center' })

  doc.setTextColor(0, 0, 0)
  return headerHeight + 4 * scale
}

function drawLabelRow(
  doc: jsPDF,
  y: number,
  label: string,
  value: string,
  scale: number,
): number {
  const labelWidth = 32 * scale
  const valueWidth = CONTENT_WIDTH - labelWidth
  const rowHeight = 7 * scale

  doc.setFillColor(...NAVY)
  doc.rect(PAGE_MARGIN, y, labelWidth, rowHeight, 'F')

  doc.setFillColor(...MAUVE)
  doc.rect(PAGE_MARGIN + labelWidth, y, valueWidth, rowHeight, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7 * scale)
  doc.setTextColor(255, 255, 255)
  doc.text(label, PAGE_MARGIN + 1.5, y + 4.8 * scale)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5 * scale)
  doc.setTextColor(0, 0, 0)
  const lines = doc.splitTextToSize(value, valueWidth - 3)
  doc.text(lines[0] ?? value, PAGE_MARGIN + labelWidth + 1.5, y + 4.8 * scale)

  return y + rowHeight + 1.5 * scale
}

function drawTravelDetails(
  doc: jsPDF,
  y: number,
  destination: string,
  arrival: string,
  departure: string,
  scale: number,
): number {
  y = drawLabelRow(doc, y, 'DESTINATION:', destination, scale)
  y = drawLabelRow(doc, y, 'ARRIVAL:', arrival, scale)
  y = drawLabelRow(doc, y, 'DEPARTURE:', departure, scale)
  return y + 2 * scale
}

function measureEntryHeight(
  doc: jsPDF,
  entry: ItineraryEntry,
  textWidth: number,
  lineHeight: number,
): number {
  const text = `${entry.name} — ${entry.details}`
  const lines = doc.splitTextToSize(text, textWidth)
  return Math.max(lineHeight, lines.length * lineHeight + 0.5)
}

function drawActivityEntry(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  entry: ItineraryEntry,
  fontSize: number,
  lineHeight: number,
  iconSize: number,
): number {
  const textX = x + iconSize + 1.5
  const textWidth = width - iconSize - 3
  const text = `${entry.name} — ${entry.details}`
  const lines = doc.splitTextToSize(text, textWidth)
  const blockHeight = Math.max(lineHeight, lines.length * lineHeight + 0.5)

  const image = getEmojiImageDataUrl(entry.icon)
  if (image) {
    doc.addImage(image, 'PNG', x, y + 0.3, iconSize, iconSize)
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(fontSize)
  doc.setTextColor(0, 0, 0)
  doc.text(lines, textX, y + lineHeight - 0.8)

  return blockHeight
}

function measureDateSectionHeight(
  doc: jsPDF,
  entries: ItineraryEntry[],
  textWidth: number,
  lineHeight: number,
  padding: number,
): number {
  const entryHeights = entries.map((entry) =>
    measureEntryHeight(doc, entry, textWidth, lineHeight),
  )
  const contentHeight = entryHeights.reduce((sum, height) => sum + height, 0) + padding * 2
  return Math.max(14, contentHeight)
}

function drawDateSection(
  doc: jsPDF,
  y: number,
  sortKey: string,
  entries: ItineraryEntry[],
  scale: number,
): number {
  const rightX = PAGE_MARGIN + DATE_BOX_WIDTH + 1.5
  const rightWidth = CONTENT_WIDTH - DATE_BOX_WIDTH - 1.5
  const fontSize = 7 * scale
  const lineHeight = 3.6 * scale
  const padding = 2.5 * scale
  const iconSize = ICON_SIZE * scale
  const textWidth = rightWidth - iconSize - 4

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(fontSize)

  const sectionHeight = measureDateSectionHeight(
    doc,
    entries,
    textWidth,
    lineHeight,
    padding,
  )

  doc.setFillColor(...NAVY)
  doc.rect(PAGE_MARGIN, y, DATE_BOX_WIDTH, sectionHeight, 'F')

  const dateLines = getDateColumnLines(sortKey)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7 * scale)
  doc.setTextColor(255, 255, 255)
  const dateBlockHeight = dateLines.length * 3.4 * scale
  let dateY = y + (sectionHeight - dateBlockHeight) / 2 + 2.5 * scale
  for (const line of dateLines) {
    doc.text(line, PAGE_MARGIN + DATE_BOX_WIDTH / 2, dateY, { align: 'center' })
    dateY += 3.4 * scale
  }

  doc.setDrawColor(...MAUVE_DARK)
  doc.setLineWidth(0.25)
  doc.rect(rightX, y, rightWidth, sectionHeight)

  let entryY = y + padding
  for (const entry of entries) {
    const height = drawActivityEntry(
      doc,
      rightX + 2,
      entryY,
      rightWidth - 4,
      entry,
      fontSize,
      lineHeight,
      iconSize,
    )
    entryY += height
  }

  doc.setTextColor(0, 0, 0)
  return y + sectionHeight + 2 * scale
}

function estimateTotalHeight(
  doc: jsPDF,
  tripName: string,
  dayGroups: ItineraryDayGroup[],
  scale: number,
): number {
  let y = drawHeader(doc, tripName, scale)
  y = drawTravelDetails(doc, y, tripName, 'placeholder', 'placeholder', scale)

  for (const group of dayGroups) {
    const rightWidth = CONTENT_WIDTH - DATE_BOX_WIDTH - 1.5
    const textWidth = rightWidth - ICON_SIZE * scale - 4
    const lineHeight = 3.6 * scale
    const padding = 2.5 * scale
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7 * scale)
    y +=
      measureDateSectionHeight(doc, group.entries, textWidth, lineHeight, padding) +
      2 * scale
  }

  return y + 6 * scale
}

function chooseScale(tripName: string, dayGroups: ItineraryDayGroup[]): number {
  for (const scale of [1, 0.92, 0.84, 0.76, 0.68]) {
    const measureDoc = new jsPDF()
    if (estimateTotalHeight(measureDoc, tripName, dayGroups, scale) <= PAGE_BOTTOM) {
      return scale
    }
  }
  return 0.68
}

export function exportItineraryToPdf(data: ItineraryExportData): void {
  const entries = buildItineraryEntries(data)
  const dayGroups = groupItineraryByDate(entries)
  const tripDates = getTripDateRange(data)

  const tripName = data.tripName || 'Untitled trip'

  if (dayGroups.length === 0) {
    const doc = new jsPDF()
    let y = drawHeader(doc, tripName, 1)
    y = drawTravelDetails(
      doc,
      y,
      tripName,
      tripDates ? formatDisplayDate(tripDates.arrival) : '—',
      tripDates ? formatDisplayDate(tripDates.departure) : '—',
      1,
    )
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    doc.text('No selected items to include in this itinerary.', PAGE_MARGIN, y + 4)
    doc.save(`${sanitizeFilename(tripName)}-itinerary.pdf`)
    return
  }

  const scale = chooseScale(tripName, dayGroups)
  const doc = new jsPDF()
  let y = drawHeader(doc, tripName, scale)

  const arrival = tripDates ? formatDisplayDate(tripDates.arrival) : 'See schedule below'
  const departure = tripDates ? formatDisplayDate(tripDates.departure) : 'See schedule below'
  y = drawTravelDetails(doc, y, tripName, arrival, departure, scale)

  for (const group of dayGroups) {
    y = drawDateSection(doc, y, group.sortKey, group.entries, scale)
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7 * scale)
  doc.setTextColor(120, 120, 120)
  doc.text('Generated by Voyage', PAGE_MARGIN, PAGE_BOTTOM)

  doc.save(`${sanitizeFilename(tripName)}-itinerary.pdf`)
}
