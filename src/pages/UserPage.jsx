import { useState, useEffect, useMemo } from 'react'
import ParkingMapView from '../components/ParkingMapView'
import '../App.css'
import './UserPage.css'

const API = 'http://127.0.0.1:5000/api'

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateBookingCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'PRK-'
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

function formatType(type) {
  const map = { normal: 'Normale', disabled: 'Disabili', electric: 'Elettrico', motorcycle: 'Moto', van: 'Van' }
  return map[type] || type
}

function formatStatus(spot) {
  if (spot.maintenance) return 'Manutenzione'
  if (spot.status === 'occupied') return 'Occupato'
  return 'Libero'
}

function getVehicleIcon(parking_type) {
  if (parking_type === 'motorcycle') return '🏍️'
  if (parking_type === 'van') return '🚐'
  if (parking_type === 'electric') return '⚡'
  if (parking_type === 'disabled') return '♿'
  return '🚗'
}

function getBadgeClass(spot) {
  if (spot.maintenance) return 'status-warning'
  if (spot.status === 'occupied') return 'status-danger'
  switch (spot.parking_type) {
    case 'disabled': return 'status-info'
    case 'electric': return 'status-success'
    case 'motorcycle': return 'status-warning'
    case 'van': return 'status-warning'
    default: return 'status-success'
  }
}

function formatDuration(ms) {
  if (ms <= 0) return '00:00:00'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':')
}

// ─── PDF Generator ──────────────────────────────────────────────────────────

async function generateBookingPDF(booking, user) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()

  // Header
  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, 210, 40, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('🅿 Prenotazione Parcheggio', 14, 18)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('Aeroporto UDA — Biglietto di prenotazione', 14, 30)

  // Booking code box
  doc.setFillColor(37, 99, 235)
  doc.roundedRect(14, 48, 182, 22, 4, 4, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(`Codice: ${booking.booking_code || booking.code}`, 105, 63, { align: 'center' })

  // Details
  doc.setTextColor(15, 23, 42)
  doc.setFontSize(12)
  const rows = [
    ['Intestatario', user.name],
    ['Email', user.email],
    ['Targa', user.plate || 'N/D'],
    ['Posto', booking.spot_id || booking.spotId || ''],
    ['Zona', `Zona ${booking.zone}`],
    ['Tipo', formatType(booking.parking_type || booking.type)],
    ['Costo orario', `€ ${booking.hourly_cost || booking.cost}/ora`],
    ['Inizio prenotazione', booking.start_time || booking.startTime],
    ['Fine prenotazione', booking.end_time || booking.endTime],
    ['Durata', (booking.duration_hours || booking.duration) + ' ore'],
    ['Totale stimato', `€ ${Number(booking.total_cost || (booking.cost * booking.duration)).toFixed(2)}`],
  ]

  let y = 82
  rows.forEach(([label, value], i) => {
    if (i % 2 === 0) {
      doc.setFillColor(248, 251, 255)
      doc.rect(14, y - 5, 182, 12, 'F')
    }
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(100, 116, 139)
    doc.text(label, 18, y + 3)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(15, 23, 42)
    doc.text(String(value), 100, y + 3)
    y += 13
  })

  // Footer
  doc.setFillColor(248, 251, 255)
  doc.rect(0, 270, 210, 27, 'F')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text('Questo documento è il tuo titolo di accesso al parcheggio. Conservalo.', 105, 282, { align: 'center' })
  doc.text(`Generato il ${new Date().toLocaleString('it-IT')}`, 105, 290, { align: 'center' })

  doc.save(`prenotazione-${booking.code}.pdf`)
}

// ─── Countdown Hook ──────────────────────────────────────────────────────────

