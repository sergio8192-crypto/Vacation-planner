import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { OptionCategory, OptionItem } from '../types'
import { formatCurrency } from './format'
import { getHotelTotal, getOptionDateLabel, getOptionDetails } from './optionDisplay'

interface BudgetExportData {
  tripName: string
  selectedFlights: OptionItem[]
  selectedHotels: OptionItem[]
  selectedGroundTransport: OptionItem[]
  selectedActivities: OptionItem[]
  selectedCruises: OptionItem[]
  flightCost: number
  hotelCost: number
  groundTransportCost: number
  activitiesCost: number
  cruiseCost: number
  totalCost: number
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-') || 'vacation-budget'
}

function itemAmount(category: OptionCategory, item: OptionItem): string {
  if (category === 'hotels') return formatCurrency(getHotelTotal(item))
  return formatCurrency(item.price)
}

function addCategorySection(
  doc: jsPDF,
  y: number,
  title: string,
  category: OptionCategory,
  items: OptionItem[],
  subtotal: number,
): number {
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 14, y)

  if (items.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(120, 120, 120)
    doc.text('None selected', 14, y + 6)
    doc.setTextColor(0, 0, 0)
    return y + 14
  }

  autoTable(doc, {
    startY: y + 3,
    head: [['Item', 'Date', 'Details', 'Cost']],
    body: items.map((item) => [
      item.name,
      getOptionDateLabel(category, item) || '—',
      getOptionDetails(category, item) || '—',
      itemAmount(category, item),
    ]),
    foot: [['', '', 'Subtotal', formatCurrency(subtotal)]],
    theme: 'striped',
    headStyles: { fillColor: [26, 58, 74] },
    footStyles: { fillColor: [247, 244, 239], textColor: [42, 111, 122], fontStyle: 'bold' },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 10 },
  })

  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
}

export function exportBudgetToPdf(data: BudgetExportData): void {
  const doc = new jsPDF()
  const generated = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Voyage — Vacation Budget', 14, 22)

  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text(data.tripName || 'Untitled trip', 14, 32)

  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Generated on ${generated}`, 14, 40)
  doc.setTextColor(0, 0, 0)

  let y = 52
  y = addCategorySection(doc, y, 'Flights', 'flights', data.selectedFlights, data.flightCost)
  y = addCategorySection(doc, y, 'Hotels', 'hotels', data.selectedHotels, data.hotelCost)
  y = addCategorySection(doc, y, 'Cruises', 'cruises', data.selectedCruises, data.cruiseCost)
  y = addCategorySection(
    doc,
    y,
    'Trains & Buses',
    'groundTransport',
    data.selectedGroundTransport,
    data.groundTransportCost,
  )
  y = addCategorySection(
    doc,
    y,
    'Activities',
    'activities',
    data.selectedActivities,
    data.activitiesCost,
  )

  autoTable(doc, {
    startY: y,
    body: [['Total Estimated Cost', formatCurrency(data.totalCost)]],
    theme: 'plain',
    margin: { left: 14, right: 14 },
    styles: { fontSize: 14, fontStyle: 'bold', fillColor: [26, 58, 74], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { halign: 'right' },
    },
  })

  doc.save(`${sanitizeFilename(data.tripName)}-budget.pdf`)
}
