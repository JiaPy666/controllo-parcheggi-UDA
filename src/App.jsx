import { useMemo, useState } from 'react'
import './App.css'
import mockSpots from './data/mockSpots'
import ParkingMapView from './components/ParkingMapView'
import AdminActions from './components/AdminActions'

function formatTipoPosto(tipo) {
  switch (tipo) {
    case 'disabili':
      return 'Disabili'
    case 'elettrico':
      return 'Elettrico'
    case 'moto':
      return 'Moto'
    case 'furgone':
      return 'Furgone'
    default:
      return 'Normale'
  }
}

function formatTipoVeicolo(tipo) {
  switch (tipo) {
    case 'moto':
      return 'Moto'
    case 'furgone':
      return 'Furgone'
    default:
      return 'Auto'
  }
}

function formatStato(spot) {
  if (spot.maintenance) return 'Manutenzione'
  if (spot.status === 'occupied') return 'Occupato'
  return 'Libero'
}

function getBadgeClass(spot) {
  if (spot.maintenance) return 'status-warning'
  if (spot.status === 'occupied') return 'status-danger'

  switch (spot.parkingtype) {
    case 'disabili':
      return 'status-info'
    case 'elettrico':
      return 'status-success'
    case 'moto':
      return 'status-info'
    case 'furgone':
      return 'status-warning'
    default:
      return 'status-success'
  }
}

function getVehicleIcon(spot) {
  if (spot.parkingtype === 'moto') return '🏍️'
  if (spot.parkingtype === 'furgone') return '🚐'
  if (spot.parkingtype === 'elettrico') return '⚡'
  if (spot.parkingtype === 'disabili') return '♿'
  return '🚗'
}

function getCurrentDateTime() {
  const now = new Date()
  return now.toLocaleString('it-IT')
}

