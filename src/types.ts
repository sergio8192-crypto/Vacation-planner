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
  rentalCompany?: string
  city?: string
  vehicleType?: string
}

export interface VacationPlan {
  tripName: string
  flights: OptionItem[]
  hotels: OptionItem[]
  carRentals: OptionItem[]
  groundTransport: OptionItem[]
  activities: OptionItem[]
  cruises: OptionItem[]
  selectedFlightIds: string[]
  selectedHotelIds: string[]
  selectedCarRentalIds: string[]
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

export type OptionCategory =
  | 'flights'
  | 'hotels'
  | 'carRentals'
  | 'groundTransport'
  | 'activities'
  | 'cruises'

export const EMPTY_PLAN: VacationPlan = {
  tripName: 'My Vacation',
  flights: [],
  hotels: [],
  carRentals: [],
  groundTransport: [],
  activities: [],
  cruises: [],
  selectedFlightIds: [],
  selectedHotelIds: [],
  selectedCarRentalIds: [],
  selectedGroundTransportIds: [],
  selectedActivityIds: [],
  selectedCruiseIds: [],
}
