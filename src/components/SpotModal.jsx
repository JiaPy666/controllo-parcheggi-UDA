import { useEffect, useState } from 'react'

function SpotModal({ spot, onClose, onSave }) {
  const [formData, setFormData] = useState({
    id: '',
    zone: 'A',
    status: 'free',
    parking_type: 'normal',
    maintenance: false,
    vehicle_type: 'car',
    cost: 0,
    last_updated: '',
  })

  useEffect(() => {
    if (spot) {
      setFormData({
        id: spot.id,
        zone: spot.zone,
        status: spot.status,
        parking_type: spot.parking_type,
        maintenance: spot.maintenance,
        vehicle_type: spot.vehicle_type,
        cost: spot.cost,
        last_updated: spot.last_updated,
      })
    }
  }, [spot])

  if (!spot) return null

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    onSave({
      ...formData,
      cost: Number(formData.cost),
      last_updated: new Date().toLocaleString('it-IT'),
    })

    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 className="section-title">Dettaglio posto {spot.id}</h2>
            <p className="muted-text">
              Aggiorna rapidamente zona, stato, tipo di posto, costo e disponibilità.
            </p>
          </div>

          <button type="button" className="btn-secondary" onClick={onClose}>
            Chiudi
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-grid">
            <label>
              <span className="modal-label">ID posto</span>
              <input type="text" name="id" value={formData.id} disabled />
            </label>

            <label>
              <span className="modal-label">Zona</span>
              <select name="zone" value={formData.zone} onChange={handleChange}>
                <option value="A">Zona A</option>
                <option value="B">Zona B</option>
                <option value="C">Zona C</option>
                <option value="D">Zona D</option>
              </select>
            </label>

            <label>
              <span className="modal-label">Stato</span>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="free">Libero</option>
                <option value="occupied">Occupato</option>
              </select>
            </label>

            <label>
              <span className="modal-label">Tipo parcheggio</span>
              <select
                name="parking_type"
                value={formData.parking_type}
                onChange={handleChange}
              >
                <option value="normale">Normale</option>
                <option value="disabili">Disabili</option>
                <option value="elettrico">Elettrico</option>
                <option value="moto">Moto</option>
                <option value="furgone">Van</option>
              </select>
            </label>

            <label>
              <span className="modal-label">Tipo veicolo</span>
              <select
                name="vehicle_type"
                value={formData.vehicle_type}
                onChange={handleChange}
              >
                <option value="auto">Auto</option>
                <option value="moto">Moto</option>
                <option value="furgone">Van</option>
              </select>
            </label>

            <label>
              <span className="modal-label">Costo orario (€)</span>
              <input
                type="number"
                step="0.5"
                min="0"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
              />
            </label>
          </div>

          <div className="maintenance-box">
            <label className="maintenance-toggle">
              <input
                type="checkbox"
                name="maintenance"
                checked={formData.maintenance}
                onChange={handleChange}
              />
              Posto in manutenzione
            </label>
          </div>

          <div className="update-box">
            <span className="modal-label">Ultimo aggiornamento</span>
            <p className="muted-text">{formData.last_updated || 'N/D'}</p>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Annulla
            </button>
            <button type="submit" className="btn-primary">
              Salva modifiche
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SpotModal