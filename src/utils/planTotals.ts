import type { OptionCategory, OptionItem, VacationPlan } from '../types'
import { getSelectedItemCost } from './optionDisplay'

function itemCost(category: OptionCategory, item: OptionItem): number {
  return getSelectedItemCost(category, item)
}

export function computePlanTotal(plan: VacationPlan): number {
  function sumSelected(
    items: OptionItem[],
    selectedIds: string[],
    category: OptionCategory,
  ): number {
    return items
      .filter((item) => selectedIds.includes(item.id))
      .reduce((sum, item) => sum + itemCost(category, item), 0)
  }

  return (
    sumSelected(plan.flights, plan.selectedFlightIds, 'flights') +
    sumSelected(plan.hotels, plan.selectedHotelIds, 'hotels') +
    sumSelected(plan.carRentals, plan.selectedCarRentalIds, 'carRentals') +
    sumSelected(plan.groundTransport, plan.selectedGroundTransportIds, 'groundTransport') +
    sumSelected(plan.activities, plan.selectedActivityIds, 'activities') +
    sumSelected(plan.cruises, plan.selectedCruiseIds, 'cruises')
  )
}

export function countPlanOptions(plan: VacationPlan): number {
  return (
    plan.flights.length +
    plan.hotels.length +
    plan.carRentals.length +
    plan.groundTransport.length +
    plan.activities.length +
    plan.cruises.length
  )
}
