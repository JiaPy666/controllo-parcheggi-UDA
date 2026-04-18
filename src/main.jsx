import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import App from './App.jsx'
import UserPage from './pages/UserPage.jsx'
import LoginPage from './pages/LoginPage.jsx'

function Root() {
  const [mode, setMode] = useState('admin') // 'admin' | 'user'
  const [user, setUser] = useState(null)

  async function handleLogout() {
    await fetch('http://127.0.0.1:5000/api/auth/logout', { method: 'POST', credentials: 'include' })
    setUser(null)
  }

  return (
    <>
      <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 9999, display: 'flex', gap: 8 }}>
        <button onClick={() => setMode('admin')} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: mode === 'admin' ? '#2563eb' : '#e2e8f0', color: mode === 'admin' ? 'white' : '#0f172a', fontWeight: 700 }}>Admin</button>
        <button onClick={() => setMode('user')}  style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: mode === 'user'  ? '#2563eb' : '#e2e8f0', color: mode === 'user'  ? 'white' : '#0f172a', fontWeight: 700 }}>Utente</button>
      </div>
      {mode === 'admin'
        ? <App />
        : user
          ? <UserPage initialUser={user} onLogout={handleLogout} />
          : <LoginPage onLogin={setUser} />
      }
    </>
  )
}

createRoot(document.getElementById('root')).render(<StrictMode><Root /></StrictMode>)