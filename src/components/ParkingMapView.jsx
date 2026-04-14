function getSpotColor(spot, isMatch = true) {
  if (!isMatch) return '#d1d5db'
  if (spot.maintenance) return 'var(--warning)'
  if (spot.parking_type === 'disabled') return 'var(--info)'
  if (spot.status === 'occupied') return 'var(--danger)'
  if (spot.status === 'free') return 'var(--success)'
  return 'var(--neutral)'
}

function getZoneStats(zoneSummary, zone) {
  return zoneSummary.find((item) => item.zone === zone)
}

function chunkArray(array, size) {
  const result = []
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size))
  }
  return result
}

function SpotInfoPanel({ spot }) {
  if (!spot) {
    return (
      <div className="panel">
        <h3 className="section-title">Dettaglio posto selezionato</h3>
        <p className="muted-text">
          Clicca un posto nella mappa per vedere qui le informazioni del veicolo e del posto.
        </p>
      </div>
    )
  }

  return (
    <div className="panel">
      <h3 className="section-title">Dettaglio posto selezionato</h3>
      <div className="zone-summary-stats">
        <div><span className="summary-label">Codice</span><strong>{spot.id}</strong></div>
        <div><span className="summary-label">Zona</span><strong>{spot.zone}</strong></div>
        <div><span className="summary-label">Stato</span><strong>{spot.maintenance ? 'Manutenzione' : spot.status === 'occupied' ? 'Occupato' : 'Libero'}</strong></div>
        <div><span className="summary-label">Tipo posto</span><strong>{spot.parking_type}</strong></div>
        <div><span className="summary-label">Tipo veicolo</span><strong>{spot.vehicle_type}</strong></div>
        <div><span className="summary-label">Costo</span><strong>{spot.cost} €</strong></div>
        <div><span className="summary-label">Ultimo aggiornamento</span><strong>{spot.last_updated || 'N/D'}</strong></div>
      </div>
    </div>
  )
}

