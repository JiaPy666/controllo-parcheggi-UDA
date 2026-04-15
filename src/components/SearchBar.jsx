function SearchBar({ searchTerm, onSearchChange, onSearchSubmit }) {
  function handleSubmit(event) {
    event.preventDefault()
    onSearchSubmit()
  }

  return (
    <section className="card search-card">
      <form className="search-form" onSubmit={handleSubmit}>
        <div className="search-form-main">
          <label className="filter-field search-field">
            <span className="filter-label">Ricerca posto</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Es. A001"
            />
          </label>

          <button type="submit" className="btn-primary">
            Cerca
          </button>
        </div>

        <p className="muted-text">
          Puoi cercare rapidamente un posto specifico usando il suo codice univoco.
        </p>
      </form>
    </section>
  )
}

export default SearchBar