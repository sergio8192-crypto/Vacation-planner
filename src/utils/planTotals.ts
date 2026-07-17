import type { OptionItem, VacationPlan } from '../types'
import { getHotelTotal } from './optionDisplay'

function itemCost(category: keyof VacationPlan, item: OptionItem): number {
  if (category === 'hotels') return getHotelTotal(item)
  return item.price
}

export function computePlanTotal(plan: VacationPlan): number {
  function sumSelected(
    items: OptionItem[],
    selectedIds: string[],
    category: keyof VacationPlan,
  ): number {
    return items
      .filter((item) => selectedIds.includes(item.id))
      .reduce((sum, item) => sum + itemCost(category, item), 0)
  }

  return (
    sumSelected(plan.flights, plan.selectedFlightIds, 'flights') +
    sumSelected(plan.hotels, plan.selectedHotelIds, 'hotels') +
    sumSelected(plan.groundTransport, plan.selectedGroundTransportIds, 'groundTransport') +
    sumSelected(plan.activities, plan.selectedActivityIds, 'activities')
  )
}

export function countPlanOptions(plan: VacationPlan): number {
  return (
    plan.flights.length +
    plan.hotels.length +
    plan.groundTransport.length +
    plan.activities.length
  )
}