function ZoneMiniLayout({
  zone,
  zoneSpots,
  stats,
  selectedSpot,
  matchesFilters,
  onSelectSpot,
  onOpenZone,
  compact = false,
}) {
  const safeMatchesFilters =
    typeof matchesFilters === 'function' ? matchesFilters : () => true

  const rows = chunkArray(zoneSpots, 10)
  const rowPairs = chunkArray(rows, 2)

  return (
    <div className={`map-zone-card active ${compact ? 'overview-zone-card' : ''}`}>
      <div className="map-zone-header">
        <div>
          <span className="zone-badge">Zona {zone}</span>
          <h3 style={{ margin: '0 0 6px 0' }}>Area {zone}</h3>
          <p className="muted-text" style={{ marginBottom: 0 }}>
            {stats ? `${stats.free} liberi · ${stats.occupied} occupati` : 'Nessun dato'}
          </p>
        </div>

        {compact ? (
          <button
            type="button"
            className="zone-open-btn"
            onClick={() => onOpenZone(zone)}
          >
            Apri
          </button>
        ) : (
          <span className="zone-open-label">Zona attiva</span>
        )}
      </div>

      <div className={`parking-zone-realistic ${compact ? 'parking-zone-compact' : ''}`}>
        {rowPairs.map((pair, pairIndex) => (
          <div key={`${zone}-pair-${pairIndex}`} className="parking-pair-block">
            {pair.map((row, rowIndex) => {
              const leftSide = row.slice(0, 5)
              const rightSide = row.slice(5, 10)

              return (
                <div
                  key={`${zone}-row-${pairIndex}-${rowIndex}`}
                  className={`parking-row-sides ${compact ? 'parking-row-sides-compact' : ''}`}
                >
                  <div className={`parking-side-grid ${compact ? 'parking-side-grid-compact' : ''}`}>
                    {leftSide.map((spot) => {
                      const isSelected = selectedSpot?.id === spot.id
                      const isMatch = safeMatchesFilters(spot)

                      return (
                        <button
                          key={spot.id}
                          type="button"
                          className={`map-spot parking-spot ${compact ? 'parking-spot-compact' : ''} ${isSelected ? 'selected' : ''} ${!isMatch ? 'spot-unavailable' : ''}`}
                          style={{ background: getSpotColor(spot, isMatch) }}
                          onClick={() => onSelectSpot(spot)}
                          title={spot.id}
                        >
                          <span className="map-spot-code">
                            {compact ? spot.id.replace(zone, '') : spot.id}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  <div className={`parking-road-vertical continuous-road ${compact ? 'continuous-road-compact' : ''}`}>
                    <span>{compact ? '' : 'VIA'}</span>
                  </div>

                  <div className={`parking-side-grid ${compact ? 'parking-side-grid-compact' : ''}`}>
                    {rightSide.map((spot) => {
                      const isSelected = selectedSpot?.id === spot.id
                      const isMatch = safeMatchesFilters(spot)

                      return (
                        <button
                          key={spot.id}
                          type="button"
                          className={`map-spot parking-spot ${compact ? 'parking-spot-compact' : ''} ${isSelected ? 'selected' : ''} ${!isMatch ? 'spot-unavailable' : ''}`}
                          style={{ background: getSpotColor(spot, isMatch) }}
                          onClick={() => onSelectSpot(spot)}
                          title={spot.id}
                        >
                          <span className="map-spot-code">
                            {compact ? spot.id.replace(zone, '') : spot.id}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            <div className={`parking-road-horizontal major-road ${compact ? 'major-road-compact' : ''}`}>
              <span>{compact ? '' : 'Strada di collegamento'}</span>
            </div>
          </div>
        ))}

        <div className={`focus-main-road ${compact ? 'focus-main-road-compact' : ''}`}>
          <span>{compact ? '' : 'Tutte le corsie confluiscono nell’uscita unica'}</span>
        </div>
      </div>
    </div>
  )
}

function ParkingMapView({
  spots,
  zoneSummary,
  selectedZone,
  selectedSpot,
  onSpotClick,
  viewMode,
  matchesFilters,
}) {
  const zones = ['A', 'B', 'C', 'D']
  const isOverview = viewMode === 'overview'

  function handleOpenZone(zone) {
    const button = document.querySelectorAll('.zone-tab')
    const zoneMap = { A: 0, B: 1, C: 2, D: 3 }
    button[zoneMap[zone]]?.click()
  }

  return (
    <section className="panel">
      <div className="map-header">
        <div>
          <h2 className="section-title">Mappa interattiva del parcheggio</h2>
          <p className="muted-text">
            Clicca un posto per vedere e modificare le sue impostazioni.
          </p>
        </div>
      </div>

      <div className="airport-map">
        <div className="terminal-block">
          <div className="terminal-icon">T</div>
          <div>
            <h3 style={{ marginBottom: '6px' }}>Planimetria parcheggio</h3>
            <p className="muted-text">
              I filtri mantengono la griglia fissa e rendono grigi i posti esclusi.
            </p>
          </div>
        </div>

        <div className="entry-exit-row">
          <div className="entry-gate">Ingresso</div>
          <div className="main-lane">Strada principale</div>
          <div className="exit-gate">Uscita unica</div>
        </div>

        {isOverview ? (
          <div className="overview-master-grid">
            {zones.map((zone) => (
              <ZoneMiniLayout
                key={zone}
                zone={zone}
                zoneSpots={spots.filter((spot) => spot.zone === zone)}
                stats={getZoneStats(zoneSummary, zone)}
                selectedSpot={selectedSpot}
                matchesFilters={matchesFilters}
                onSelectSpot={onSpotClick}
                onOpenZone={handleOpenZone}
                compact
              />
            ))}
          </div>
        ) : (
          <>
            <ZoneMiniLayout
              zone={selectedZone}
              zoneSpots={spots.filter((spot) => spot.zone === selectedZone)}
              stats={getZoneStats(zoneSummary, selectedZone)}
              selectedSpot={selectedSpot}
              matchesFilters={matchesFilters}
              onSelectSpot={onSpotClick}
              compact={false}
            />

            <SpotInfoPanel spot={selectedSpot} />
          </>
        )}
      </div>
    </section>
  )
}

export default ParkingMapView