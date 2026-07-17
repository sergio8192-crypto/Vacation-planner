export interface OptionItem {
  id: string
  name: string
  description: string
  price: number
  date?: string
  checkInDate?: string
  checkOutDate?: string
  route?: string
  nights?: number
  pricePerNight?: number
  mode?: string
  notes?: string
  cruiseLine?: string
  destination?: string
  duration?: string
}

export interface VacationPlan {
  tripName: string
  flights: OptionItem[]
  hotels: OptionItem[]
  groundTransport: OptionItem[]
  activities: OptionItem[]
  cruises: OptionItem[]
  selectedFlightIds: string[]
  selectedHotelIds: string[]
  selectedGroundTransportIds: string[]
  selectedActivityIds: string[]
  selectedCruiseIds: string[]
}

export interface SavedVacation {
  id: string
  plan: VacationPlan
  updatedAt: string
}

export interface VacationStore {
  activeVacationId: string
  vacations: SavedVacation[]
}

export type OptionCategory = 'flights' | 'hotels' | 'groundTransport' | 'activities' | 'cruises'

export const EMPTY_PLAN: VacationPlan = {
  tripName: 'My Vacation',
  flights: [],
  hotels: [],
  groundTransport: [],
  activities: [],
  cruises: [],
  selectedFlightIds: [],
  selectedHotelIds: [],
  selectedGroundTransportIds: [],
  selectedActivityIds: [],
  selectedCruiseIds: [],
}
