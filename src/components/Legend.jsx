function Legend() {
  const items = [
    {
      label: 'Libero',
      description: 'Disponibile per un nuovo veicolo.',
      color: 'var(--success)',
    },
    {
      label: 'Occupato',
      description: 'Posto attualmente in uso.',
      color: 'var(--danger)',
    },
    {
      label: 'Manutenzione',
      description: 'Temporaneamente non utilizzabile.',
      color: 'var(--warning)',
    },
    {
      label: 'Disabili',
      description: 'Area riservata o prioritaria.',
      color: 'var(--info)',
    },
    {
      label: 'Speciale / Altro',
      description: 'Caso speciale o non standard.',
      color: 'var(--neutral)',
    },
  ]

  return (
    <section className="card">
      <div className="summary-header">
        <div>
          <h2 className="section-title">Legenda stati</h2>
          <p className="muted-text">
            Riferimento rapido ai colori usati nella mappa e nella griglia del parcheggio.
          </p>
        </div>
      </div>

      <div className="legend-grid">
        {items.map((item) => (
          <article key={item.label} className="legend-item">
            <span
              className="legend-color"
              style={{ backgroundColor: item.color }}
              aria-hidden="true"
            />
            <div>
              <strong>{item.label}</strong>
              <p className="muted-text">{item.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default Legend