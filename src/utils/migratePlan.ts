import type { VacationPlan } from '../types'
import { EMPTY_PLAN } from '../types'

export function migratePlan(raw: Record<string, unknown>): VacationPlan {
  const plan = { ...EMPTY_PLAN, ...raw } as VacationPlan & {
    selectedFlightId?: string | null
    selectedHotelId?: string | null
  }

  if (!Array.isArray(plan.flights)) plan.flights = []
  if (!Array.isArray(plan.hotels)) plan.hotels = []
  if (!Array.isArray(plan.carRentals)) plan.carRentals = []
  if (!Array.isArray(plan.groundTransport)) plan.groundTransport = []
  if (!Array.isArray(plan.activities)) plan.activities = []
  if (!Array.isArray(plan.cruises)) plan.cruises = []
  if (!Array.isArray(plan.selectedFlightIds)) plan.selectedFlightIds = []
  if (!Array.isArray(plan.selectedHotelIds)) plan.selectedHotelIds = []
  if (!Array.isArray(plan.selectedCarRentalIds)) plan.selectedCarRentalIds = []
  if (!Array.isArray(plan.selectedGroundTransportIds)) plan.selectedGroundTransportIds = []
  if (!Array.isArray(plan.selectedActivityIds)) plan.selectedActivityIds = []
  if (!Array.isArray(plan.selectedCruiseIds)) plan.selectedCruiseIds = []

  if (raw.selectedFlightId && plan.selectedFlightIds.length === 0) {
    plan.selectedFlightIds = [String(raw.selectedFlightId)]
  }
  if (raw.selectedHotelId && plan.selectedHotelIds.length === 0) {
    plan.selectedHotelIds = [String(raw.selectedHotelId)]
  }

  if (typeof plan.tripName !== 'string' || !plan.tripName.trim()) {
    plan.tripName = EMPTY_PLAN.tripName
  }

  return plan
}
