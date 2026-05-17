import { useState, useEffect } from 'react'
import './App.css'
import Map from './components/Map'
import VenueList from './components/VenueList'
import AdminPanel from './components/AdminPanel'
import type { Venue, Category } from './types'

function App() {
  const [page, setPage] = useState<'home' | 'admin'>('home')
  const [venues, setVenues] = useState<Venue[]>([])
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [category, setCategory] = useState<string>('')
  const [loading, setLoading] = useState(false)

  // Auth states
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('authToken'))
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  // Categories
  const [categories, setCategories] = useState<Category[]>([])

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
      }, (error) => {
        console.log('Location access denied:', error)
        setUserLocation({ lat: 40.7128, lng: -74.0060 }) // NYC
      })
    }
  }, [])

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`)
        const data = await response.json()
        setCategories(data)
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }
    fetchCategories()
  }, [])

  // Verify auth token on mount
  useEffect(() => {
    if (authToken) {
      verifyAuth()
    }
  }, [authToken])

  const verifyAuth = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      if (response.ok) {
        await response.json()
      } else {
        setAuthToken(null)
        localStorage.removeItem('authToken')
      }
    } catch (error) {
      console.error('Error verifying auth:', error)
      setAuthToken(null)
      localStorage.removeItem('authToken')
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      })

      if (!response.ok) {
        const error = await response.json()
        setLoginError(error.error || 'Login failed')
        return
      }

      const { token } = await response.json()
      setAuthToken(token)
      localStorage.setItem('authToken', token)
      setLoginUsername('')
      setLoginPassword('')
    } catch (error) {
      setLoginError('Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleLogout = () => {
    setAuthToken(null)
    localStorage.removeItem('authToken')
    setPage('home')
  }

  // Fetch venues
  const fetchVenues = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (category) params.append('category', category)
      if (userLocation) {
        params.append('lat', userLocation.lat.toString())
        params.append('lng', userLocation.lng.toString())
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/venues?${params}`)
      const data = await response.json()
      setVenues(data)
    } catch (error) {
      console.error('Error fetching venues:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch venues when filters change
  useEffect(() => {
    if (userLocation) {
      fetchVenues()
    }
  }, [category, userLocation])

  return (
    <div className="app">
      <header className="header">
        <h1>🌍 EXO</h1>
        <nav>
          <button onClick={() => setPage('home')} className={page === 'home' ? 'active' : ''}>Home</button>
          {authToken && (
            <>
              <button onClick={() => setPage('admin')} className={page === 'admin' ? 'active' : ''}>Admin</button>
              <button onClick={handleLogout} style={{ marginLeft: 'auto', padding: '0.8rem 1.5rem', background: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(147, 51, 234, 0.3)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(147, 51, 234, 0.4)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(147, 51, 234, 0.3)' }}>Logout</button>
            </>
          )}
        </nav>
      </header>

      <main>
        {!authToken ? (
          // Login form
          <div className="login-container">
            <form onSubmit={handleLogin} className="login-form">
              <h2>Admin Login</h2>
              {loginError && <p className="error">{loginError}</p>}
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit">Login</button>
              <p style={{ textAlign: 'center', marginTop: '1rem', color: '#666', fontSize: '0.9rem' }}>
                Demo: username=<strong>admin</strong>, password=<strong>admin123</strong>
              </p>
            </form>
          </div>
        ) : page === 'home' ? (
          <div className="home">
            <div className="filters">
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
              {loading && <p>Loading...</p>}
            </div>

            <div className="content">
              {userLocation && <Map venues={venues} userLocation={userLocation} selectedVenue={selectedVenue} />}
              <VenueList venues={venues} onSelectVenue={setSelectedVenue} selectedVenue={selectedVenue} categories={categories} />
            </div>
          </div>
        ) : (
          <AdminPanel
            authToken={authToken}
            categories={categories}
            onCategoriesUpdated={() => {
              const fetchUpdatedCategories = async () => {
                try {
                  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`)
                  const data = await response.json()
                  setCategories(data)
                } catch (error) {
                  console.error('Error fetching categories:', error)
                }
              }
              fetchUpdatedCategories()
            }}
          />
        )}
      </main>
    </div>
  )
}

export default App
