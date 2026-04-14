function ViewToggle({ currentView, onChangeView }) {
  return (
    <section className="panel">
      <div className="view-toggle-wrap">
        <div>
          <h2 className="section-title">Vista dashboard</h2>
          <p className="muted-text">
            Scegli tra vista generale e dettaglio della zona.
          </p>
        </div>

        <div className="view-toggle">
          <button
            type="button"
            className={`view-toggle-btn ${currentView === 'overview' ? 'active' : ''}`}
            onClick={() => onChangeView('overview')}
            aria-pressed={currentView === 'overview'}
          >
            Vista generale
          </button>

          <button
            type="button"
            className={`view-toggle-btn ${currentView === 'map' ? 'active' : ''}`}
            onClick={() => onChangeView('map')}
            aria-pressed={currentView === 'map'}
          >
            Focus zona
          </button>
        </div>
      </div>
    </section>
  )
}

export default ViewToggle