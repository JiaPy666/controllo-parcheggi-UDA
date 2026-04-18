import { useState } from 'react'
import '../App.css'
import './UserPage.css'

const API = 'http://127.0.0.1:5000/api'

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', plate: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit() {
    setError('')
    setLoading(true)
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register'
      const body = mode === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password, phone: form.phone, plate: form.plate }

      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Errore durante l\'operazione')
        return
      }
      onLogin(data.user)
    } catch (e) {
      setError('Errore di rete. Assicurati che il backend sia avviato.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo / Header */}
        <div className="login-header">
          <div className="login-logo">🅿</div>
          <h1 className="login-title">ParkUDA</h1>
          <p className="login-subtitle">Sistema di prenotazione parcheggio aeroporto</p>
        </div>

        {/* Tab switcher */}
        <div className="login-tabs">
          <button
            type="button"
            className={`login-tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError('') }}
          >
            Accedi
          </button>
          <button
            type="button"
            className={`login-tab-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setError('') }}
          >
            Registrati
          </button>
        </div>

        {/* Form */}
        <div className="login-form">
          {mode === 'register' && (
            <label className="login-field">
              <span className="modal-label">Nome completo</span>
              <input
                type="text"
                name="name"
                placeholder="Mario Rossi"
                value={form.name}
                onChange={handleChange}
              />
            </label>
          )}

          <label className="login-field">
            <span className="modal-label">Email</span>
            <input
              type="email"
              name="email"
              placeholder="mario@email.com"
              value={form.email}
              onChange={handleChange}
            />
          </label>

          <label className="login-field">
            <span className="modal-label">Password</span>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
            />
          </label>

          {mode === 'register' && (
            <>
              <label className="login-field">
                <span className="modal-label">Telefono (opzionale)</span>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+39 333 1234567"
                  value={form.phone}
                  onChange={handleChange}
                />
              </label>
              <label className="login-field">
                <span className="modal-label">Targa veicolo (opzionale)</span>
                <input
                  type="text"
                  name="plate"
                  placeholder="AB123CD"
                  value={form.plate}
                  onChange={handleChange}
                  style={{ textTransform: 'uppercase' }}
                />
              </label>
            </>
          )}

          {error && (
            <div className="login-error">
              ⚠️ {error}
            </div>
          )}

          <button
            type="button"
            className="btn-primary login-submit"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? '⏳ Attendere…'
              : mode === 'login' ? '🔑 Accedi' : '✅ Crea account'}
          </button>
        </div>

        {/* Footer */}
        <p className="login-footer">
          {mode === 'login'
            ? <>Non hai un account? <button type="button" className="login-link" onClick={() => setMode('register')}>Registrati</button></>
            : <>Hai già un account? <button type="button" className="login-link" onClick={() => setMode('login')}>Accedi</button></>
          }
        </p>
      </div>
    </div>
  )
}
