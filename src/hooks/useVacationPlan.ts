import { useCallback, useEffect, useRef, useState } from 'react'
import type { OptionCategory, OptionItem, VacationPlan, VacationStore } from '../types'
import { EMPTY_PLAN } from '../types'
import { fetchVacations, saveVacations } from '../api/client'
import { getHotelTotal } from '../utils/optionDisplay'
import {
  createDefaultStore,
  createSavedVacation,
  normalizeStore,
  uniqueTripName,
} from '../utils/vacationStore'

const SELECTION_KEYS: Record<OptionCategory, keyof VacationPlan> = {
  flights: 'selectedFlightIds',
  hotels: 'selectedHotelIds',
  carRentals: 'selectedCarRentalIds',
  groundTransport: 'selectedGroundTransportIds',
  activities: 'selectedActivityIds',
  cruises: 'selectedCruiseIds',
}

function createId() {
  return crypto.randomUUID()
}

export function useVacationPlan() {
  const [store, setStore] = useState<VacationStore | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncError, setSyncError] = useState<string | null>(null)
  const skipNextSave = useRef(true)

  useEffect(() => {
    let cancelled = false

    fetchVacations()
      .then((data) => {
        if (!cancelled) {
          setStore(normalizeStore(data))
          setSyncError(null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStore(createDefaultStore())
          setSyncError('Could not load your vacations')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
          skipNextSave.current = true
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!store || loading) return
    if (skipNextSave.current) {
      skipNextSave.current = false
      return
    }

    const timer = window.setTimeout(() => {
      saveVacations(store).catch(() => {
        setSyncError('Could not save changes')
      })
    }, 500)

    return () => window.clearTimeout(timer)
  }, [store, loading])

  const updateActivePlan = useCallback((updater: (current: VacationPlan) => VacationPlan) => {
    setStore((current) => {
      if (!current) return current
      return {
        ...current,
        vacations: current.vacations.map((vacation) =>
          vacation.id === current.activeVacationId
            ? {
                ...vacation,
                plan: updater(vacation.plan),
                updatedAt: new Date().toISOString(),
              }
            : vacation,
        ),
      }
    })
    setSyncError(null)
  }, [])

  const setTripName = useCallback(
    (tripName: string) => {
      updateActivePlan((p) => ({ ...p, tripName }))
    },
    [updateActivePlan],
  )

  const addOption = useCallback(
    (category: OptionCategory, item: Omit<OptionItem, 'id'>) => {
      const newItem = { ...item, id: createId() }
      updateActivePlan((p) => ({
        ...p,
        [category]: [...p[category], newItem],
      }))
    },
    [updateActivePlan],
  )

  const removeOption = useCallback(
    (category: OptionCategory, id: string) => {
      const selectionKey = SELECTION_KEYS[category]
      updateActivePlan((p) => ({
        ...p,
        [category]: p[category].filter((item) => item.id !== id),
        [selectionKey]: (p[selectionKey] as string[]).filter((sid) => sid !== id),
      }))
    },
    [updateActivePlan],
  )

  const toggleSelection = useCallback(
    (category: OptionCategory, id: string) => {
      const selectionKey = SELECTION_KEYS[category]
      updateActivePlan((p) => {
        const selected = p[selectionKey] as string[]
        return {
          ...p,
          [selectionKey]: selected.includes(id)
            ? selected.filter((sid) => sid !== id)
            : [...selected, id],
        }
      })
    },
    [updateActivePlan],
  )

  const resetPlan = useCallback(() => {
    if (!store) return
    const active = store.vacations.find((v) => v.id === store.activeVacationId)
    const tripName = active?.plan.tripName ?? EMPTY_PLAN.tripName
    updateActivePlan(() => ({ ...EMPTY_PLAN, tripName }))
  }, [store, updateActivePlan])

  const switchVacation = useCallback((id: string) => {
    setStore((current) =>
      current?.vacations.some((v) => v.id === id)
        ? { ...current, activeVacationId: id }
        : current,
    )
    setSyncError(null)
  }, [])

  const createVacation = useCallback(() => {
    setStore((current) => {
      if (!current) return current
      const vacation = createSavedVacation({
        ...EMPTY_PLAN,
        tripName: uniqueTripName(current.vacations),
      })
      return {
        activeVacationId: vacation.id,
        vacations: [...current.vacations, vacation],
      }
    })
    setSyncError(null)
  }, [])

  const deleteVacation = useCallback((id: string) => {
    setStore((current) => {
      if (!current || current.vacations.length <= 1) return current

      const vacations = current.vacations.filter((v) => v.id !== id)
      const activeVacationId =
        current.activeVacationId === id ? vacations[0].id : current.activeVacationId

      return { activeVacationId, vacations }
    })
    setSyncError(null)
  }, [])

  const activeVacation = store?.vacations.find((v) => v.id === store.activeVacationId)
  const plan = activeVacation?.plan ?? EMPTY_PLAN

  const selectedFlights = plan.flights.filter((f) => plan.selectedFlightIds.includes(f.id))
  const selectedHotels = plan.hotels.filter((h) => plan.selectedHotelIds.includes(h.id))
  const selectedCarRentals = plan.carRentals.filter((c) => plan.selectedCarRentalIds.includes(c.id))
  const selectedGroundTransport = plan.groundTransport.filter((t) =>
    plan.selectedGroundTransportIds.includes(t.id),
  )
  const selectedActivities = plan.activities.filter((a) =>
    plan.selectedActivityIds.includes(a.id),
  )
  const selectedCruises = plan.cruises.filter((c) => plan.selectedCruiseIds.includes(c.id))

  const flightCost = selectedFlights.reduce((sum, f) => sum + f.price, 0)
  const hotelCost = selectedHotels.reduce((sum, h) => sum + getHotelTotal(h), 0)
  const carRentalCost = selectedCarRentals.reduce((sum, c) => sum + c.price, 0)
  const groundTransportCost = selectedGroundTransport.reduce((sum, t) => sum + t.price, 0)
  const activitiesCost = selectedActivities.reduce((sum, a) => sum + a.price, 0)
  const cruiseCost = selectedCruises.reduce((sum, c) => sum + c.price, 0)
  const totalCost =
    flightCost + hotelCost + carRentalCost + groundTransportCost + activitiesCost + cruiseCost

  return {
    plan,
    vacations: store?.vacations ?? [],
    activeVacationId: store?.activeVacationId ?? '',
    loading,
    syncError,
    setTripName,
    addOption,
    removeOption,
    toggleSelection,
    resetPlan,
    switchVacation,
    createVacation,
    deleteVacation,
    selectedFlights,
    selectedHotels,
    selectedCarRentals,
    selectedGroundTransport,
    selectedActivities,
    selectedCruises,
    flightCost,
    hotelCost,
    carRentalCost,
    groundTransportCost,
    activitiesCost,
    cruiseCost,
    totalCost,
  }
}
