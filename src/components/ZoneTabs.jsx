function ZoneTabs({ selectedZone, onSelectZone }) {
  const tabs = ['all', 'A', 'B', 'C', 'D']

  function getLabel(zone) {
    if (zone === 'all') return 'Tutte'
    return `Zona ${zone}`
  }

  return (
    <section className="panel">
      <div className="summary-header">
        <div>
          <h2 className="section-title">Selezione zona</h2>
          <p className="muted-text">
            Scegli una vista generale oppure entra in una singola zona del parcheggio.
          </p>
        </div>
      </div>

      <div className="zone-tabs">
        {tabs.map((zone) => (
          <button
            key={zone}
            type="button"
            className={`zone-tab ${selectedZone === zone ? 'active' : ''}`}
            onClick={() => onSelectZone(zone)}
          >
            {getLabel(zone)}
          </button>
        ))}
      </div>
    </section>
  )
}

export default ZoneTabs