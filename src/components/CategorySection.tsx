import { useState, type FormEvent } from 'react'
import type { OptionCategory, OptionItem } from '../types'
import { formatCurrency } from '../utils/format'
import { nightsBetween } from '../utils/dates'
import { getOptionMeta, getOptionPriceLabel } from '../utils/optionDisplay'

type AddPayload = Omit<OptionItem, 'id'>

function parsePeople(value: string): number {
  const count = parseInt(value, 10)
  return !Number.isNaN(count) && count >= 1 ? count : 1
}

function PeopleCountField({
  id,
  value,
  onChange,
}: {
  id: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="form-field">
      <label htmlFor={id}>Number of people</label>
      <input
        id={id}
        type="number"
        min="1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      />
    </div>
  )
}

interface CategorySectionProps {
  category: OptionCategory
  title: string
  icon: string
  description: string
  items: OptionItem[]
  selectedIds: string[]
  emptyMessage: string
  addButtonLabel: string
  onAdd: (item: AddPayload) => void
  onRemove: (id: string) => void
  onToggle: (id: string) => void
}

export function CategorySection({
  category,
  title,
  icon,
  description,
  items,
  selectedIds,
  emptyMessage,
  addButtonLabel,
  onAdd,
  onRemove,
  onToggle,
}: CategorySectionProps) {
  return (
    <section className="category card">
      <div className="category-header">
        <div className="category-title-row">
          <span className="category-icon" aria-hidden="true">
            {icon}
          </span>
          <div>
            <h2 className="category-title">{title}</h2>
            <p className="category-desc">{description}</p>
          </div>
        </div>
      </div>

      <CategoryForm category={category} addButtonLabel={addButtonLabel} onAdd={onAdd} />

      <div className="options-list" aria-label={`${title} options`}>
        {items.map((item) => {
          const selected = selectedIds.includes(item.id)
          const meta = getOptionMeta(category, item)
          return (
            <div
              key={item.id}
              className={`option-card${selected ? ' option-card--selected' : ''}`}
              onClick={() => onToggle(item.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onToggle(item.id)
                }
              }}
              role="button"
              tabIndex={0}
            >
              <input
                type="checkbox"
                className="option-input"
                checked={selected}
                onChange={() => onToggle(item.id)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Select ${item.name}`}
              />
              <div className="option-body">
                <span className="option-name">{item.name}</span>
                {meta && <span className="option-meta">{meta}</span>}
              </div>
              <div className="option-right">
                <span className="option-price">{getOptionPriceLabel(category, item)}</span>
                <button
                  type="button"
                  className="option-delete"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove(item.id)
                  }}
                  aria-label={`Remove ${item.name}`}
                >
                  ×
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {items.length === 0 && <p className="empty-msg">{emptyMessage}</p>}
    </section>
  )
}

function CategoryForm({
  category,
  addButtonLabel,
  onAdd,
}: {
  category: OptionCategory
  addButtonLabel: string
  onAdd: (item: AddPayload) => void
}) {
  switch (category) {
    case 'flights':
      return <FlightForm addButtonLabel={addButtonLabel} onAdd={onAdd} />
    case 'hotels':
      return <HotelForm addButtonLabel={addButtonLabel} onAdd={onAdd} />
    case 'carRentals':
      return <CarRentalForm addButtonLabel={addButtonLabel} onAdd={onAdd} />
    case 'groundTransport':
      return <TransitForm addButtonLabel={addButtonLabel} onAdd={onAdd} />
    case 'activities':
      return <ActivityForm addButtonLabel={addButtonLabel} onAdd={onAdd} />
    case 'cruises':
      return <CruiseForm addButtonLabel={addButtonLabel} onAdd={onAdd} />
  }
}

function FlightForm({
  addButtonLabel,
  onAdd,
}: {
  addButtonLabel: string
  onAdd: (item: AddPayload) => void
}) {
  const [name, setName] = useState('')
  const [route, setRoute] = useState('')
  const [date, setDate] = useState('')
  const [people, setPeople] = useState('1')
  const [price, setPrice] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = parseFloat(price)
    const numberOfPeople = parsePeople(people)
    if (!name.trim() || isNaN(parsed) || parsed < 0) return
    onAdd({
      name: name.trim(),
      route: route.trim(),
      date: date || undefined,
      description: route.trim(),
      numberOfPeople,
      price: parsed,
    })
    setName('')
    setRoute('')
    setDate('')
    setPeople('1')
    setPrice('')
  }

  return (
    <form className="add-form" onSubmit={handleSubmit} autoComplete="off">
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="flight-name">Label</label>
          <input
            id="flight-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Delta nonstop"
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="flight-route">Route</label>
          <input
            id="flight-route"
            value={route}
            onChange={(e) => setRoute(e.target.value)}
            placeholder="e.g. LAX → BCN"
          />
        </div>
        <div className="form-field">
          <label htmlFor="flight-date">Departure date</label>
          <input
            id="flight-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <PeopleCountField id="flight-people" value={people} onChange={setPeople} />
        <div className="form-field">
          <label htmlFor="flight-price">Price per person ($)</label>
          <input
            id="flight-price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>
      </div>
      <button type="submit" className="btn btn-add">
        {addButtonLabel}
      </button>
    </form>
  )
}

function HotelForm({
  addButtonLabel,
  onAdd,
}: {
  addButtonLabel: string
  onAdd: (item: AddPayload) => void
}) {
  const [name, setName] = useState('')
  const [checkInDate, setCheckInDate] = useState('')
  const [checkOutDate, setCheckOutDate] = useState('')
  const [nights, setNights] = useState('3')
  const [pricePerNight, setPricePerNight] = useState('')

  function handleCheckInChange(value: string) {
    setCheckInDate(value)
    if (value && checkOutDate) {
      const computed = nightsBetween(value, checkOutDate)
      if (computed) setNights(String(computed))
    }
  }

  function handleCheckOutChange(value: string) {
    setCheckOutDate(value)
    if (checkInDate && value) {
      const computed = nightsBetween(checkInDate, value)
      if (computed) setNights(String(computed))
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const nightsNum = parseInt(nights, 10)
    const perNight = parseFloat(pricePerNight)
    if (!name.trim() || isNaN(nightsNum) || nightsNum < 1 || isNaN(perNight) || perNight < 0) return
    onAdd({
      name: name.trim(),
      checkInDate: checkInDate || undefined,
      checkOutDate: checkOutDate || undefined,
      nights: nightsNum,
      pricePerNight: perNight,
      price: nightsNum * perNight,
      description: `${nightsNum} night${nightsNum === 1 ? '' : 's'} · ${formatCurrency(perNight)}/night`,
    })
    setName('')
    setCheckInDate('')
    setCheckOutDate('')
    setNights('3')
    setPricePerNight('')
  }

  return (
    <form className="add-form" onSubmit={handleSubmit} autoComplete="off">
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="hotel-name">Name</label>
          <input
            id="hotel-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Hotel Arts Barcelona"
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="hotel-check-in">Check-in</label>
          <input
            id="hotel-check-in"
            type="date"
            value={checkInDate}
            onChange={(e) => handleCheckInChange(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="hotel-check-out">Check-out</label>
          <input
            id="hotel-check-out"
            type="date"
            value={checkOutDate}
            min={checkInDate || undefined}
            onChange={(e) => handleCheckOutChange(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="hotel-nights">Nights</label>
          <input
            id="hotel-nights"
            type="number"
            min="1"
            value={nights}
            onChange={(e) => setNights(e.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="hotel-price">Price per night ($)</label>
          <input
            id="hotel-price"
            type="number"
            min="0"
            step="0.01"
            value={pricePerNight}
            onChange={(e) => setPricePerNight(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>
      </div>
      <button type="submit" className="btn btn-add">
        {addButtonLabel}
      </button>
    </form>
  )
}

function TransitForm({
  addButtonLabel,
  onAdd,
}: {
  addButtonLabel: string
  onAdd: (item: AddPayload) => void
}) {
  const [name, setName] = useState('')
  const [mode, setMode] = useState('Train')
  const [route, setRoute] = useState('')
  const [date, setDate] = useState('')
  const [people, setPeople] = useState('1')
  const [price, setPrice] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = parseFloat(price)
    const numberOfPeople = parsePeople(people)
    if (!name.trim() || isNaN(parsed) || parsed < 0) return
    const routeText = route.trim()
    onAdd({
      name: name.trim(),
      mode,
      route: routeText,
      date: date || undefined,
      description: [mode, routeText].filter(Boolean).join(' · '),
      numberOfPeople,
      price: parsed,
    })
    setName('')
    setMode('Train')
    setRoute('')
    setDate('')
    setPeople('1')
    setPrice('')
  }

  return (
    <form className="add-form" onSubmit={handleSubmit} autoComplete="off">
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="transit-name">Label</label>
          <input
            id="transit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. AVE high-speed"
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="transit-mode">Type</label>
          <select id="transit-mode" value={mode} onChange={(e) => setMode(e.target.value)} required>
            <option value="Train">Train</option>
            <option value="Bus">Bus</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="transit-route">Route</label>
          <input
            id="transit-route"
            value={route}
            onChange={(e) => setRoute(e.target.value)}
            placeholder="e.g. Barcelona → Madrid"
          />
        </div>
        <div className="form-field">
          <label htmlFor="transit-date">Travel date</label>
          <input
            id="transit-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <PeopleCountField id="transit-people" value={people} onChange={setPeople} />
        <div className="form-field">
          <label htmlFor="transit-price">Price per person ($)</label>
          <input
            id="transit-price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>
      </div>
      <button type="submit" className="btn btn-add">
        {addButtonLabel}
      </button>
    </form>
  )
}

function ActivityForm({
  addButtonLabel,
  onAdd,
}: {
  addButtonLabel: string
  onAdd: (item: AddPayload) => void
}) {
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState('')
  const [people, setPeople] = useState('1')
  const [price, setPrice] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = parseFloat(price)
    const numberOfPeople = parsePeople(people)
    if (!name.trim() || isNaN(parsed) || parsed < 0) return
    onAdd({
      name: name.trim(),
      notes: notes.trim(),
      date: date || undefined,
      description: notes.trim(),
      numberOfPeople,
      price: parsed,
    })
    setName('')
    setNotes('')
    setDate('')
    setPeople('1')
    setPrice('')
  }

  return (
    <form className="add-form" onSubmit={handleSubmit} autoComplete="off">
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="activity-name">Activity</label>
          <input
            id="activity-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sagrada Família tour"
            required
          />
        </div>
        <div className="form-field form-field-wide">
          <label htmlFor="activity-notes">Notes</label>
          <input
            id="activity-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional details"
          />
        </div>
        <div className="form-field">
          <label htmlFor="activity-date">Date</label>
          <input
            id="activity-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <PeopleCountField id="activity-people" value={people} onChange={setPeople} />
        <div className="form-field">
          <label htmlFor="activity-price">Price per person ($)</label>
          <input
            id="activity-price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>
      </div>
      <button type="submit" className="btn btn-add">
        {addButtonLabel}
      </button>
    </form>
  )
}

function CruiseForm({
  addButtonLabel,
  onAdd,
}: {
  addButtonLabel: string
  onAdd: (item: AddPayload) => void
}) {
  const [cruiseLine, setCruiseLine] = useState('')
  const [destination, setDestination] = useState('')
  const [sailDate, setSailDate] = useState('')
  const [duration, setDuration] = useState('')
  const [people, setPeople] = useState('1')
  const [price, setPrice] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = parseFloat(price)
    const numberOfPeople = parsePeople(people)
    if (!cruiseLine.trim() || !destination.trim() || isNaN(parsed) || parsed < 0) return
    onAdd({
      name: cruiseLine.trim(),
      cruiseLine: cruiseLine.trim(),
      destination: destination.trim(),
      date: sailDate || undefined,
      duration: duration.trim() || undefined,
      description: [destination.trim(), duration.trim()].filter(Boolean).join(' · '),
      numberOfPeople,
      price: parsed,
    })
    setCruiseLine('')
    setDestination('')
    setSailDate('')
    setDuration('')
    setPeople('1')
    setPrice('')
  }

  return (
    <form className="add-form" onSubmit={handleSubmit} autoComplete="off">
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="cruise-line">Cruise Line</label>
          <input
            id="cruise-line"
            value={cruiseLine}
            onChange={(e) => setCruiseLine(e.target.value)}
            placeholder="e.g. Royal Caribbean"
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="cruise-destination">Destination</label>
          <input
            id="cruise-destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="e.g. Caribbean"
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="cruise-sail-date">Sail Date</label>
          <input
            id="cruise-sail-date"
            type="date"
            value={sailDate}
            onChange={(e) => setSailDate(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="cruise-duration">Duration</label>
          <input
            id="cruise-duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="e.g. 7 nights"
          />
        </div>
        <PeopleCountField id="cruise-people" value={people} onChange={setPeople} />
        <div className="form-field">
          <label htmlFor="cruise-price">Price per person ($)</label>
          <input
            id="cruise-price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>
      </div>
      <button type="submit" className="btn btn-add">
        {addButtonLabel}
      </button>
    </form>
  )
}

function CarRentalForm({
  addButtonLabel,
  onAdd,
}: {
  addButtonLabel: string
  onAdd: (item: AddPayload) => void
}) {
  const [rentalCompany, setRentalCompany] = useState('')
  const [city, setCity] = useState('')
  const [vehicleType, setVehicleType] = useState('')
  const [duration, setDuration] = useState('')
  const [price, setPrice] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = parseFloat(price)
    if (!rentalCompany.trim() || !city.trim() || isNaN(parsed) || parsed < 0) return
    onAdd({
      name: rentalCompany.trim(),
      rentalCompany: rentalCompany.trim(),
      city: city.trim(),
      vehicleType: vehicleType.trim() || undefined,
      duration: duration.trim() || undefined,
      description: [city.trim(), vehicleType.trim(), duration.trim()].filter(Boolean).join(' · '),
      price: parsed,
    })
    setRentalCompany('')
    setCity('')
    setVehicleType('')
    setDuration('')
    setPrice('')
  }

  return (
    <form className="add-form" onSubmit={handleSubmit} autoComplete="off">
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="car-rental-company">Rental Company</label>
          <input
            id="car-rental-company"
            value={rentalCompany}
            onChange={(e) => setRentalCompany(e.target.value)}
            placeholder="e.g. Hertz"
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="car-rental-city">City</label>
          <input
            id="car-rental-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Barcelona"
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="car-rental-vehicle">Vehicle Type</label>
          <input
            id="car-rental-vehicle"
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            placeholder="e.g. Compact SUV"
          />
        </div>
        <div className="form-field">
          <label htmlFor="car-rental-duration">Duration</label>
          <input
            id="car-rental-duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="e.g. 5 days"
          />
        </div>
        <div className="form-field">
          <label htmlFor="car-rental-price">Price ($)</label>
          <input
            id="car-rental-price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>
      </div>
      <button type="submit" className="btn btn-add">
        {addButtonLabel}
      </button>
    </form>
  )
}
