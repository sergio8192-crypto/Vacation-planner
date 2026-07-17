export interface OptionItem {
  id: string
  name: string
  description: string
  price: number
  route?: string
  nights?: number
  pricePerNight?: number
  mode?: string
  notes?: string
}

export interface VacationPlan {
  tripName: string
  flights: OptionItem[]
  hotels: OptionItem[]
  groundTransport: OptionItem[]
  activities: OptionItem[]
  selectedFlightIds: string[]
  selectedHotelIds: string[]
  selectedGroundTransportIds: string[]
  selectedActivityIds: string[]
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

export type OptionCategory = 'flights' | 'hotels' | 'groundTransport' | 'activities'

export const EMPTY_PLAN: VacationPlan = {
  tripName: 'My Vacation',
  flights: [],
  hotels: [],
  groundTransport: [],
  activities: [],
  selectedFlightIds: [],
  selectedHotelIds: [],
  selectedGroundTransportIds: [],
  selectedActivityIds: [],
}
