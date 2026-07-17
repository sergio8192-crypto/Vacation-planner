function createDefaultStore() {
  const vacationId = crypto.randomUUID()
  return {
    activeVacationId: vacationId,
    vacations: [
      {
        id: vacationId,
        updatedAt: new Date().toISOString(),
        plan: {
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
        },
      },
    ],
  }
}

export function getDefaultStoreJson(): string {
  return JSON.stringify(createDefaultStore())
}

export function parseStore(data: string | undefined) {
  if (!data) return createDefaultStore()
  try {
    const parsed = JSON.parse(data)
    if (Array.isArray(parsed.vacations) && parsed.vacations.length > 0) {
      return parsed
    }
  } catch {
    /* fall through */
  }
  return createDefaultStore()
}
