import type { OptionCategory, OptionItem } from '../types'
import { CATEGORY_META } from './categoryIcons'
import { formatDisplayDate } from './dates'
import { getOptionDateLabel, getOptionDetails } from './optionDisplay'

const UNSCHEDULED_SORT_KEY = '9999-12-31'

const CATEGORY_ORDER: OptionCategory[] = [
  'flights',
  'cruises',
  'hotels',
  'carRentals',
  'groundTransport',
  'activities',
]

export interface ItineraryEntry {
  sortKey: string
  dateLabel: string
  icon: string
  category: OptionCategory
  categoryLabel: string
  name: string
  details: string
}

export interface ItineraryInput {
  selectedFlights: OptionItem[]
  selectedCruises: OptionItem[]
  selectedHotels: OptionItem[]
  selectedCarRentals: OptionItem[]
  selectedGroundTransport: OptionItem[]
  selectedActivities: OptionItem[]
}

function getSortKey(category: OptionCategory, item: OptionItem): string {
  if (category === 'hotels') {
    return item.checkInDate ?? UNSCHEDULED_SORT_KEY
  }
  if (category === 'carRentals') {
    return UNSCHEDULED_SORT_KEY
  }
  return item.date ?? UNSCHEDULED_SORT_KEY
}

function getDateLabel(category: OptionCategory, item: OptionItem, sortKey: string): string {
  if (sortKey === UNSCHEDULED_SORT_KEY) {
    return 'Unscheduled'
  }
  if (category === 'hotels') {
    return getOptionDateLabel(category, item) || formatDisplayDate(sortKey)
  }
  return formatDisplayDate(sortKey)
}

export function buildItineraryEntries(input: ItineraryInput): ItineraryEntry[] {
  const groups: { category: OptionCategory; items: OptionItem[] }[] = [
    { category: 'flights', items: input.selectedFlights },
    { category: 'cruises', items: input.selectedCruises },
    { category: 'hotels', items: input.selectedHotels },
    { category: 'carRentals', items: input.selectedCarRentals },
    { category: 'groundTransport', items: input.selectedGroundTransport },
    { category: 'activities', items: input.selectedActivities },
  ]

  const entries: ItineraryEntry[] = []

  for (const { category, items } of groups) {
    const meta = CATEGORY_META[category]
    for (const item of items) {
      const sortKey = getSortKey(category, item)
      entries.push({
        sortKey,
        dateLabel: getDateLabel(category, item, sortKey),
        icon: meta.icon,
        category,
        categoryLabel: meta.itineraryLabel,
        name: item.name,
        details: getOptionDetails(category, item) || '—',
      })
    }
  }

  return entries.sort((a, b) => {
    if (a.sortKey !== b.sortKey) {
      return a.sortKey.localeCompare(b.sortKey)
    }
    return CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)
  })
}

export interface ItineraryDayGroup {
  sortKey: string
  dateLabel: string
  entries: ItineraryEntry[]
}

export function groupItineraryByDate(entries: ItineraryEntry[]): ItineraryDayGroup[] {
  const groups: ItineraryDayGroup[] = []

  for (const entry of entries) {
    const last = groups[groups.length - 1]
    if (last && last.sortKey === entry.sortKey) {
      last.entries.push(entry)
      continue
    }
    groups.push({
      sortKey: entry.sortKey,
      dateLabel: entry.dateLabel,
      entries: [entry],
    })
  }

  return groups
}

export function getTripDateRange(input: ItineraryInput): { arrival: string; departure: string } | null {
  const dates: string[] = []

  for (const item of input.selectedFlights) {
    if (item.date) dates.push(item.date)
  }
  for (const item of input.selectedCruises) {
    if (item.date) dates.push(item.date)
  }
  for (const item of input.selectedHotels) {
    if (item.checkInDate) dates.push(item.checkInDate)
    if (item.checkOutDate) dates.push(item.checkOutDate)
  }
  for (const item of input.selectedGroundTransport) {
    if (item.date) dates.push(item.date)
  }
  for (const item of input.selectedActivities) {
    if (item.date) dates.push(item.date)
  }

  if (dates.length === 0) return null
  dates.sort()
  return { arrival: dates[0], departure: dates[dates.length - 1] }
}

export { UNSCHEDULED_SORT_KEY }
