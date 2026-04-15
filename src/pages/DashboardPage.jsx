import { useMemo, useState, useEffect } from 'react'
import Header from '../components/Header'
import SidebarFilters from '../components/SidebarFilters'
import StatsCards from '../components/StatsCards'
import ZoneMiniMap from '../components/ZoneMiniMap'
import SearchBar from '../components/SearchBar'
import ZoneTabs from '../components/ZoneTabs'
import Legend from '../components/Legend'
import ParkingGrid from '../components/ParkingGrid'
import SpotModal from '../components/SpotModal'
import ViewToggle from '../components/ViewToggle'
import ParkingMapView from '../components/ParkingMapView'
import ZoneSummaryCards from '../components/ZoneSummaryCards'
import AdminActions from '../components/AdminActions'

const API_URL = 'http://127.0.0.1:5000/api/spots'

function DashboardPage() {
  const [spots, setSpots] = useState([])
  const [selectedZone, setSelectedZone] = useState('A')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpot, setSelectedSpot] = useState(null)
  const [currentView, setCurrentView] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    zone: '',
    status: '',
    parkingType: '',
    vehicleType: '',
    maintenance: '',
  })

  // 1. Caricamento dati iniziale dal database (via Flask)
  useEffect(() => {
    fetchSpots()
  }, [])

  const fetchSpots = async () => {
    setLoading(true)
    try {
      const response = await fetch(API_URL)
      if (!response.ok) throw new Error('Errore nel caricamento dati')
      const data = await response.json()
      setSpots(data)
    } catch (error) {
      console.error("Errore API:", error)
      alert("Impossibile connettersi al database. Assicurati che Flask sia attivo.")
    } finally {
      setLoading(false)
    }
  }

  const activeZone = filters.zone && filters.zone !== 'all' ? filters.zone : selectedZone

  function matchesFilters(spot) {
    const zoneMatch = !filters.zone || filters.zone === 'all' || spot.zone === filters.zone
    const statusMatch = !filters.status || spot.status === filters.status
    const typeMatch = !filters.parkingType || spot.parking_type === filters.parkingType
    const vehicleMatch = !filters.vehicleType || spot.vehicle_type === filters.vehicleType
    const maintenanceMatch =
      filters.maintenance === '' || String(spot.maintenance) === filters.maintenance

    return zoneMatch && statusMatch && typeMatch && vehicleMatch && maintenanceMatch
  }

  const visibleSpots = useMemo(() => {
    let result = spots

    if (activeZone !== 'all') {
      result = result.filter((s) => s.zone === activeZone)
    }

    if (searchTerm) {
      const upperTerm = searchTerm.toUpperCase()
      result = result.filter((s) => s.id.includes(upperTerm))
    }

    return result.filter(matchesFilters)
  }, [spots, activeZone, searchTerm, filters])

  const zoneSummary = useMemo(() => {
    const zones = ['A', 'B', 'C', 'D']
    return zones.map((z) => {
      const zoneSpots = spots.filter((s) => s.zone === z)
      return {
        zone: z,
        total: zoneSpots.length,
        free: zoneSpots.filter((s) => s.status === 'free' && !s.maintenance).length,
        occupied: zoneSpots.filter((s) => s.status === 'occupied').length,
        maintenance: zoneSpots.filter((s) => s.maintenance).length,
      }
    })
  }, [spots])

  const globalSummary = useMemo(() => {
    return {
      total: spots.length,
      free: spots.filter((s) => s.status === 'free' && !s.maintenance).length,
      occupied: spots.filter((s) => s.status === 'occupied').length,
      maintenance: spots.filter((s) => s.maintenance).length,
    }
  }, [spots])

  function handleZoneChange(zone) {
    setSelectedZone(zone)
    setFilters((prev) => ({ ...prev, zone: zone === 'all' ? '' : zone }))
  }

  function handleFilterChange(name, value) {
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  function handleResetFilters() {
    setFilters({
      zone: '',
      status: '',
      parkingType: '',
      vehicleType: '',
      maintenance: '',
    })
    setSearchTerm('')
    setSelectedZone('A')
  }

  function handleSelectSpot(spot) {
    setSelectedSpot(spot)
  }

  function handleCloseModal() {
    setSelectedSpot(null)
  }

  // 2. Salvataggio dati sul database (via Flask PUT)
  async function handleSaveSpot(updatedSpot) {
    try {
      const response = await fetch(`${API_URL}/${updatedSpot.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSpot),
      })

      if (!response.ok) throw new Error('Errore durante il salvataggio')
      
      const result = await response.json()

      // Aggiorniamo lo stato locale con l'orario restituito dal DB
      setSpots((prev) =>
        prev.map((s) => (s.id === updatedSpot.id ? { ...updatedSpot, last_updated: result.last_updated } : s))
      )
      
      setSelectedSpot(null)
    } catch (error) {
      console.error("Errore salvataggio:", error)
      alert("Errore durante il salvataggio nel database.")
    }
  }

  function handleChangeView(view) {
    setCurrentView(view)
  }

  // Funzioni Admin (ora rinfrescano i dati dal server dopo le operazioni)
  function handleExportJson() {
    const dataStr = JSON.stringify(spots, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', 'parking_dataset.json')
    linkElement.click()
  }

  function handleImportJson(newSpots) {
    alert("Funzione di import di massa non ancora collegata al DB. Usa il modal per modifiche singole.")
  }

  function handleResetDataset() {
    fetchSpots() // Ricarica i dati originali dal DB
  }

  function handleSimulateOccupancy() {
    alert("Simulazione lato server non implementata. Modifica un posto manualmente.")
  }

  if (loading && spots.length === 0) {
    return <div style={{padding: '2rem', textAlign: 'center'}}>Caricamento dati dal database...</div>
  }

  return (
    <>
      <div className="app-container">
        <aside className="sidebar-container">
          <SidebarFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
          />
        </aside>

        <main className="main-content">
          <Header onResetFilters={handleResetFilters} />

          <div className="dashboard-content">
            <StatsCards summary={globalSummary} />

            <div className="grid-two">
              <ZoneMiniMap
                zones={zoneSummary}
                selectedZone={activeZone}
                onSelectZone={handleZoneChange}
              />
              <SearchBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onSearchSubmit={() => {}}
              />
            </div>

            <ZoneTabs
              selectedZone={selectedZone}
              onSelectZone={handleZoneChange}
            />

            <ViewToggle
              currentView={currentView}
              onChangeView={handleChangeView}
            />

            <Legend />

            <ZoneSummaryCards
              zoneSummary={zoneSummary}
              selectedZone={selectedZone}
              onSelectZone={handleZoneChange}
            />

            <ParkingMapView
              spots={spots}
              zoneSummary={zoneSummary}
              selectedZone={selectedZone}
              selectedSpot={selectedSpot}
              onSelectZone={handleZoneChange}
              onSelectSpot={handleSelectSpot}
              currentView={currentView}
              matchesFilters={matchesFilters}
            />

            <ParkingGrid
              spots={visibleSpots}
              selectedZone={activeZone}
              selectedSpot={selectedSpot}
              onSelectSpot={handleSelectSpot}
            />

            <AdminActions
              onExportJson={handleExportJson}
              onImportJson={handleImportJson}
              onResetDataset={handleResetDataset}
              onSimulateOccupancy={handleSimulateOccupancy}
            />
          </div>
        </main>
      </div>

      <SpotModal
        spot={selectedSpot}
        onClose={handleCloseModal}
        onSave={handleSaveSpot}
      />
    </>
  )
}

export default DashboardPage