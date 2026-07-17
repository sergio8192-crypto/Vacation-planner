import type { OptionCategory, OptionItem } from '../types'
import { formatCurrency } from './format'

export function getHotelTotal(item: OptionItem): number {
  if (item.nights != null && item.pricePerNight != null) {
    return item.nights * item.pricePerNight
  }
  return item.price
}

export function getOptionMeta(category: OptionCategory, item: OptionItem): string {
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
  }
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
