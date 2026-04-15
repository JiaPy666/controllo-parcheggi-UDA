function Header({ onResetFilters }) {
  const currentDate = new Date().toLocaleString('it-IT', {
    dateStyle: 'full',
    timeStyle: 'short',
  })

  const currentHour = new Date().getHours()

  function getGreeting() {
    if (currentHour < 12) return 'Buongiorno'
    if (currentHour < 18) return 'Buon pomeriggio'
    return 'Buonasera'
  }

  function handleHelpClick() {
    alert('La simulazione avanzata è disponibile nel pannello azioni amministrative.')
  }

  return (
    <header className="header-panel card">
      <div className="header-main">
        <div>
          <p className="eyebrow">Airport Parking Dashboard</p>
          <h1 className="page-title">{getGreeting()}, gestione parcheggio aeroportuale</h1>
          <p className="muted-text">
            Monitora lo stato dei posti, seleziona le zone, modifica i dati del
            parcheggio e testa il comportamento della dashboard con dataset dinamico JSON.
          </p>
        </div>

        <div className="header-actions">
          <button type="button" className="btn-secondary" onClick={onResetFilters}>
            Reset filtri
          </button>
          <button type="button" className="btn-primary" onClick={handleHelpClick}>
            Aiuto rapido
          </button>
        </div>
      </div>

      <div className="header-stats">
        <div className="header-stat card">
          <span className="header-stat-label">Zone attive</span>
          <strong>4 zone</strong>
        </div>

        <div className="header-stat card">
          <span className="header-stat-label">Capacità</span>
          <strong>400 posti gestiti</strong>
        </div>

        <div className="header-stat card">
          <span className="header-stat-label">Ambiente</span>
          <strong>Frontend React locale</strong>
        </div>

        <div className="header-stat card">
          <span className="header-stat-label">Ultimo aggiornamento</span>
          <strong>{currentDate}</strong>
        </div>
      </div>
    </header>
  )
}

export default Header