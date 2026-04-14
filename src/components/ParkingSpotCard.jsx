function ParkingSpotCard({ spot, isSelected, onSelect }) {
  let backgroundColor = 'var(--neutral)'
  let statusLabel = 'Speciale'
  let statusClass = 'status-neutral'

  if (spot.maintenance) {
    backgroundColor = 'var(--warning)'
    statusLabel = 'Manutenzione'
    statusClass = 'status-warning'
  } else if (spot.parking_type === 'disabled') {
    backgroundColor = 'var(--info)'
    statusLabel = 'Disabili'
    statusClass = 'status-info'
  } else if (spot.status === 'occupied') {
    backgroundColor = 'var(--danger)'
    statusLabel = 'Occupato'
    statusClass = 'status-danger'
  } else if (spot.status === 'free') {
    backgroundColor = 'var(--success)'
    statusLabel = 'Libero'
    statusClass = 'status-success'
  }

  const tooltipText = `${spot.id} • ${statusLabel} • ${spot.parking_type} • ${spot.cost}€/h`

  return (
    <button
      type="button"
      className={`spot-card spot-card-rich ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(spot)}
      title={tooltipText}
    >
      <span
        className="spot-card-status-strip"
        style={{ backgroundColor }}
        aria-hidden="true"
      />

      <div className="spot-card-head">
        <span className="spot-id">{spot.id}</span>
        <span className="spot-vehicle-icon" aria-hidden="true">
          {spot.parking_type === 'disabled'
            ? '♿'
            : spot.parking_type === 'electric'
            ? '🔌'
            : spot.vehicle_type === 'motorcycle'
            ? '🏍️'
            : spot.vehicle_type === 'van'
            ? '🚐'
            : '🚗'}
        </span>
      </div>

      <span className={`spot-status-badge ${statusClass}`}>
        {statusLabel}
      </span>

      <div className="spot-card-meta">
        <span>{spot.parking_type}</span>
        <span>{spot.cost} €/h</span>
      </div>
    </button>
  )
}

export default ParkingSpotCard