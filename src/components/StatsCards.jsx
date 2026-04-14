function StatsCards({ summary }) {
  const cards = [
    {
      title: 'Totale posti',
      value: summary.total,
      description: 'Capacità complessiva del parcheggio aeroportuale.',
      icon: '🅿️',
      accentClass: 'stat-total',
    },
    {
      title: 'Posti liberi',
      value: summary.free,
      description: 'Disponibili subito per nuovi veicoli in ingresso.',
      icon: '✅',
      accentClass: 'stat-free',
    },
    {
      title: 'Posti occupati',
      value: summary.occupied,
      description: 'Attualmente assegnati o occupati nel sistema.',
      icon: '🚗',
      accentClass: 'stat-occupied',
    },
    {
      title: 'In manutenzione',
      value: summary.maintenance,
      description: 'Temporaneamente non utilizzabili o bloccati.',
      icon: '🛠️',
      accentClass: 'stat-maintenance',
    },
  ]

  return (
    <section className="stats-grid">
      {cards.map((card) => (
        <article key={card.title} className={`stat-card card ${card.accentClass}`}>
          <div className="stat-card-top">
            <span className="stat-icon" aria-hidden="true">
              {card.icon}
            </span>
            <h2 className="stat-title">{card.title}</h2>
          </div>

          <strong className="stat-value">{card.value}</strong>
          <p className="muted-text">{card.description}</p>
        </article>
      ))}
    </section>
  )
}

export default StatsCards