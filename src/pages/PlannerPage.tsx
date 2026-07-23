import { useVacationPlan } from '../hooks/useVacationPlan'
import { useAuth } from '../contexts/AuthContext'
import { CostSummary } from '../components/CostSummary'
import { CategorySection } from '../components/CategorySection'
import { VacationSidebar } from '../components/VacationSidebar'
import { CATEGORY_META } from '../utils/categoryIcons'

export function PlannerPage() {
  const { user, logout } = useAuth()
  const {
    plan,
    vacations,
    activeVacationId,
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
  } = useVacationPlan()

  if (loading) {
    return (
      <div className="auth-page">
        <p className="auth-brand-tagline">Loading your vacation plans...</p>
      </div>
    )
  }

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <a href="#" className="logo" onClick={(e) => e.preventDefault()}>
            <span className="logo-icon" aria-hidden="true">
              ✈
            </span>
            <span className="logo-text">Voyage</span>
          </a>
          <p className="header-tagline">Plan your trip, compare options, see the total</p>
          <div className="header-user">
            <span className="header-user-email">{user?.email}</span>
            <button type="button" className="btn btn-header-logout" onClick={logout}>
              Log out
            </button>
          </div>
        </div>
        {syncError && (
          <p className="auth-error" style={{ margin: '0 1.5rem 1rem', color: '#ffb4a0' }}>
            {syncError}
          </p>
        )}
      </header>

      <div className="page-layout">
        <VacationSidebar
          vacations={vacations}
          activeVacationId={activeVacationId}
          onSelect={switchVacation}
          onCreate={createVacation}
          onDelete={deleteVacation}
        />

        <div className="layout">
          <main className="main">
            <section className="trip-header card">
              <label htmlFor="trip-name" className="trip-label">
                Trip name
              </label>
              <input
                type="text"
                id="trip-name"
                className="trip-name-input"
                placeholder="e.g. Summer in Barcelona"
                value={plan.tripName}
                onChange={(e) => setTripName(e.target.value)}
                autoComplete="off"
              />
            </section>

            <CategorySection
              category="flights"
              title="Flights"
              icon={CATEGORY_META.flights.icon}
              description="Add flight options — select as many as you like"
              items={plan.flights}
              selectedIds={plan.selectedFlightIds}
              emptyMessage="No flights yet. Add your first option above."
              addButtonLabel="Add flight"
              onAdd={(item) => addOption('flights', item)}
              onRemove={(id) => removeOption('flights', id)}
              onToggle={(id) => toggleSelection('flights', id)}
            />

            <CategorySection
              category="cruises"
              title="Cruises"
              icon={CATEGORY_META.cruises.icon}
              description="Add cruise options — select as many as you like"
              items={plan.cruises}
              selectedIds={plan.selectedCruiseIds}
              emptyMessage="No cruises yet. Add your first option above."
              addButtonLabel="Add cruise"
              onAdd={(item) => addOption('cruises', item)}
              onRemove={(id) => removeOption('cruises', id)}
              onToggle={(id) => toggleSelection('cruises', id)}
            />

            <CategorySection
              category="hotels"
              title="Hotels"
              icon={CATEGORY_META.hotels.icon}
              description="Add hotel options — select as many as you like"
              items={plan.hotels}
              selectedIds={plan.selectedHotelIds}
              emptyMessage="No hotels yet. Add your first option above."
              addButtonLabel="Add hotel"
              onAdd={(item) => addOption('hotels', item)}
              onRemove={(id) => removeOption('hotels', id)}
              onToggle={(id) => toggleSelection('hotels', id)}
            />

            <CategorySection
              category="carRentals"
              title="Car Rentals"
              icon={CATEGORY_META.carRentals.icon}
              description="Add car rental options — select as many as you like"
              items={plan.carRentals}
              selectedIds={plan.selectedCarRentalIds}
              emptyMessage="No car rentals yet. Add your first option above."
              addButtonLabel="Add car rental"
              onAdd={(item) => addOption('carRentals', item)}
              onRemove={(id) => removeOption('carRentals', id)}
              onToggle={(id) => toggleSelection('carRentals', id)}
            />

            <CategorySection
              category="groundTransport"
              title="Trains & Buses"
              icon={CATEGORY_META.groundTransport.icon}
              description="Add ground transport options — select as many as you like"
              items={plan.groundTransport}
              selectedIds={plan.selectedGroundTransportIds}
              emptyMessage="No trains or buses yet. Add your first option above."
              addButtonLabel="Add transport"
              onAdd={(item) => addOption('groundTransport', item)}
              onRemove={(id) => removeOption('groundTransport', id)}
              onToggle={(id) => toggleSelection('groundTransport', id)}
            />

            <CategorySection
              category="activities"
              title="Activities"
              icon={CATEGORY_META.activities.icon}
              description="Add things to do — select as many as you like"
              items={plan.activities}
              selectedIds={plan.selectedActivityIds}
              emptyMessage="No activities yet. Add your first option above."
              addButtonLabel="Add activity"
              onAdd={(item) => addOption('activities', item)}
              onRemove={(id) => removeOption('activities', id)}
              onToggle={(id) => toggleSelection('activities', id)}
            />

          </main>

          <CostSummary
            tripName={plan.tripName}
            selectedFlights={selectedFlights}
            selectedHotels={selectedHotels}
            selectedCarRentals={selectedCarRentals}
            selectedGroundTransport={selectedGroundTransport}
            selectedActivities={selectedActivities}
            selectedCruises={selectedCruises}
            flightCost={flightCost}
            hotelCost={hotelCost}
            carRentalCost={carRentalCost}
            groundTransportCost={groundTransportCost}
            activitiesCost={activitiesCost}
            cruiseCost={cruiseCost}
            totalCost={totalCost}
            onReset={() => {
              if (confirm('Clear all options and selections for this vacation?')) {
                resetPlan()
              }
            }}
          />
        </div>
      </div>
    </>
  )
}
