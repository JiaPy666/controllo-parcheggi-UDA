function AdminActions({
  onExportJson,
  onImportJson,
  onResetDataset,
  onSimulateOccupancy,
}) {
  function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()

    reader.onload = (loadEvent) => {
      try {
        const parsed = JSON.parse(loadEvent.target.result)
        onImportJson(parsed)
      } catch (error) {
        alert('File JSON non valido.')
      }
    }

    reader.readAsText(file)
    event.target.value = ''
  }

  return (
    <section className="panel admin-actions-panel">
      <div className="admin-actions-header">
        <div>
          <h2 className="section-title">Azioni amministrative</h2>
          <p className="muted-text">
            Esporta, importa o rigenera rapidamente i dati del parcheggio per testare il progetto.
          </p>
        </div>
      </div>

      <div className="admin-actions-grid">
        <button type="button" className="admin-action-card admin-action-primary" onClick={onExportJson}>
          <span className="admin-action-icon">⬇️</span>
          <span className="admin-action-content">
            <span className="admin-action-title">Esporta JSON</span>
            <span className="admin-action-text">Scarica tutti i posti attuali in un file JSON.</span>
          </span>
        </button>

        <label className="admin-action-card admin-action-neutral file-import-label">
          <span className="admin-action-icon">⬆️</span>
          <span className="admin-action-content">
            <span className="admin-action-title">Importa JSON</span>
            <span className="admin-action-text">Carica un file JSON per aggiornare il dataset.</span>
          </span>
          <input type="file" accept=".json,application/json" onChange={handleFileChange} hidden />
        </label>

        <button type="button" className="admin-action-card admin-action-neutral" onClick={onSimulateOccupancy}>
          <span className="admin-action-icon">🎲</span>
          <span className="admin-action-content">
            <span className="admin-action-title">Simula occupazione</span>
            <span className="admin-action-text">Cambia casualmente stato e manutenzione di alcuni posti.</span>
          </span>
        </button>

        <button type="button" className="admin-action-card admin-action-danger" onClick={onResetDataset}>
          <span className="admin-action-icon">♻️</span>
          <span className="admin-action-content">
            <span className="admin-action-title">Reset dataset</span>
            <span className="admin-action-text">Ripristina il dataset iniziale del parcheggio.</span>
          </span>
        </button>
      </div>
    </section>
  )
}

export default AdminActions