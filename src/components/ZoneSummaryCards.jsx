function ZoneSummaryCards({ zoneSummary, selectedZone, onSelectZone }) {
  function getOccupancyRate(item) {
    const total = item.free + item.occupied
    if (!total) return 0
    return Math.round((item.occupied / total) * 100)
  }

  return (
    <section className="card">
      <div className="summary-header">
        <div>
          <h2 className="section-title">Riepilogo zone</h2>
          <p className="muted-text">
            Panoramica rapida delle quattro aree del parcheggio con livello di
            occupazione e accesso rapido.
          </p>
        </div>
      </div>

      <div className="zone-summary-grid">
        {zoneSummary.map((item) => {
          const occupancyRate = getOccupancyRate(item)
          const isActive = selectedZone === item.zone

          return (
            <button
              key={item.zone}
              type="button"
              className={`zone-summary-card card ${isActive ? 'active' : ''}`}
              onClick={() => onSelectZone(item.zone)}
            >
              <div className="zone-summary-top">
                <div>
                  <span className="zone-badge">Zona {item.zone}</span>
                  <h3>Area {item.zone}</h3>
                </div>

                <span className="occupancy-pill">{occupancyRate}% occupata</span>
              </div>

              <div className="zone-summary-stats">
                <div>
                  <span className="summary-label">Liberi</span>
                  <strong>{item.free}</strong>
                </div>

                <div>
                  <span className="summary-label">Occupati</span>
                  <strong>{item.occupied}</strong>
                </div>
              </div>

              <div className="occupancy-bar" aria-hidden="true">
                <div
                  className="occupancy-bar-fill"
                  style={{ width: `${occupancyRate}%` }}
                />
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default ZoneSummaryCards