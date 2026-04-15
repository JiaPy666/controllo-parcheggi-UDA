function SidebarFilters({ filters, onFilterChange, onResetFilters }) {
  function handleChange(event) {
    const { name, value } = event.target
    onFilterChange(name, value)
  }

  return (
    <section className="sidebar-panel card">
      <div className="sidebar-header">
        <h2 className="section-title">Filtri</h2>
        <p className="muted-text">
          Filtra i posti per zona, stato, tipo di parcheggio e tipo di veicolo.
        </p>
      </div>

      <div className="filters-group">
        <label className="filter-field">
          <span className="filter-label">Zona</span>
          <select name="zone" value={filters.zone} onChange={handleChange}>
            <option value="">Tutte</option>
            <option value="A">Zona A</option>
            <option value="B">Zona B</option>
            <option value="C">Zona C</option>
            <option value="D">Zona D</option>
          </select>
        </label>

        <label className="filter-field">
          <span className="filter-label">Stato</span>
          <select name="status" value={filters.status} onChange={handleChange}>
            <option value="">Tutti</option>
            <option value="free">Libero</option>
            <option value="occupied">Occupato</option>
          </select>
        </label>

        <label className="filter-field">
          <span className="filter-label">Tipo parcheggio</span>
          <select
            name="parkingType"
            value={filters.parkingType}
            onChange={handleChange}
          >
            <option value="">Tutti</option>
            <option value="normal">Normale</option>
            <option value="disabled">Disabili</option>
            <option value="electric">Elettrico</option>
            <option value="motorcycle">Moto</option>
            <option value="van">Van</option>
          </select>
        </label>

        <label className="filter-field">
          <span className="filter-label">Tipo veicolo</span>
          <select
            name="vehicleType"
            value={filters.vehicleType}
            onChange={handleChange}
          >
            <option value="">Tutti</option>
            <option value="car">Auto</option>
            <option value="motorcycle">Moto</option>
            <option value="van">Van</option>
          </select>
        </label>

        <label className="filter-field">
          <span className="filter-label">Manutenzione</span>
          <select
            name="maintenance"
            value={filters.maintenance}
            onChange={handleChange}
          >
            <option value="">Tutti</option>
            <option value="true">Solo manutenzione</option>
            <option value="false">Escludi manutenzione</option>
          </select>
        </label>
      </div>

      <div className="sidebar-actions">
        <button type="button" className="btn-secondary" onClick={onResetFilters}>
          Reset filtri
        </button>
      </div>
    </section>
  )
}

export default SidebarFilters