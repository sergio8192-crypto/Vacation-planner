import type { SavedVacation } from '../types'
import { formatCurrency } from '../utils/format'
import { computePlanTotal } from '../utils/planTotals'

interface VacationSidebarProps {
  vacations: SavedVacation[]
  activeVacationId: string
  onSelect: (id: string) => void
  onCreate: () => void
  onDelete: (id: string) => void
}

export function VacationSidebar({
  vacations,
  activeVacationId,
  onSelect,
  onCreate,
  onDelete,
}: VacationSidebarProps) {
  const sortedVacations = [...vacations].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )

  return (
    <aside className="vacations-sidebar" aria-label="Saved vacations">
      <div className="vacations-sidebar-inner">
        <div className="vacations-sidebar-header">
          <h2 className="vacations-title">Saved vacations</h2>
          <p className="vacations-desc">Switch between trips you&apos;ve planned</p>
        </div>

        <button type="button" className="btn btn-new-vacation" onClick={onCreate}>
          + New vacation
        </button>

        <div className="vacations-list">
          {sortedVacations.map((vacation) => {
            const isActive = vacation.id === activeVacationId
            const total = computePlanTotal(vacation.plan)
            const hasSelections =
              vacation.plan.selectedFlightIds.length > 0 ||
              vacation.plan.selectedHotelIds.length > 0 ||
              vacation.plan.selectedGroundTransportIds.length > 0 ||
              vacation.plan.selectedActivityIds.length > 0

            return (
              <div
                key={vacation.id}
                className={`vacation-card${isActive ? ' vacation-card--active' : ''}`}
              >
                <button
                  type="button"
                  className="vacation-card-body"
                  onClick={() => onSelect(vacation.id)}
                >
                  <span className="vacation-card-name">
                    {vacation.plan.tripName || 'Untitled trip'}
                  </span>
                  <span className="vacation-card-meta">
                    {hasSelections ? (
                      <span className="vacation-card-total">{formatCurrency(total)}</span>
                    ) : (
                      'No selections yet'
                    )}
                  </span>
                </button>

                {vacations.length > 1 && (
                  <button
                    type="button"
                    className="vacation-card-delete"
                    onClick={() => {
                      if (
                        confirm(`Delete "${vacation.plan.tripName || 'Untitled trip'}"? This cannot be undone.`)
                      ) {
                        onDelete(vacation.id)
                      }
                    }}
                    aria-label={`Delete ${vacation.plan.tripName}`}
                  >
                    ×
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {vacations.length === 0 && (
          <p className="vacations-empty">No saved vacations yet.</p>
        )}
      </div>
    </aside>
  )
}