function useCountdown(endTime) {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    if (!endTime) return
    const tick = () => setRemaining(Math.max(0, new Date(endTime) - new Date()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [endTime])

  return remaining
}

// ─── Components ──────────────────────────────────────────────────────────────

function CountdownBadge({ endTime, onExtend }) {
  const remaining = useCountdown(endTime)
  const mins = Math.floor(remaining / 60000)
  const urgent = mins <= 30 && remaining > 0
  const expired = remaining === 0

  return (
    <div className={`countdown-badge ${urgent ? 'countdown-urgent' : ''} ${expired ? 'countdown-expired' : ''}`}>
      <span className="countdown-icon">{expired ? '⛔' : urgent ? '⚠️' : '⏱'}</span>
      <div>
        <div className="countdown-label">
          {expired ? 'Prenotazione scaduta' : urgent ? 'In scadenza!' : 'Tempo rimanente'}
        </div>
        <div className="countdown-time">{formatDuration(remaining)}</div>
      </div>
      {urgent && !expired && (
        <button className="btn-primary" style={{ marginLeft: 'auto', padding: '8px 14px', fontSize: 13 }} onClick={onExtend}>
          +1 ora
        </button>
      )}
    </div>
  )
}

function ProfileModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({ ...user })

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="section-title">Il tuo profilo</h2>
            <p className="muted-text">Modifica i tuoi dati personali</p>
          </div>
          <button className="btn-secondary" onClick={onClose}>Chiudi</button>
        </div>
        <div className="modal-grid">
          {[
            { label: 'Nome completo', name: 'name', type: 'text' },
            { label: 'Email', name: 'email', type: 'email' },
            { label: 'Telefono', name: 'phone', type: 'tel' },
            { label: 'Targa veicolo', name: 'plate', type: 'text' },
          ].map(f => (
            <label key={f.name}>
              <span className="modal-label">{f.label}</span>
              <input type={f.type} name={f.name} value={form[f.name] || ''} onChange={handleChange} />
            </label>
          ))}
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Annulla</button>
          <button className="btn-primary" onClick={() => { onSave(form); onClose() }}>Salva profilo</button>
        </div>
      </div>
    </div>
  )
}

function BookingModal({ spot, user, onClose, onConfirm }) {
  const now = new Date()
  const defaultEnd = new Date(now.getTime() + 2 * 3600000)
  const fmt = d => d.toISOString().slice(0, 16)

  const [startTime, setStartTime] = useState(fmt(now))
  const [endTime, setEndTime] = useState(fmt(defaultEnd))

  const duration = Math.max(0, (new Date(endTime) - new Date(startTime)) / 3600000).toFixed(1)
  const total = (duration * spot.cost).toFixed(2)

  function handleConfirm() {
    const booking = {
      spotId: spot.id,
      zone: spot.zone,
      type: spot.parking_type,
      cost: spot.cost,
      startTimeRaw: startTime,
      endTimeRaw: endTime,
      duration: parseFloat(duration),
    }
    onConfirm(booking)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="section-title">Prenota posto {spot.id}</h2>
            <p className="muted-text">Zona {spot.zone} · {formatType(spot.parking_type)} · €{spot.cost}/ora</p>
          </div>
          <button className="btn-secondary" onClick={onClose}>Chiudi</button>
        </div>

        {/* Riepilogo spot */}
        <div className="booking-spot-preview">
          <span style={{ fontSize: 32 }}>{getVehicleIcon(spot.parking_type)}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{spot.id}</div>
            <div className="muted-text">Zona {spot.zone} · {formatType(spot.parking_type)}</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--primary)' }}>€{spot.cost}</div>
            <div className="muted-text" style={{ fontSize: 12 }}>al ora</div>
          </div>
        </div>

        <div className="modal-grid">
          <label>
            <span className="modal-label">Inizio prenotazione</span>
            <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} min={fmt(now)} />
          </label>
          <label>
            <span className="modal-label">Fine prenotazione</span>
            <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} min={startTime} />
          </label>
          <label>
            <span className="modal-label">Intestatario</span>
            <input type="text" value={user.name} readOnly />
          </label>
          <label>
            <span className="modal-label">Targa</span>
            <input type="text" value={user.plate || ''} readOnly />
          </label>
        </div>

        {/* Calcolo costo */}
        <div className="booking-cost-summary">
          <div className="booking-cost-row">
            <span>Durata</span>
            <strong>{duration} ore</strong>
          </div>
          <div className="booking-cost-row">
            <span>Tariffa oraria</span>
            <strong>€{spot.cost}/ora</strong>
          </div>
          <div className="booking-cost-row booking-cost-total">
            <span>Totale stimato</span>
            <strong>€{total}</strong>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Annulla</button>
          <button className="btn-primary" onClick={handleConfirm} disabled={duration <= 0}>
            ✅ Conferma prenotazione
          </button>
        </div>
      </div>
    </div>
  )
}

