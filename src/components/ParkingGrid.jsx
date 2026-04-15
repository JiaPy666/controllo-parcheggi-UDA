import ParkingSpotCard from './ParkingSpotCard'

function ParkingGrid({ spots, selectedZone, selectedSpot, onSelectSpot }) {
  return (
    <section className="card">
      <div className="summary-header">
        <div>
          <h2 className="section-title">Griglia posti - Zona {selectedZone}</h2>
          <p className="muted-text">
            Visualizzazione dei posti disponibili per la zona attualmente selezionata.
          </p>
        </div>
      </div>

      {spots.length === 0 ? (
        <div className="card">
          <h3>Nessun posto trovato</h3>
          <p className="muted-text">
            Prova a cambiare zona, ricerca o filtri per visualizzare altri posti.
          </p>
        </div>
      ) : (
        <div className="parking-grid">
          {spots.map((spot) => (
            <ParkingSpotCard
              key={spot.id}
              spot={spot}
              isSelected={selectedSpot?.id === spot.id}
              onSelect={onSelectSpot}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default ParkingGrid