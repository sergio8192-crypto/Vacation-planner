import type { OptionCategory, OptionItem } from '../types'
import { formatDisplayDate, formatDateRange, joinMetaParts } from './dates'
import { formatCurrency } from './format'

export function getHotelTotal(item: OptionItem): number {
  if (item.nights != null && item.pricePerNight != null) {
    return item.nights * item.pricePerNight
  }
  return item.price
}

export function getOptionDateLabel(category: OptionCategory, item: OptionItem): string {
  switch (category) {
    case 'hotels':
      return formatDateRange(item.checkInDate, item.checkOutDate)
    case 'flights':
    case 'groundTransport':
    case 'activities':
    case 'cruises':
      return item.date ? formatDisplayDate(item.date) : ''
    case 'carRentals':
      return ''
  }
}

export function getOptionDetails(category: OptionCategory, item: OptionItem): string {
  switch (category) {
    case 'flights':
      return item.route ?? item.description
    case 'hotels': {
      const nights = item.nights ?? 1
      const perNight = item.pricePerNight ?? item.price / nights
      return `${nights} night${nights === 1 ? '' : 's'} · ${formatCurrency(perNight)}/night`
    }
    case 'groundTransport': {
      const parts = [item.mode, item.route ?? item.description].filter(Boolean)
      return parts.join(' · ')
    }
    case 'activities':
      return item.notes ?? item.description
    case 'cruises': {
      const parts = [
        item.destination,
        item.duration ? `Duration: ${item.duration}` : '',
      ].filter(Boolean)
      return parts.join(' · ')
    }
    case 'carRentals': {
      const parts = [
        item.city,
        item.vehicleType,
        item.duration ? `Duration: ${item.duration}` : '',
      ].filter(Boolean)
      return parts.join(' · ')
    }
  }
}

export function getOptionMeta(category: OptionCategory, item: OptionItem): string {
  return joinMetaParts(getOptionDateLabel(category, item), getOptionDetails(category, item))
}

export function getOptionPriceLabel(category: OptionCategory, item: OptionItem): string {
  if (category === 'hotels') {
    return formatCurrency(getHotelTotal(item))
  }
  return formatCurrency(item.price)
}

export function getSelectedItemCost(category: OptionCategory, item: OptionItem): number {
  if (category === 'hotels') {
    return getHotelTotal(item)
  }
  return item.price
}
