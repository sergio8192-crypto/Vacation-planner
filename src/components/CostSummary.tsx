import type { OptionItem } from '../types'
import { formatCurrency } from '../utils/format'
import { CATEGORY_META } from '../utils/categoryIcons'

interface CostSummaryProps {
  tripName: string
  selectedFlights: OptionItem[]
  selectedHotels: OptionItem[]
  selectedCarRentals: OptionItem[]
  selectedGroundTransport: OptionItem[]
  selectedActivities: OptionItem[]
  selectedCruises: OptionItem[]
  flightCost: number
  hotelCost: number
  carRentalCost: number
  groundTransportCost: number
  activitiesCost: number
  cruiseCost: number
  totalCost: number
  onReset: () => void
}

export function CostSummary({
  tripName,
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
  onReset,
}: CostSummaryProps) {
  const hasSelections =
    selectedFlights.length > 0 ||
    selectedHotels.length > 0 ||
    selectedCarRentals.length > 0 ||
    selectedGroundTransport.length > 0 ||
    selectedActivities.length > 0 ||
    selectedCruises.length > 0

  async function handleExportPdf() {
    if (!hasSelections) return
    const { exportBudgetToPdf } = await import('../utils/exportBudgetPdf')
    exportBudgetToPdf({
      tripName,
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
    })
  }

  async function handleCreateItinerary() {
    if (!hasSelections) return
    const { exportItineraryToPdf } = await import('../utils/exportItineraryPdf')
    exportItineraryToPdf({
      tripName,
      selectedFlights,
      selectedHotels,
      selectedCarRentals,
      selectedGroundTransport,
      selectedActivities,
      selectedCruises,
    })
  }

  const selectionChips = [
    selectedFlights.length > 0 && {
      label: CATEGORY_META.flights.label,
      names: selectedFlights.map((f) => f.name).join(', '),
    },
    selectedCruises.length > 0 && {
      label: CATEGORY_META.cruises.label,
      names: selectedCruises.map((c) => c.name).join(', '),
    },
    selectedHotels.length > 0 && {
      label: CATEGORY_META.hotels.label,
      names: selectedHotels.map((h) => h.name).join(', '),
    },
    selectedCarRentals.length > 0 && {
      label: CATEGORY_META.carRentals.label,
      names: selectedCarRentals.map((c) => c.name).join(', '),
    },
    selectedGroundTransport.length > 0 && {
      label: CATEGORY_META.groundTransport.label,
      names: selectedGroundTransport.map((t) => t.name).join(', '),
    },
    selectedActivities.length > 0 && {
      label: CATEGORY_META.activities.label,
      names: selectedActivities.map((a) => a.name).join(', '),
    },
  ].filter(Boolean) as { label: string; names: string }[]

  return (
    <aside className="summary-panel" aria-label="Trip cost summary">
      <div className="summary-sticky">
        <h2 className="summary-title">Your trip total</h2>
        <p className="summary-trip-name">{tripName || 'Untitled trip'}</p>

        <div className="summary-breakdown">
          <div className="summary-line">
            <span className="summary-label">Flights</span>
            <span className="summary-value">
              {selectedFlights.length > 0 ? formatCurrency(flightCost) : '—'}
            </span>
          </div>
          <div className="summary-line">
            <span className="summary-label">Cruises</span>
            <span className="summary-value">
              {selectedCruises.length > 0 ? formatCurrency(cruiseCost) : '—'}
            </span>
          </div>
          <div className="summary-line">
            <span className="summary-label">Hotels</span>
            <span className="summary-value">
              {selectedHotels.length > 0 ? formatCurrency(hotelCost) : '—'}
            </span>
          </div>
          <div className="summary-line">
            <span className="summary-label">Car Rentals</span>
            <span className="summary-value">
              {selectedCarRentals.length > 0 ? formatCurrency(carRentalCost) : '—'}
            </span>
          </div>
          <div className="summary-line">
            <span className="summary-label">Trains & Buses</span>
            <span className="summary-value">
              {selectedGroundTransport.length > 0 ? formatCurrency(groundTransportCost) : '—'}
            </span>
          </div>
          <div className="summary-line">
            <span className="summary-label">Activities</span>
            <span className="summary-value">
              {selectedActivities.length > 0 ? formatCurrency(activitiesCost) : '—'}
            </span>
          </div>
        </div>

        <div className="summary-total">
          <span className="summary-total-label">Total</span>
          <span className="summary-total-value">{formatCurrency(totalCost)}</span>
        </div>

        <div className="summary-selections">
          {selectionChips.length > 0 ? (
            selectionChips.map((chip) => (
              <div key={chip.label} className="selection-chip">
                <span className="chip-label">{chip.label}</span> {chip.names}
              </div>
            ))
          ) : (
            <p className="summary-hint">
              Select flights, hotels, car rentals, cruises, transport, and activities to build your
              trip total.
            </p>
          )}
        </div>

        <button
          type="button"
          className="btn btn-export"
          onClick={handleExportPdf}
          disabled={!hasSelections}
        >
          Export to PDF
        </button>
        <button
          type="button"
          className="btn btn-itinerary"
          onClick={handleCreateItinerary}
          disabled={!hasSelections}
        >
          Create Itinerary
        </button>
        <button type="button" className="btn btn-clear" onClick={onReset}>
          Clear current trip
        </button>
      </div>
    </aside>
  )
}
