import { useMemo, useState, useEffect } from 'react'
import './App.css'
import mockSpots from './data/mockSpots'
import ParkingMapView from './components/ParkingMapView'
import AdminActions from './components/AdminActions'
import { updateSpot } from './services/api.js'


function formatStato(spot) {
  if (spot.maintenance) return 'Manutenzione'
  if (spot.status === 'occupied') return 'Occupato'
  return 'Libero'
}

// ✅ CORRETTO - usa parking_type e valori inglesi del DB
function getBadgeClass(spot) {
  if (spot.maintenance) return 'status-warning'
  if (spot.status === 'occupied') return 'status-danger'

  switch (spot.parking_type) {
    case 'disabled':    return 'status-info'
    case 'electric':    return 'status-success'
    case 'motorcycle':  return 'status-warning'
    case 'van':         return 'status-warning'
    default:            return 'status-success'
  }
}

function getVehicleIcon(spot) {
  if (spot.parking_type === 'motorcycle') return '🏍️'
  if (spot.parking_type === 'van')        return '🚐'
  if (spot.parking_type === 'electric')   return '⚡'
  if (spot.parking_type === 'disabled')   return '♿'
  return '🚗'
}

function getCurrentDateTime() {
  const now = new Date()
  return now.toLocaleString('it-IT')
}

function App() {
  const [spots, setSpots] = useState([])
  const [loading, setLoading] = useState(true)

  // Aggiungi questo blocco per scaricare i dati dal DB
  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/spots")
      .then(res => res.json())
      .then(data => {
        setSpots(data);
        setLoading(false);
      })
      .catch(err => console.error("Errore caricamento:", err));
  }, []);
  
  const [selectedSpot, setSelectedSpot] = useState(null)
  const [editSpot, setEditSpot] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [zoneFilter, setZoneFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('overview')
  const [focusedZone, setFocusedZone] = useState('A')

  function matchesFilters(spot) {
    // Filtro stato
    if (statusFilter !== 'all') {
      if (statusFilter === 'maintenance' && !spot.maintenance) return false;
      if (statusFilter === 'occupied' && (spot.maintenance || spot.status !== 'occupied')) return false;
      if (statusFilter === 'free' && (spot.maintenance || spot.status !== 'free')) return false;
    }

    // Filtro tipo parcheggio
    if (typeFilter !== 'all' && spot.parking_type !== typeFilter) return false;

    // Filtro zona
    if (zoneFilter !== 'all' && spot.zone !== zoneFilter) return false;

    // Filtro ricerca testo
    if (searchTerm) {
      const idMatch = spot.id && spot.id.toLowerCase().includes(searchTerm.toLowerCase());
      const typeMatch = spot.parking_type && spot.parking_type.toLowerCase().includes(searchTerm.toLowerCase());
      if (!idMatch && !typeMatch) return false;
    }

    return true;
  }

  const filteredSpots = useMemo(() => {
    if (!spots) return [];
    return spots.filter(matchesFilters);
  }, [spots, searchTerm, statusFilter, typeFilter, zoneFilter]);

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

  async function handleSaveSpot(updatedData) {
    try {
      const result = await updateSpot(updatedData.id, updatedData);
      // Aggiorna lo stato locale con il last_updated che arriva dal server
      const updatedSpot = { ...updatedData, last_updated: result.last_updated };
      setSpots((prev) =>
        prev.map((spot) => (spot.id === updatedSpot.id ? updatedSpot : spot))
      );
      setSelectedSpot(updatedSpot);
      setEditSpot(null);
    } catch (err) {
      console.error("Errore salvataggio:", err);
      alert("Salvataggio fallito: " + err.message);
    }
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
            last_updated: getCurrentDateTime(),
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
            <option value="all">Tutti</option>
            <option value="normal">Normale</option>
            <option value="disabled">Disabili</option>
            <option value="electric">Elettrico</option>
            <option value="motorcycle">Moto</option>
            <option value="van">Furgone</option>
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
                  value={editSpot.parking_type}
                  onChange={(event) => handleEditChange('parking_type', event.target.value)}
                >
                  <option value="normal">Normale</option>
                  <option value="disabled">Disabili</option>
                  <option value="electric">Elettrico</option>
                  <option value="motorcycle">Moto</option>
                  <option value="van">Furgone</option>
                </select>
              </div>

              <div className="update-box">
                <label className="modal-label">Tipo veicolo</label>
                <select
                  value={editSpot.vehicle_type}
                  onChange={(event) => handleEditChange('vehicle_type', event.target.value)}
                >
                  <option value="car">Auto</option>
                  <option value="motorcycle">Moto</option>
                  <option value="van">Furgone</option>
                </select>
              </div>

              <div className="update-box">
                <label className="modal-label">Costo orario</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={editSpot.cost ?? 0}
                  onChange={(event) => handleEditChange('cost', Number(event.target.value))}
                />
              </div>

              <div className="update-box">
                <label className="modal-label">Ultimo aggiornamento</label>
                <input value={editSpot.last_updated || ''} readOnly />
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
              <button type="button" className="btn-primary" onClick={() => handleSaveSpot(editSpot)}>
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