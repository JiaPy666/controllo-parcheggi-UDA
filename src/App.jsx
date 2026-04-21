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

function getBadgeClass(spot) {
  if (spot.maintenance) return 'status-warning'
  if (spot.status === 'occupied') return 'status-danger'

  switch (spot.parking_type) {
    case 'disabled':
      return 'status-info'
    case 'electric':
      return 'status-success'
    case 'motorcycle':
      return 'status-info'
    case 'van':
      return 'status-warning'
    default:
      return 'status-success'
  }
}

function getVehicleIcon(spot) {
  if (spot.parking_type === 'motorcycle') return '🏍️'
  if (spot.parking_type === 'van') return '🚐'
  if (spot.parking_type === 'electric') return '⚡'
  if (spot.parking_type === 'disabled') return '♿'
  return '🚗'
}

function getCurrentDateTime() {
  const now = new Date()
  return now.toLocaleString('it-IT')
}

function App({ user, onLogout }) {
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
  const [adminView, setAdminView] = useState('dashboard') // 'dashboard' | 'bookings'
  const [bookings, setBookings] = useState([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [bookingSearch, setBookingSearch] = useState('')
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all')
  const [focusedZone, setFocusedZone] = useState('A')

  function matchesFilters(spot) {
    // Filtro stato
    if (statusFilter !== 'all') {
      if (statusFilter === 'maintenance' && !spot.maintenance) return false
      if (statusFilter === 'occupied' && (spot.maintenance || spot.status !== 'occupied')) return false
      if (statusFilter === 'free' && (spot.maintenance || spot.status !== 'free')) return false
    }
    // Filtro tipo
    if (typeFilter !== 'all' && spot.parking_type !== typeFilter) return false
    // Filtro zona
    if (zoneFilter !== 'all' && spot.zone !== zoneFilter) return false
    // Ricerca testo
    if (searchTerm) {
      const s = searchTerm.toLowerCase()
      const idMatch = spot.id && spot.id.toLowerCase().includes(s)
      const typeMatch = spot.parking_type && spot.parking_type.toLowerCase().includes(s)
      if (!idMatch && !typeMatch) return false
    }
    return true
  }

  const filteredSpots = useMemo(() => {
    if (!spots) return []
    return spots.filter(matchesFilters)
  }, [spots, searchTerm, statusFilter, typeFilter, zoneFilter])
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
      vehicle_type: spot.vehicle_type || 'car',
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

  async function fetchBookings() {
    setBookingsLoading(true)
    try {
      const res = await fetch('http://127.0.0.1:5000/api/bookings')
      const data = await res.json()
      setBookings(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Errore caricamento prenotazioni:', e)
    } finally {
      setBookingsLoading(false)
    }
  }

  useEffect(() => {
    if (adminView === 'bookings') fetchBookings()
  }, [adminView])

  async function handleAdminCancelBooking(bookingId) {
    if (!confirm('Annullare questa prenotazione?')) return
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/bookings/${bookingId}/cancel`, { method: 'POST' })
      if (res.ok) {
        showAdminNotif('🗑 Prenotazione annullata')
        fetchBookings()
        // Aggiorna anche i posti
        fetch('http://127.0.0.1:5000/api/spots').then(r => r.json()).then(setSpots)
      }
    } catch (e) { showAdminNotif('❌ Errore di rete', 'error') }
  }

  async function handleAdminDownloadPDF(booking) {
    const { jsPDF } = await import('jspdf')
    const QRCode = await import('qrcode')
    const doc = new jsPDF()
    const bookingCode = booking.booking_code
    const qrData = `Codice: ${bookingCode} | Posto: ${booking.spot_id} | Zona: ${booking.zone} | Utente: ${booking.user_name || ''} | Inizio: ${booking.start_time} | Fine: ${booking.end_time}`
    const qrDataUrl = await QRCode.toDataURL(qrData, { width: 200, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } })
    doc.setFillColor(15, 23, 42); doc.rect(0, 0, 210, 40, 'F')
    doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.setFont('helvetica', 'bold')
    doc.text('Prenotazione Parcheggio', 14, 18)
    doc.setFontSize(11); doc.setFont('helvetica', 'normal')
    doc.text('Aeroporto UDA — Copia Amministratore', 14, 30)
    doc.setFillColor(37, 99, 235); doc.roundedRect(14, 48, 182, 22, 4, 4, 'F')
    doc.setTextColor(255, 255, 255); doc.setFontSize(16); doc.setFont('helvetica', 'bold')
    doc.text(`Codice: ${bookingCode}`, 105, 63, { align: 'center' })
    doc.setTextColor(15, 23, 42); doc.setFontSize(11)
    const rows = [
      ['Utente', booking.user_name || 'N/D'], ['Email', booking.user_email || 'N/D'],
      ['Targa', booking.user_plate || 'N/D'], ['Posto', booking.spot_id],
      ['Zona', `Zona ${booking.zone}`], ['Tipo', booking.parking_type],
      ['Costo/ora', `€ ${booking.hourly_cost}`], ['Inizio', booking.start_time],
      ['Fine', booking.end_time], ['Durata', booking.duration_hours + ' ore'],
      ['Totale', `€ ${Number(booking.total_cost).toFixed(2)}`],
      ['Stato', booking.status === 'active' ? 'Attiva' : booking.status === 'cancelled' ? 'Annullata' : 'Conclusa'],
    ]
    let y = 82
    rows.forEach(([label, value], i) => {
      if (i % 2 === 0) { doc.setFillColor(248, 251, 255); doc.rect(14, y - 5, 120, 12, 'F') }
      doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139); doc.text(label, 18, y + 3)
      doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42); doc.text(String(value || ''), 62, y + 3)
      y += 13
    })
    doc.addImage(qrDataUrl, 'PNG', 142, 80, 55, 55)
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139)
    doc.text('Scansiona per verificare', 169.5, 141, { align: 'center' })
    doc.setFillColor(248, 251, 255); doc.rect(0, 270, 210, 27, 'F')
    doc.setFontSize(9); doc.setTextColor(100, 116, 139)
    doc.text(`Generato il ${new Date().toLocaleString('it-IT')} — Uso interno`, 105, 282, { align: 'center' })
    doc.save(`admin-prenotazione-${bookingCode}.pdf`)
  }

  async function handleExportAllCSV() {
    const headers = ['Codice','Posto','Zona','Tipo','Utente','Email','Targa','Inizio','Fine','Durata','Totale','Stato']
    const rows = bookings.map(b => [
      b.booking_code, b.spot_id, b.zone, b.parking_type,
      b.user_name||'', b.user_email||'', b.user_plate||'',
      b.start_time, b.end_time, b.duration_hours,
      Number(b.total_cost).toFixed(2), b.status
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'prenotazioni.csv'; a.click()
    URL.revokeObjectURL(url)
    showAdminNotif('📊 CSV esportato')
  }

  const [adminNotif, setAdminNotif] = useState(null)
  function showAdminNotif(msg, type = 'success') {
    setAdminNotif({ msg, type })
    setTimeout(() => setAdminNotif(null), 4000)
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
        <h1 className="sidebar-title">🅿 Admin</h1>
        <p className="sidebar-subtitle">
          Dashboard per controllare i posti, modificarli e visualizzare la disposizione del parcheggio.
        </p>

        {/* Profilo admin */}
        {user && (
          <div className="user-profile-box" style={{ marginBottom: 20 }}>
            <div className="user-avatar">{user.name ? user.name.charAt(0).toUpperCase() : 'A'}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>{user.role === 'admin' ? '🔑 Amministratore' : user.email}</div>
            </div>
          </div>
        )}

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

        {/* Logout */}
        {onLogout && (
          <div className="sidebar-section" style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <button type="button" className="btn-danger" style={{ width: '100%' }} onClick={onLogout}>
              🚪 Esci dall'account
            </button>
          </div>
        )}
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
              <button type="button"
                className={`view-toggle-btn ${adminView === 'dashboard' ? 'active' : ''}`}
                onClick={() => setAdminView('dashboard')}>
                🅿 Dashboard
              </button>
              <button type="button"
                className={`view-toggle-btn ${adminView === 'bookings' ? 'active' : ''}`}
                onClick={() => setAdminView('bookings')}>
                📋 Prenotazioni
              </button>
              {adminView === 'dashboard' && (<>
                <button type="button"
                  className={`view-toggle-btn ${viewMode === 'overview' ? 'active' : ''}`}
                  onClick={() => setViewMode('overview')}>
                  Vista generale
                </button>
                <button type="button"
                  className={`view-toggle-btn ${viewMode === 'focus' ? 'active' : ''}`}
                  onClick={() => setViewMode('focus')}>
                  Vista zona
                </button>
              </>)}
            </div>
          </section>

          {adminView === 'dashboard' && (<>
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
          </>)}

          {/* ── SEZIONE PRENOTAZIONI ADMIN ── */}
          {adminView === 'bookings' && (<>

            {/* Toolbar */}
            <section className="panel" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', padding: '16px 22px' }}>
              <input
                placeholder="Cerca per codice, posto, utente…"
                value={bookingSearch}
                onChange={e => setBookingSearch(e.target.value)}
                style={{ flex: 1, minWidth: 200, borderRadius: 12, border: '1px solid var(--border-color)', padding: '10px 14px', fontSize: 14 }}
              />
              <select value={bookingStatusFilter} onChange={e => setBookingStatusFilter(e.target.value)}
                style={{ borderRadius: 12, border: '1px solid var(--border-color)', padding: '10px 14px', fontWeight: 600, background: 'white' }}>
                <option value="all">Tutti gli stati</option>
                <option value="active">🟢 Attive</option>
                <option value="cancelled">🔴 Annullate</option>
                <option value="completed">⚫ Concluse</option>
              </select>
              <button className="btn-secondary" onClick={fetchBookings} style={{ whiteSpace: 'nowrap' }}>🔄 Aggiorna</button>
              <button className="btn-secondary" onClick={handleExportAllCSV} style={{ whiteSpace: 'nowrap' }}>📊 Esporta CSV</button>
            </section>

            {/* Stats rapide */}
            {(() => {
              const active = bookings.filter(b => b.status === 'active').length
              const cancelled = bookings.filter(b => b.status === 'cancelled').length
              const revenue = bookings.filter(b => b.status !== 'cancelled').reduce((s,b) => s + Number(b.total_cost), 0)
              return (
                <section className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
                  {[
                    { label: 'Prenotazioni totali', value: bookings.length, icon: '📋', cls: 'stat-total' },
                    { label: 'Attive ora', value: active, icon: '🟢', cls: 'stat-free' },
                    { label: 'Annullate', value: cancelled, icon: '🔴', cls: 'stat-occupied' },
                  ].map(s => (
                    <div key={s.label} className={`card stat-card ${s.cls}`}>
                      <div className="stat-card-top"><div className="stat-icon">{s.icon}</div><div className="stat-caption">{s.label}</div></div>
                      <div className="stat-value">{s.value}</div>
                    </div>
                  ))}
                </section>
              )
            })()}

            {/* Tabella prenotazioni */}
            <section className="panel" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '20px 22px 14px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 className="section-title" style={{ marginBottom: 4 }}>Tutte le prenotazioni</h3>
                  <p className="muted-text" style={{ fontSize: 13 }}>
                    {bookings.filter(b => {
                      const s = bookingSearch.toLowerCase()
                      const matchS = bookingStatusFilter === 'all' || b.status === bookingStatusFilter
                      const matchT = !s || (b.booking_code||'').toLowerCase().includes(s) || (b.spot_id||'').toLowerCase().includes(s) || (b.user_name||'').toLowerCase().includes(s) || (b.user_email||'').toLowerCase().includes(s)
                      return matchS && matchT
                    }).length} risultati
                  </p>
                </div>
              </div>
              {bookingsLoading ? (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>⏳ Caricamento prenotazioni…</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-bookings-table">
                    <thead>
                      <tr>
                        {['Codice','Posto','Utente','Inizio','Fine','Durata','Totale','Stato','Azioni'].map(h => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.filter(b => {
                        const s = bookingSearch.toLowerCase()
                        const matchS = bookingStatusFilter === 'all' || b.status === bookingStatusFilter
                        const matchT = !s || (b.booking_code||'').toLowerCase().includes(s) || (b.spot_id||'').toLowerCase().includes(s) || (b.user_name||'').toLowerCase().includes(s) || (b.user_email||'').toLowerCase().includes(s)
                        return matchS && matchT
                      }).map(b => (
                        <tr key={b.id}>
                          <td><span className="admin-booking-code">{b.booking_code}</span></td>
                          <td><strong>{b.spot_id}</strong><br/><span className="muted-text" style={{fontSize:12}}>Zona {b.zone}</span></td>
                          <td>{b.user_name || '—'}<br/><span className="muted-text" style={{fontSize:12}}>{b.user_email || ''}</span></td>
                          <td style={{fontSize:13}}>{b.start_time}</td>
                          <td style={{fontSize:13}}>{b.end_time}</td>
                          <td style={{textAlign:'center'}}>{b.duration_hours}h</td>
                          <td style={{fontWeight:700, color:'var(--primary)'}}>€{Number(b.total_cost).toFixed(2)}</td>
                          <td>
                            <span className={`spot-status-badge ${b.status === 'active' ? 'status-success' : b.status === 'cancelled' ? 'status-danger' : 'status-neutral'}`}>
                              {b.status === 'active' ? '🟢 Attiva' : b.status === 'cancelled' ? '🔴 Annullata' : '⚫ Conclusa'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="btn-secondary" style={{padding:'5px 10px',fontSize:12}} onClick={() => handleAdminDownloadPDF(b)}>📄 PDF</button>
                              {b.status === 'active' && (
                                <button className="btn-danger" style={{padding:'5px 10px',fontSize:12}} onClick={() => handleAdminCancelBooking(b.id)}>✕</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {bookings.length === 0 && (
                        <tr><td colSpan="9" style={{textAlign:'center',padding:40,color:'var(--muted)'}}>
                          📋 Nessuna prenotazione trovata
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>)}

        </div>
      </main>

      {/* ── Toast admin ── */}
      {adminNotif && (
        <div className={`toast-notif ${adminNotif.type === 'error' ? 'toast-error' : 'toast-success'}`}>
          {adminNotif.msg}
        </div>
      )}

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