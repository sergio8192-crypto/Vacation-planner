const EMPTY_PLAN = {
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

const PLAN_ARRAY_FIELDS = [
  'flights',
  'hotels',
  'carRentals',
  'groundTransport',
  'activities',
  'cruises',
  'selectedFlightIds',
  'selectedHotelIds',
  'selectedCarRentalIds',
  'selectedGroundTransportIds',
  'selectedActivityIds',
  'selectedCruiseIds',
] as const

export function migratePlan(raw: Record<string, unknown>) {
  const plan = { ...EMPTY_PLAN, ...raw } as typeof EMPTY_PLAN & {
    selectedFlightId?: string | null
    selectedHotelId?: string | null
  }

  for (const key of PLAN_ARRAY_FIELDS) {
    if (!Array.isArray(plan[key])) {
      plan[key] = []
    }
  }

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

function createDefaultStore() {
  const vacationId = crypto.randomUUID()
  return {
    activeVacationId: vacationId,
    vacations: [
      {
        id: vacationId,
        updatedAt: new Date().toISOString(),
        plan: { ...EMPTY_PLAN },
      },
    ],
  }
}

export function getDefaultStoreJson(): string {
  return JSON.stringify(createDefaultStore())
}

function normalizeStore(raw: unknown) {
  if (raw && typeof raw === 'object') {
    const parsed = raw as {
      activeVacationId?: string
      vacations?: Array<{ id?: string; updatedAt?: string; plan?: Record<string, unknown> }>
    }

    if (Array.isArray(parsed.vacations) && parsed.vacations.length > 0) {
      const vacations = parsed.vacations.map((vacation) => ({
        id: vacation.id ?? crypto.randomUUID(),
        updatedAt: vacation.updatedAt ?? new Date().toISOString(),
        plan: migratePlan(vacation.plan ?? {}),
      }))
      const activeVacationId = vacations.some((v) => v.id === parsed.activeVacationId)
        ? parsed.activeVacationId!
        : vacations[0].id
      return { activeVacationId, vacations }
    }
  }

  return createDefaultStore()
}

export function parseStore(data: string | undefined) {
  if (!data) return createDefaultStore()
  try {
    return normalizeStore(JSON.parse(data))
  } catch {
    return createDefaultStore()
  }
}
