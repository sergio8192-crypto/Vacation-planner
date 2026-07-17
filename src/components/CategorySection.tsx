import { useState, type FormEvent } from 'react'
import type { OptionCategory, OptionItem } from '../types'
import { formatCurrency } from '../utils/format'
import { getOptionMeta, getOptionPriceLabel } from '../utils/optionDisplay'

type AddPayload = Omit<OptionItem, 'id'>

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
    case 'groundTransport':
      return <TransitForm addButtonLabel={addButtonLabel} onAdd={onAdd} />
    case 'activities':
      return <ActivityForm addButtonLabel={addButtonLabel} onAdd={onAdd} />
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
  const [price, setPrice] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = parseFloat(price)
    if (!name.trim() || isNaN(parsed) || parsed < 0) return
    onAdd({
      name: name.trim(),
      route: route.trim(),
      description: route.trim(),
      price: parsed,
    })
    setName('')
    setRoute('')
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
          <label htmlFor="flight-price">Price ($)</label>
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
  const [nights, setNights] = useState('3')
  const [pricePerNight, setPricePerNight] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const nightsNum = parseInt(nights, 10)
    const perNight = parseFloat(pricePerNight)
    if (!name.trim() || isNaN(nightsNum) || nightsNum < 1 || isNaN(perNight) || perNight < 0) return
    onAdd({
      name: name.trim(),
      nights: nightsNum,
      pricePerNight: perNight,
      price: nightsNum * perNight,
      description: `${nightsNum} night${nightsNum === 1 ? '' : 's'} · ${formatCurrency(perNight)}/night`,
    })
    setName('')
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
  const [price, setPrice] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = parseFloat(price)
    if (!name.trim() || isNaN(parsed) || parsed < 0) return
    const routeText = route.trim()
    onAdd({
      name: name.trim(),
      mode,
      route: routeText,
      description: [mode, routeText].filter(Boolean).join(' · '),
      price: parsed,
    })
    setName('')
    setMode('Train')
    setRoute('')
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
          <label htmlFor="transit-price">Price ($)</label>
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
  const [price, setPrice] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = parseFloat(price)
    if (!name.trim() || isNaN(parsed) || parsed < 0) return
    onAdd({
      name: name.trim(),
      notes: notes.trim(),
      description: notes.trim(),
      price: parsed,
    })
    setName('')
    setNotes('')
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
          <label htmlFor="activity-price">Price ($)</label>
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
