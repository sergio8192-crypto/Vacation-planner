import type { SavedVacation, VacationPlan, VacationStore } from '../types'
import { EMPTY_PLAN } from '../types'

const STORAGE_KEY = 'vacation-planner-store'
const LEGACY_STORAGE_KEY = 'vacation-plan'

export function migratePlan(raw: Record<string, unknown>): VacationPlan {
  const plan = { ...EMPTY_PLAN, ...raw } as VacationPlan & {
    selectedFlightId?: string | null
    selectedHotelId?: string | null
  }

  if (!Array.isArray(plan.selectedFlightIds)) {
    plan.selectedFlightIds = plan.selectedFlightId ? [plan.selectedFlightId] : []
  }
  if (!Array.isArray(plan.selectedHotelIds)) {
    plan.selectedHotelIds = plan.selectedHotelId ? [plan.selectedHotelId] : []
  }
  if (!Array.isArray(plan.selectedActivityIds)) {
    plan.selectedActivityIds = []
  }
  if (!Array.isArray(plan.groundTransport)) {
    plan.groundTransport = []
  }
  if (!Array.isArray(plan.selectedGroundTransportIds)) {
    plan.selectedGroundTransportIds = []
  }
  if (!Array.isArray(plan.cruises)) {
    plan.cruises = []
  }
  if (!Array.isArray(plan.selectedCruiseIds)) {
    plan.selectedCruiseIds = []
  }
  if (!Array.isArray(plan.carRentals)) {
    plan.carRentals = []
  }
  if (!Array.isArray(plan.selectedCarRentalIds)) {
    plan.selectedCarRentalIds = []
  }

  return plan
}

export function createSavedVacation(plan: VacationPlan = { ...EMPTY_PLAN }): SavedVacation {
  return {
    id: crypto.randomUUID(),
    plan,
    updatedAt: new Date().toISOString(),
  }
}

export function createDefaultStore(): VacationStore {
  const vacation = createSavedVacation()
  return { activeVacationId: vacation.id, vacations: [vacation] }
}

export function normalizeStore(raw: unknown): VacationStore {
  if (raw && typeof raw === 'object') {
    const parsed = raw as VacationStore
    if (Array.isArray(parsed.vacations) && parsed.vacations.length > 0) {
      const vacations = parsed.vacations.map((vacation) => ({
        ...vacation,
        plan: migratePlan(vacation.plan as unknown as Record<string, unknown>),
      }))
      const activeVacationId = vacations.some((v) => v.id === parsed.activeVacationId)
        ? parsed.activeVacationId
        : vacations[0].id
      return { activeVacationId, vacations }
    }
  }
  return createDefaultStore()
}

export function loadLocalStore(): VacationStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return normalizeStore(JSON.parse(raw))

    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (legacy) {
      const vacation = createSavedVacation(migratePlan(JSON.parse(legacy)))
      localStorage.removeItem(LEGACY_STORAGE_KEY)
      return { activeVacationId: vacation.id, vacations: [vacation] }
    }
  } catch {
    /* ignore corrupt data */
  }
  return createDefaultStore()
}

export function uniqueTripName(vacations: SavedVacation[]): string {
  const names = new Set(vacations.map((v) => v.plan.tripName))
  if (!names.has('New Vacation')) return 'New Vacation'
  let i = 2
  while (names.has(`New Vacation ${i}`)) i++
  return `New Vacation ${i}`
}