function App() {
  const [spots, setSpots] = useState(mockSpots)
  const [selectedSpot, setSelectedSpot] = useState(null)
  const [editSpot, setEditSpot] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [zoneFilter, setZoneFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('overview')
  const [focusedZone, setFocusedZone] = useState('A')

  function matchesFilters(spot) {
    const matchStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'maintenance'
          ? spot.maintenance
          : spot.status === statusFilter && !spot.maintenance

    const matchType = typeFilter === 'all' ? true : spot.parkingtype === typeFilter
    const matchZone = zoneFilter === 'all' ? true : spot.zone === zoneFilter

    const search = searchTerm.trim().toLowerCase()
    const matchSearch = !search
      ? true
      : spot.id.toLowerCase().includes(search) ||
        spot.zone.toLowerCase().includes(search) ||
        spot.parkingtype.toLowerCase().includes(search)

    return matchStatus && matchType && matchZone && matchSearch
  }

  const filteredSpots = useMemo(() => {
    return spots.filter((spot) => matchesFilters(spot))
  }, [spots, statusFilter, typeFilter, zoneFilter, searchTerm])

  const stats = useMemo(() => {
    const total = spots.length
    const occupied = spots.filter((spot) => spot.status === 'occupied' && !spot.maintenance).length
    const free = spots.filter((spot) => spot.status === 'free' && !spot.maintenance).length
    const maintenance = spots.filter((spot) => spot.maintenance).length

    return { total, occupied, free, maintenance }
  }, [spots])

  const zoneSummary = useMemo(() => {
    return ['A', 'B', 'C', 'D'].map((zone) => {
      const zoneSpots = spots.filter((spot) => spot.zone === zone)

      return {
        zone,
        total: zoneSpots.length,
        occupied: zoneSpots.filter((spot) => spot.status === 'occupied' && !spot.maintenance).length,
        free: zoneSpots.filter((spot) => spot.status === 'free' && !spot.maintenance).length,
        maintenance: zoneSpots.filter((spot) => spot.maintenance).length,
      }
    })
  }, [spots])

  const listSpots = useMemo(() => {
    if (viewMode === 'focus') {
      return filteredSpots.filter((spot) => spot.zone === focusedZone)
    }

    return filteredSpots
  }, [filteredSpots, viewMode, focusedZone])

  function handleSpotClick(spot) {
    setSelectedSpot(spot)
    setEditSpot({
      ...spot,
      vehicletype: spot.vehicletype || 'auto',
    })
  }

  function handleZoneSelect(zone) {
    setFocusedZone(zone)
    setViewMode('focus')
    setSelectedSpot(null)
    setEditSpot(null)
  }

  function handleResetFilters() {
    setStatusFilter('all')
    setTypeFilter('all')
    setZoneFilter('all')
    setSearchTerm('')
    setViewMode('overview')
    setFocusedZone('A')
    setSelectedSpot(null)
    setEditSpot(null)
  }

  function handleEditChange(field, value) {
    setEditSpot((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  function handleMaintenanceChange(checked) {
    setEditSpot((prev) => ({
      ...prev,
      maintenance: checked,
      status: checked ? 'free' : prev.status,
    }))
  }

  function handleSaveSpot() {
    const updatedSpot = {
      ...editSpot,
      lastupdated: getCurrentDateTime(),
    }

    setSpots((prev) => prev.map((spot) => (spot.id === updatedSpot.id ? updatedSpot : spot)))
    setSelectedSpot(updatedSpot)
    setEditSpot(updatedSpot)
  }

  function handleExportJson() {
    const jsonString = JSON.stringify(spots, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'parking-spots.json'
    link.click()

    window.URL.revokeObjectURL(url)
  }

  function handleImportJson(parsedData) {
    if (!Array.isArray(parsedData)) {
      alert('Il file deve contenere un array JSON di posti.')
      return
    }

    setSpots(parsedData)
    setSelectedSpot(null)
    setEditSpot(null)
    setFocusedZone('A')
    setViewMode('overview')
    setSearchTerm('')
    setStatusFilter('all')
    setTypeFilter('all')
    setZoneFilter('all')

    alert('Importazione completata.')
  }

  function handleResetDataset() {
    const confirmReset = window.confirm('Vuoi davvero ripristinare il dataset iniziale del parcheggio?')
    if (!confirmReset) return

    setSpots(mockSpots)
    setSelectedSpot(null)
    setEditSpot(null)
    setFocusedZone('A')
    setViewMode('overview')
    setSearchTerm('')
    setStatusFilter('all')
    setTypeFilter('all')
    setZoneFilter('all')
  }

  function handleSimulateOccupancy() {
    setSpots((prevSpots) =>
      prevSpots.map((spot) => {
        const randomNumber = Math.random()
        const shouldToggleStatus = randomNumber > 0.82
        const shouldToggleMaintenance = randomNumber < 0.0001

        let nextStatus = spot.status
        let nextMaintenance = spot.maintenance

        if (shouldToggleStatus && !spot.maintenance) {
          nextStatus = spot.status === 'free' ? 'occupied' : 'free'
        }

        if (shouldToggleMaintenance) {
          nextMaintenance = !spot.maintenance
        }

        if (nextStatus !== spot.status || nextMaintenance !== spot.maintenance) {
          return {
            ...spot,
            status: nextStatus,
            maintenance: nextMaintenance,
            lastupdated: getCurrentDateTime(),
          }
        }

        return spot
      })
    )

    setSelectedSpot(null)
    setEditSpot(null)
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1 className="sidebar-title">Parcheggio Aeroporto</h1>
        <p className="sidebar-subtitle">
          Dashboard per controllare i posti, modificarli e visualizzare la disposizione del parcheggio.
        </p>

        <div className="sidebar-section">
          <label className="sidebar-label">Cerca posto</label>
          <div className="search-row" style={{ gridTemplateColumns: '1fr' }}>
            <input
              type="text"
              placeholder="Es. A001, B, electric..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>

        <div className="sidebar-section">
          <label className="sidebar-label">Stato</label>
          <select
            className="filter-control"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">Tutti</option>
            <option value="free">Liberi</option>
            <option value="occupied">Occupati</option>
            <option value="maintenance">Manutenzione</option>
          </select>
        </div>

        <div className="sidebar-section">
          <label className="sidebar-label">Tipo posto</label>
          <select
            className="filter-control"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            <option value="tutti">Tutti</option>
            <option value="normale">Normale</option>
            <option value="disabili">Disabili</option>
            <option value="elettrico">Elettrico</option>
            <option value="moto">Moto</option>
            <option value="vfurgonean">Furgone</option>
          </select>
        </div>

        <div className="sidebar-section">
          <label className="sidebar-label">Zona filtro</label>
          <select
            className="filter-control"
            value={zoneFilter}
            onChange={(event) => setZoneFilter(event.target.value)}
          >
            <option value="all">Tutte</option>
            <option value="A">Zona A</option>
            <option value="B">Zona B</option>
            <option value="C">Zona C</option>
            <option value="D">Zona D</option>
          </select>
        </div>

        <div className="sidebar-section">
          <label className="sidebar-label">Accesso rapido zone</label>
          <div className="zone-tabs">
            {['A', 'B', 'C', 'D'].map((zone) => (
              <button
                key={zone}
                type="button"
                className={`zone-tab ${focusedZone === zone ? 'active' : ''}`}
                onClick={() => handleZoneSelect(zone)}
              >
                Zona {zone}
              </button>
            ))}
          </div>
        </div>

        <div className="sidebar-section">
          <button type="button" className="btn-secondary" onClick={handleResetFilters}>
            Reimposta filtri
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="dashboard-stack">
          <section className="panel header-panel">
            <div>
              <h2 className="page-title">Controllo Parcheggio Aeroporto</h2>
              <p className="muted-text">
                Vista generale del parcheggio con zone, dettagli dei posti e modifica diretta delle impostazioni.
              </p>
            </div>

            <div className="header-actions">
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === 'overview' ? 'active' : ''}`}
                onClick={() => setViewMode('overview')}
              >
                Vista generale
              </button>
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === 'focus' ? 'active' : ''}`}
                onClick={() => setViewMode('focus')}
              >
                Vista zona
              </button>
            </div>
          </section>

          <section className="stats-grid">
            <div className="card stat-card stat-total">
              <div className="stat-card-top">
                <div className="stat-icon">🅿️</div>
                <div className="stat-caption">Posti totali</div>
              </div>
              <div className="stat-value">{stats.total}</div>
              <p className="muted-text">Numero complessivo dei posti presenti nel sistema.</p>
            </div>

            <div className="card stat-card stat-free">
              <div className="stat-card-top">
                <div className="stat-icon">✅</div>
                <div className="stat-caption">Posti liberi</div>
              </div>
              <div className="stat-value">{stats.free}</div>
              <p className="muted-text">Posti disponibili e prenotabili in questo momento.</p>
            </div>

            <div className="card stat-card stat-occupied">
              <div className="stat-card-top">
                <div className="stat-icon">🚘</div>
                <div className="stat-caption">Posti occupati</div>
              </div>
              <div className="stat-value">{stats.occupied}</div>
              <p className="muted-text">Posti attualmente occupati da un veicolo.</p>
            </div>

            <div className="card stat-card stat-maintenance">
              <div className="stat-card-top">
                <div className="stat-icon">🛠️</div>
                <div className="stat-caption">In manutenzione</div>
              </div>
              <div className="stat-value">{stats.maintenance}</div>
              <p className="muted-text">Posti temporaneamente non utilizzabili.</p>
            </div>
          </section>

          <AdminActions
            onExportJson={handleExportJson}
            onImportJson={handleImportJson}
            onResetDataset={handleResetDataset}
            onSimulateOccupancy={handleSimulateOccupancy}
          />

          <section className="panel">
            <div className="summary-header">
              <div>
                <h3 className="section-title">Riepilogo zone</h3>
                <p className="muted-text">
                  Ogni zona mostra capacità totale, posti liberi, occupati e manutenzione.
                </p>
              </div>
            </div>

            <div className="zone-summary-grid">
              {zoneSummary.map((zone) => {
                const occupancy = zone.total > 0 ? Math.round((zone.occupied / zone.total) * 100) : 0

                return (
                  <button
                    key={zone.zone}
                    type="button"
                    className={`zone-summary-card ${focusedZone === zone.zone ? 'active' : ''}`}
                    onClick={() => handleZoneSelect(zone.zone)}
                  >
                    <div className="zone-summary-top">
                      <div>
                        <span className="zone-badge">Zona {zone.zone}</span>
                        <h3 style={{ margin: 0 }}>Area {zone.zone}</h3>
                      </div>
                      <span className="occupancy-pill">{occupancy}% occupata</span>
                    </div>

                    <div className="zone-summary-stats">
                      <div>
                        <span className="summary-label">Totali</span>
                        <strong>{zone.total}</strong>
                      </div>
                      <div>
                        <span className="summary-label">Liberi</span>
                        <strong>{zone.free}</strong>
                      </div>
                      <div>
                        <span className="summary-label">Occupati</span>
                        <strong>{zone.occupied}</strong>
                      </div>
                      <div>
                        <span className="summary-label">Manutenzione</span>
                        <strong>{zone.maintenance}</strong>
                      </div>
                    </div>

                    <div className="occupancy-bar">
                      <div
                        className="occupancy-bar-fill"
                        style={{ width: `${occupancy}%` }}
                      />
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="panel">
            <div className="map-header">
              <div>
                <h3 className="section-title">Mappa interattiva del parcheggio</h3>
                <p className="muted-text">
                  Clicca un posto per vedere e modificare le sue impostazioni.
                </p>
              </div>

              <div className="view-toggle">
                <button
                  type="button"
                  className={`view-toggle-btn ${viewMode === 'overview' ? 'active' : ''}`}
                  onClick={() => setViewMode('overview')}
                >
                  Vista generale
                </button>
                <button
                  type="button"
                  className={`view-toggle-btn ${viewMode === 'focus' ? 'active' : ''}`}
                  onClick={() => setViewMode('focus')}
                >
                  Focus zona {focusedZone}
                </button>
              </div>
            </div>

            <ParkingMapView
              spots={spots}
              selectedSpot={selectedSpot}
              onSpotClick={handleSpotClick}
              zoneSummary={zoneSummary}
              selectedZone={viewMode === 'focus' ? focusedZone : 'all'}
              viewMode={viewMode}
              matchesFilters={matchesFilters}
            />
          </section>

          <section className="panel">
            <div className="summary-header">
              <div>
                <h3 className="section-title">Elenco posti filtrati</h3>
                <p className="muted-text">Lista dei posti in base ai filtri selezionati.</p>
              </div>
              <div className="occupancy-pill">{listSpots.length} risultati</div>
            </div>

            <div className="parking-grid">
              {listSpots.map((spot) => (
                <button
                  key={spot.id}
                  type="button"
                  className={`spot-card ${selectedSpot?.id === spot.id ? 'selected' : ''}`}
                  onClick={() => handleSpotClick(spot)}
                >
                  <div className="spot-card-rich">
                    <div
                      className="spot-card-status-strip"
                      style={{
                        background: spot.maintenance
                          ? '#facc15'
                          : spot.status === 'occupied'
                            ? '#ef4444'
                            : '#22c55e',
                      }}
                    />

                    <div className="spot-card-head">
                      <div className="spot-id">{spot.id}</div>
                      <div className="spot-vehicle-icon">{getVehicleIcon(spot)}</div>
                    </div>

                    <div className={`spot-status-badge ${getBadgeClass(spot)}`}>
                      {formatStato(spot)}
                    </div>

                    <div className="spot-card-meta">
                      <span>Zona {spot.zone}</span>
                      <span>{spot.cost}€/h</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>

      {editSpot && (
        <div className="modal-overlay" onClick={() => setEditSpot(null)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="zone-badge">Zona {editSpot.zone}</span>
                <h3 className="section-title" style={{ marginBottom: 6 }}>
                  Modifica posto {editSpot.id}
                </h3>
                <p className="muted-text">
                  Qui puoi cambiare le impostazioni del posto selezionato.
                </p>
              </div>

              <button type="button" className="btn-secondary" onClick={() => setEditSpot(null)}>
                Chiudi
              </button>
            </div>

            <div className="modal-grid">
              <div className="update-box">
                <label className="modal-label">ID posto</label>
                <input value={editSpot.id} readOnly />
              </div>

              <div className="update-box">
                <label className="modal-label">Zona</label>
                <select
                  value={editSpot.zone}
                  onChange={(event) => handleEditChange('zone', event.target.value)}
                >
                  <option value="A">Zona A</option>
                  <option value="B">Zona B</option>
                  <option value="C">Zona C</option>
                  <option value="D">Zona D</option>
                </select>
              </div>

              <div className="update-box">
                <label className="modal-label">Stato</label>
                <select
                  value={editSpot.status}
                  onChange={(event) => handleEditChange('status', event.target.value)}
                  disabled={editSpot.maintenance}
                >
                  <option value="free">Libero</option>
                  <option value="occupied">Occupato</option>
                </select>
              </div>

              <div className="update-box">
                <label className="modal-label">Tipo posto</label>
                <select
                  value={editSpot.parkingtype}
                  onChange={(event) => handleEditChange('parkingtype', event.target.value)}
                >
                  <option value="normale">Normale</option>
                  <option value="disabili">Disabili</option>
                  <option value="elettrico">Elettrico</option>
                  <option value="moto">Moto</option>
                  <option value="furgone">Furgone</option>
                </select>
              </div>

              <div className="update-box">
                <label className="modal-label">Tipo veicolo</label>
                <select
                  value={editSpot.vehicletype}
                  onChange={(event) => handleEditChange('vehicletype', event.target.value)}
                >
                  <option value="auto">Auto</option>
                  <option value="moto">Moto</option>
                  <option value="furgone">Furgone</option>
                </select>
              </div>

              <div className="update-box">
                <label className="modal-label">Costo orario</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={editSpot.cost}
                  onChange={(event) => handleEditChange('cost', Number(event.target.value))}
                />
              </div>

              <div className="update-box">
                <label className="modal-label">Ultimo aggiornamento</label>
                <input value={editSpot.lastupdated} readOnly />
              </div>

              <div className="maintenance-box">
                <label className="modal-label">Manutenzione</label>
                <div className="maintenance-toggle">
                  <input
                    type="checkbox"
                    checked={editSpot.maintenance}
                    onChange={(event) => handleMaintenanceChange(event.target.checked)}
                  />
                  <span>{editSpot.maintenance ? 'Posto in manutenzione' : 'Posto operativo'}</span>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setEditSpot(null)}>
                Annulla
              </button>
              <button type="button" className="btn-primary" onClick={handleSaveSpot}>
                Salva modifiche
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App