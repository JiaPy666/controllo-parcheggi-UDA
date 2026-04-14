function ZoneMiniMap({ zones, selectedZone, onSelectZone }) {
  function getZoneDescription(zone) {
    if (zone === 'A') return 'Area premium vicino al terminal'
    if (zone === 'B') return 'Area medio-alta coperta'
    if (zone === 'C') return 'Area standard per soste ordinarie'
    return 'Area economica lunga sosta'
  }

  return (
    <section className="card">
      <div className="summary-header">
        <div>
          <h2 className="section-title">Mini mappa zone</h2>
          <p className="muted-text">
            Seleziona rapidamente una zona del parcheggio aeroportuale per vedere il
            dettaglio dei posti disponibili, occupati o in manutenzione.
          </p>
        </div>
      </div>

      <div className="mini-map">
        {zones.map((zoneItem) => {
          const isActive = selectedZone === zoneItem.zone

          return (
            <button
              key={zoneItem.zone}
              type="button"
              className={`mini-zone-card ${isActive ? 'active' : ''}`}
              onClick={() => onSelectZone(zoneItem.zone)}
              aria-pressed={isActive}
            >
              <span className="zone-badge">Zona {zoneItem.zone}</span>
              <strong>Area {zoneItem.zone}</strong>
              <span className="muted-text">
                {getZoneDescription(zoneItem.zone)}
              </span>
              <span className="occupancy-pill">
                {zoneItem.free} liberi / {zoneItem.occupied} occupati
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default ZoneMiniMap