import { useMemo, useState } from 'react'
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
import mockSpots, { normalizeSpotById } from '../data/mockSpots'

function DashboardPage() {
  const [spots, setSpots] = useState(mockSpots)
  const [selectedZone, setSelectedZone] = useState('A')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpot, setSelectedSpot] = useState(null)
  const [currentView, setCurrentView] = useState('overview')
  const [filters, setFilters] = useState({
    zone: '',
    status: '',
    parkingType: '',
    vehicleType: '',
    maintenance: '',
  })

  const activeZone = filters.zone && filters.zone !== 'all' ? filters.zone : selectedZone

  function matchesFilters(spot) {
    const zoneMatch = !filters.zone || filters.zone === 'all' || spot.zone === filters.zone
    const statusMatch = !filters.status || spot.status === filters.status
    const parkingTypeMatch = !filters.parkingType || spot.parking_type === filters.parkingType
    const vehicleTypeMatch = !filters.vehicleType || spot.vehicle_type === filters.vehicleType
    const maintenanceMatch =
      filters.maintenance === ''
        ? true
        : filters.maintenance === 'true'
        ? spot.maintenance === true
        : spot.maintenance === false
    const searchMatch = !searchTerm.trim() || spot.id.includes(searchTerm.trim().toUpperCase())

    return (
      zoneMatch &&
      statusMatch &&
      parkingTypeMatch &&
      vehicleTypeMatch &&
      maintenanceMatch &&
      searchMatch
    )
  }

  const visibleSpots = useMemo(() => {
    return spots.filter((spot) => spot.zone === activeZone && matchesFilters(spot))
  }, [spots, activeZone, filters, searchTerm])

  const summary = useMemo(() => {
    const total = spots.length
    const free = spots.filter((spot) => spot.status === 'free' && !spot.maintenance).length
    const occupied = spots.filter((spot) => spot.status === 'occupied').length
    const maintenance = spots.filter((spot) => spot.maintenance).length

    return { total, free, occupied, maintenance }
  }, [spots])

  const zoneSummary = useMemo(() => {
    return ['A', 'B', 'C', 'D'].map((zone) => {
      const zoneSpots = spots.filter((spot) => spot.zone === zone)
      const free = zoneSpots.filter((spot) => spot.status === 'free' && !spot.maintenance).length
      const occupied = zoneSpots.filter((spot) => spot.status === 'occupied').length

      return { zone, free, occupied }
    })
  }, [spots])

  function handleZoneChange(zone) {
    if (!zone || zone === 'all') return
    setSelectedZone(zone)
    setSelectedSpot(null)
    setCurrentView('map')
  }

  function handleSearchChange(value) {
    setSearchTerm(value)
  }

  function handleSearchSubmit() {
    const normalized = searchTerm.trim().toUpperCase()
    if (!normalized) return

    const foundSpot = spots.find((spot) => spot.id === normalized)

    if (foundSpot) {
      setSelectedZone(foundSpot.zone)
      setCurrentView('map')
      setSelectedSpot(foundSpot)
    } else {
      alert('Nessun posto trovato con questo codice.')
    }
  }

  function handleSelectSpot(spot) {
    setSelectedSpot(spot)
  }

  function handleCloseModal() {
    setSelectedSpot(null)
  }

  function handleSaveSpot(updatedSpot) {
    const normalizedSpot = normalizeSpotById({
      ...updatedSpot,
      last_updated: new Date().toLocaleString('it-IT'),
    })

    setSpots((prevSpots) =>
      prevSpots.map((spot) =>
        spot.id === normalizedSpot.id ? normalizedSpot : spot
      )
    )

    setSelectedSpot(normalizedSpot)
  }

  function handleFilterChange(name, value) {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
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
    setSelectedSpot(null)
    setSelectedZone('A')
    setCurrentView('overview')
  }

  function handleChangeView(view) {
    setCurrentView(view)
    setSelectedSpot(null)
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
    setSelectedZone('A')
    setSearchTerm('')
    setCurrentView('overview')
    alert('Importazione completata.')
  }

  function handleResetDataset() {
    const confirmReset = window.confirm(
      'Vuoi davvero ripristinare il dataset iniziale del parcheggio?'
    )

    if (!confirmReset) return

    setSpots(mockSpots)
    setSelectedSpot(null)
    setSelectedZone('A')
    setSearchTerm('')
    setFilters({
      zone: '',
      status: '',
      parkingType: '',
      vehicleType: '',
      maintenance: '',
    })
    setCurrentView('overview')
  }

  function handleSimulateOccupancy() {
    setSpots((prevSpots) =>
      prevSpots.map((spot) => {
        const randomNumber = Math.random()
        const shouldToggleStatus = randomNumber > 0.82
        const shouldToggleMaintenance = randomNumber < 0.04

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
            last_updated: new Date().toLocaleString('it-IT'),
          }
        }

        return spot
      })
    )
  }

  return (
    <>
      <Header onResetFilters={handleResetFilters} />

      <div className="app-shell">
        <SidebarFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
        />

        <main className="main-content">
          <div className="dashboard-stack">
            <StatsCards summary={summary} />

            <ZoneMiniMap
              zones={zoneSummary}
              selectedZone={selectedZone}
              onSelectZone={handleZoneChange}
            />

            <SearchBar
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              onSearchSubmit={handleSearchSubmit}
            />

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