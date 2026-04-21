import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import UserPage from './pages/UserPage.jsx'
import LoginPage from './pages/LoginPage.jsx'

const API = 'http://127.0.0.1:5000/api'

function Root() {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)

  // Al caricamento leggi l'utente da sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('parkuda_user')
      if (saved) {
        setUser(JSON.parse(saved))
      }
    } catch (e) {}
    setChecking(false)
  }, [])

  function handleLogin(loggedUser) {
    sessionStorage.setItem('parkuda_user', JSON.stringify(loggedUser))
    setUser(loggedUser)
  }

  function handleLogout() {
    sessionStorage.removeItem('parkuda_user')
    setUser(null)
  }

  if (checking) {
    return (
      <div style={{
        minHeight: '100vh', display: 'grid', placeItems: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #172554 100%)',
        color: 'white', fontSize: 18, fontFamily: 'system-ui'
      }}>
        ⏳ Caricamento…
      </div>
    )
  }

  // Non loggato → Login
  if (!user) return <LoginPage onLogin={handleLogin} />

  // Admin → dashboard admin
  if (user.role === 'admin') return <App user={user} onLogout={handleLogout} />

  // Utente normale → pagina prenotazioni
  return <UserPage initialUser={user} onLogout={handleLogout} />
}

createRoot(document.getElementById('root')).render(
  <StrictMode><Root /></StrictMode>
)