function BookingCard({ booking, onCancel, onExtend, onDownloadPDF, user }) {
  const isActive = booking.status === 'active'

  return (
    <div className={`booking-card ${isActive ? 'booking-card-active' : 'booking-card-past'}`}>
      <div className="booking-card-header">
        <div>
          <div className="booking-code">{booking.booking_code}</div>
          <div className="muted-text" style={{ fontSize: 13, marginTop: 4 }}>
            {booking.spot_id} · Zona {booking.zone} · {formatType(booking.parking_type)}
          </div>
        </div>
        <span className={`spot-status-badge ${isActive ? 'status-success' : 'status-neutral'}`}>
          {isActive ? '🟢 Attiva' : '⚫ Conclusa'}
        </span>
      </div>

      {isActive && (
        <CountdownBadge
          endTime={booking.end_time_raw}
          onExtend={() => onExtend(booking.id, booking)}
        />
      )}

      <div className="booking-info-grid">
        <div><span className="modal-label">Inizio</span><p className="muted-text">{booking.start_time}</p></div>
        <div><span className="modal-label">Fine</span><p className="muted-text">{booking.end_time}</p></div>
        <div><span className="modal-label">Durata</span><p className="muted-text">{booking.duration_hours} ore</p></div>
        <div><span className="modal-label">Totale</span><p className="muted-text">€{Number(booking.total_cost).toFixed(2)}</p></div>
      </div>

      <div className="booking-card-actions">
        <button className="btn-secondary" onClick={() => onDownloadPDF(booking)}>
          📄 Scarica PDF
        </button>
        {isActive && (
          <button className="btn-danger" onClick={() => onCancel(booking.id)}>
            🗑 Cancella
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main UserPage ────────────────────────────────────────────────────────────

export default function UserPage({ initialUser, onLogout }) {
  const [spots, setSpots] = useState([])
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState([])
  const [bookingsLoading, setBookingsLoading] = useState(true)
  const [user, setUser] = useState(initialUser || { id: null, name: '', email: '', phone: '', plate: '' })

  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [zoneFilter, setZoneFilter] = useState('all')
  const [activeView, setActiveView] = useState('spots') // spots | map | bookings
  const [mapSelectedSpot, setMapSelectedSpot] = useState(null)
  const [focusedZone, setFocusedZone] = useState('A')
  const [mapViewMode, setMapViewMode] = useState('overview')
  const [bookingSpot, setBookingSpot] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const [notification, setNotification] = useState(null)

  // Fetch posti dal DB
  useEffect(() => {
    fetch(`${API}/spots`)
      .then(res => res.json())
      .then(data => { setSpots(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Fetch prenotazioni utente dal DB
  useEffect(() => {
    if (!user?.id) return
    fetch(`${API}/bookings?user_id=${user.id}`)
      .then(res => res.json())
      .then(data => { setBookings(Array.isArray(data) ? data : []); setBookingsLoading(false) })
      .catch(() => setBookingsLoading(false))
  }, [user?.id])

  function showNotif(msg, type = 'success') {
    setNotification({ msg, type })
    setTimeout(() => setNotification(null), 4000)
  }

  // Filtro posti liberi
  const availableSpots = useMemo(() => {
    return spots.filter(spot => {
      if (spot.status !== 'free' || spot.maintenance) return false
      if (typeFilter !== 'all' && spot.parking_type !== typeFilter) return false
      if (zoneFilter !== 'all' && spot.zone !== zoneFilter) return false
      if (searchTerm) {
        const s = searchTerm.toLowerCase()
        return spot.id.toLowerCase().includes(s) || spot.parking_type.toLowerCase().includes(s)
      }
      return true
    })
  }, [spots, typeFilter, zoneFilter, searchTerm])

  const zoneSummary = useMemo(() => {
    return ['A', 'B', 'C', 'D'].map(zone => {
      const zoneSpots = spots.filter(s => s.zone === zone)
      return {
        zone,
        total: zoneSpots.length,
        free: zoneSpots.filter(s => s.status === 'free' && !s.maintenance).length,
        occupied: zoneSpots.filter(s => s.status === 'occupied' && !s.maintenance).length,
        maintenance: zoneSpots.filter(s => s.maintenance).length,
      }
    })
  }, [spots])

  function mapMatchesFilters(spot) {
    if (spot.status !== 'free' || spot.maintenance) return false
    return true
  }

  function handleMapSpotClick(spot) {
    setMapSelectedSpot(spot)
    if (spot.status === 'free' && !spot.maintenance) {
      setBookingSpot(spot)
    }
  }

  const activeBookings = bookings.filter(b => b.status === 'active')
  const pastBookings = bookings.filter(b => b.status !== 'active')

  async function handleConfirmBooking(booking) {
    try {
      const res = await fetch(`${API}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          spot_id: booking.spotId,
          start_time: booking.startTimeRaw,
          end_time: booking.endTimeRaw,
          duration_hours: booking.duration,
          total_cost: booking.cost * booking.duration,
        })
      })
      const data = await res.json()
      if (!res.ok) { showNotif('❌ ' + (data.error || 'Errore prenotazione'), 'error'); return }

      // Ricarica prenotazioni e posti dal server
      const [bookingsRes, spotsRes] = await Promise.all([
        fetch(`${API}/bookings?user_id=${user.id}`).then(r => r.json()),
        fetch(`${API}/spots`).then(r => r.json()),
      ])
      setBookings(Array.isArray(bookingsRes) ? bookingsRes : [])
      setSpots(Array.isArray(spotsRes) ? spotsRes : [])
      showNotif(`✅ Prenotazione confermata! Codice: ${data.booking_code}`)
    } catch (e) {
      showNotif('❌ Errore di rete', 'error')
    }
  }

  async function handleCancelBooking(bookingId) {
    if (!confirm('Sei sicuro di voler cancellare questa prenotazione?')) return
    try {
      const res = await fetch(`${API}/bookings/${bookingId}/cancel`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { showNotif('❌ ' + (data.error || 'Errore'), 'error'); return }
      const [bookingsRes, spotsRes] = await Promise.all([
        fetch(`${API}/bookings?user_id=${user.id}`).then(r => r.json()),
        fetch(`${API}/spots`).then(r => r.json()),
      ])
      setBookings(Array.isArray(bookingsRes) ? bookingsRes : [])
      setSpots(Array.isArray(spotsRes) ? spotsRes : [])
      showNotif('🗑 Prenotazione cancellata')
    } catch (e) {
      showNotif('❌ Errore di rete', 'error')
    }
  }

  async function handleExtendBooking(bookingId, currentBooking) {
    try {
      const newEnd = new Date(new Date(currentBooking.end_time_raw).getTime() + 3600000)
      const newDuration = Number(currentBooking.duration_hours) + 1
      const newCost = (newDuration * Number(currentBooking.hourly_cost)).toFixed(2)
      const res = await fetch(`${API}/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          end_time: newEnd.toISOString(),
          duration_hours: newDuration,
          total_cost: newCost,
        })
      })
      const data = await res.json()
      if (!res.ok) { showNotif('❌ ' + (data.error || 'Errore'), 'error'); return }
      const bookingsRes = await fetch(`${API}/bookings?user_id=${user.id}`).then(r => r.json())
      setBookings(Array.isArray(bookingsRes) ? bookingsRes : [])
      showNotif('⏱ Prenotazione estesa di 1 ora')
    } catch (e) {
      showNotif('❌ Errore di rete', 'error')
    }
  }

  function handleDownloadPDF(booking) {
    generateBookingPDF(booking, user).catch(() => showNotif('Errore nel PDF', 'error'))
  }

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div style={{ marginBottom: 28 }}>
          <div className="sidebar-title">🅿 ParkUser</div>
          <p className="sidebar-subtitle">Prenota il tuo parcheggio in pochi click</p>
        </div>

        {/* Profilo */}
        <div className="user-profile-box" onClick={() => setShowProfile(true)}>
          <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{user.name}</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{user.email}</div>
            {user.plate && <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 }}>🚗 {user.plate}</div>}
          </div>
          <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>✏️</span>
        </div>

        {/* Nav */}
        <div className="sidebar-section">
          <span className="sidebar-label">Navigazione</span>
          {[
            { id: 'spots', icon: '🅿', label: 'Posti disponibili', count: availableSpots.length },
            { id: 'map', icon: '🗺', label: 'Mappa parcheggio', count: null },
            { id: 'bookings', icon: '📋', label: 'Le mie prenotazioni', count: activeBookings.length },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              className={`user-nav-btn ${activeView === tab.id ? 'active' : ''}`}
              onClick={() => setActiveView(tab.id)}
            >
              <span>{tab.icon} {tab.label}</span>
              {tab.count !== null && <span className="user-nav-badge">{tab.count}</span>}
            </button>
          ))}
        </div>

        {/* Filtri — mostrati nella vista posti */}
        {(activeView === 'spots') && (
          <>
            <div className="sidebar-section">
              <span className="sidebar-label">Tipo parcheggio</span>
              <select className="filter-control" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="all">Tutti i tipi</option>
                <option value="normal">Normale</option>
                <option value="disabled">Disabili ♿</option>
                <option value="electric">Elettrico ⚡</option>
                <option value="motorcycle">Moto 🏍️</option>
                <option value="van">Van 🚐</option>
              </select>
            </div>
            <div className="sidebar-section">
              <span className="sidebar-label">Zona</span>
              <select className="filter-control" value={zoneFilter} onChange={e => setZoneFilter(e.target.value)}>
                <option value="all">Tutte le zone</option>
                {['A','B','C','D'].map(z => <option key={z} value={z}>Zona {z}</option>)}
              </select>
            </div>
            <div className="sidebar-section">
              <button className="btn-secondary" style={{ width: '100%' }} onClick={() => { setTypeFilter('all'); setZoneFilter('all'); setSearchTerm('') }}>
                Reimposta filtri
              </button>
            </div>
          </>
        )}

        {/* Logout */}
        {onLogout && (
          <div className="sidebar-section">
            <button className="btn-danger" style={{ width: '100%' }} onClick={onLogout}>
              🚪 Esci dall'account
            </button>
          </div>
        )}

        {/* Stats sidebar */}
        <div style={{ marginTop: 'auto', paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 10 }}>STATISTICHE</div>
          {[
            { label: 'Posti liberi', value: spots.filter(s => s.status === 'free' && !s.maintenance).length, color: '#b9fbc0' },
            { label: 'Prenotazioni attive', value: activeBookings.length, color: '#93c5fd' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>{s.label}</span>
              <span style={{ fontWeight: 700, color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main-content">
        <div className="dashboard-stack">

          {/* Header panel */}
          <section className="panel header-panel">
            <div>
              <h2 className="page-title">
                {activeView === 'spots' ? 'Posti disponibili' : activeView === 'map' ? 'Mappa parcheggio' : 'Le mie prenotazioni'}
              </h2>
              <p className="muted-text">
                {activeView === 'spots'
                  ? `${availableSpots.length} posti liberi trovati · Seleziona un posto per prenotare`
                  : activeView === 'map'
                  ? 'Clicca un posto libero sulla mappa per prenotarlo direttamente'
                  : `${activeBookings.length} prenotazioni attive · ${pastBookings.length} concluse`}
              </p>
            </div>
            {activeView === 'spots' && (
              <div className="search-row" style={{ minWidth: 280 }}>
                <input
                  placeholder="Cerca per ID o tipo…"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ borderRadius: 12, border: '1px solid var(--border-color)', padding: '10px 14px', width: '100%' }}
                />
              </div>
            )}
            {activeView === 'map' && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <div className="zone-tabs">
                  <button type="button" className={`zone-tab ${mapViewMode === 'overview' ? 'active' : ''}`} onClick={() => setMapViewMode('overview')}>Panoramica</button>
                  {['A','B','C','D'].map(z => (
                    <button key={z} type="button" className={`zone-tab ${mapViewMode === 'focus' && focusedZone === z ? 'active' : ''}`}
                      onClick={() => { setFocusedZone(z); setMapViewMode('focus') }}>
                      Zona {z}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ── VISTA POSTI ── */}
          {activeView === 'spots' && (
            <section className="panel">
              {loading ? (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
                  Caricamento posti…
                </div>
              ) : availableSpots.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🅿</div>
                  Nessun posto disponibile con i filtri selezionati
                </div>
              ) : (
                <div className="spots-user-grid">
                  {availableSpots.map(spot => (
                    <div key={spot.id} className="spot-user-card" onClick={() => setBookingSpot(spot)}>
                      <div className="spot-user-top">
                        <span style={{ fontSize: 28 }}>{getVehicleIcon(spot.parking_type)}</span>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 16 }}>{spot.id}</div>
                          <div className="muted-text" style={{ fontSize: 13 }}>Zona {spot.zone}</div>
                        </div>
                        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--primary)' }}>€{spot.cost}</div>
                          <div className="muted-text" style={{ fontSize: 11 }}>/ora</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                        <span className={`spot-status-badge ${getBadgeClass(spot)}`}>{formatType(spot.parking_type)}</span>
                        <button className="btn-primary" style={{ padding: '7px 14px', fontSize: 13 }}
                          onClick={e => { e.stopPropagation(); setBookingSpot(spot) }}>
                          Prenota
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── VISTA MAPPA ── */}
          {activeView === 'map' && (
            <>
              <div className="user-map-legend panel" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', padding: '14px 20px' }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--muted)' }}>LEGENDA:</span>
                {[
                  { color: 'var(--success)', label: 'Libero — clicca per prenotare' },
                  { color: 'var(--danger)', label: 'Occupato' },
                  { color: 'var(--warning)', label: 'Manutenzione' },
                  { color: 'var(--info)', label: 'Disabili' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 14, height: 14, borderRadius: 4, background: item.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'var(--muted)' }}>{item.label}</span>
                  </div>
                ))}
              </div>
              <ParkingMapView
                spots={spots}
                zoneSummary={zoneSummary}
                selectedZone={focusedZone}
                selectedSpot={mapSelectedSpot}
                onSpotClick={handleMapSpotClick}
                viewMode={mapViewMode}
                matchesFilters={mapMatchesFilters}
              />
            </>
          )}

          {/* ── VISTA PRENOTAZIONI ── */}
          {activeView === 'bookings' && (
            <>
              {activeBookings.length > 0 && (
                <section className="panel">
                  <h3 className="section-title" style={{ marginBottom: 16 }}>🟢 Prenotazioni attive</h3>
                  <div style={{ display: 'grid', gap: 16 }}>
                    {activeBookings.map(b => (
                      <BookingCard key={b.code} booking={b} user={user}
                        onCancel={handleCancelBooking}
                        onExtend={handleExtendBooking}
                        onDownloadPDF={handleDownloadPDF}
                      />
                    ))}
                  </div>
                </section>
              )}

              {pastBookings.length > 0 && (
                <section className="panel">
                  <h3 className="section-title" style={{ marginBottom: 16 }}>⚫ Storico prenotazioni</h3>
                  <div style={{ display: 'grid', gap: 16 }}>
                    {pastBookings.map(b => (
                      <BookingCard key={b.code} booking={b} user={user}
                        onCancel={handleCancelBooking}
                        onExtend={handleExtendBooking}
                        onDownloadPDF={handleDownloadPDF}
                      />
                    ))}
                  </div>
                </section>
              )}

              {bookings.length === 0 && (
                <section className="panel" style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                  <p>Nessuna prenotazione ancora. <br />Vai su <strong>Posti disponibili</strong> per prenotare!</p>
                  <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => setActiveView('spots')}>
                    Vai ai posti
                  </button>
                </section>
              )}
            </>
          )}
        </div>
      </main>

      {/* ── Modals ── */}
      {showProfile && (
        <ProfileModal user={user} onClose={() => setShowProfile(false)} onSave={async (updatedUser) => {
          try {
            const res = await fetch(`${API}/users/${user.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedUser)
            })
            const data = await res.json()
            if (!res.ok) { showNotif('❌ ' + (data.error || 'Errore aggiornamento'), 'error'); return }
            setUser(data)
            showNotif('✅ Profilo aggiornato')
          } catch (e) {
            showNotif('❌ Errore di rete', 'error')
          }
        }} />
      )}
      {bookingSpot && (
        <BookingModal
          spot={bookingSpot}
          user={user}
          onClose={() => setBookingSpot(null)}
          onConfirm={handleConfirmBooking}
        />
      )}

      {/* ── Toast Notification ── */}
      {notification && (
        <div className={`toast-notif ${notification.type === 'error' ? 'toast-error' : 'toast-success'}`}>
          {notification.msg}
        </div>
      )}
    </div>
  )
}
