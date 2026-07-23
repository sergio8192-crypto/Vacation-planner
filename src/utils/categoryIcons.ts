import type { OptionCategory } from '../types'

export const CATEGORY_META: Record<
  OptionCategory,
  { icon: string; label: string; itineraryLabel: string }
> = {
  flights: { icon: '🛫', label: 'Flights', itineraryLabel: 'Flight' },
  cruises: { icon: '🚢', label: 'Cruises', itineraryLabel: 'Cruise' },
  hotels: { icon: '🏨', label: 'Hotels', itineraryLabel: 'Hotel' },
  carRentals: { icon: '🚗', label: 'Car Rentals', itineraryLabel: 'Car Rental' },
  groundTransport: { icon: '🚆', label: 'Trains & Buses', itineraryLabel: 'Transport' },
  activities: { icon: '🎟', label: 'Activities', itineraryLabel: 'Activity' },
}
