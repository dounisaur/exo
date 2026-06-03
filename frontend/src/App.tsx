import { useState, useEffect } from 'react'
import { Settings, LogOut, Search } from 'lucide-react'
import VenueList from './components/VenueList'
import AdminPanel from './components/AdminPanel'
import type { Venue, Category } from './types'

function App() {
  const [page, setPage] = useState<'home' | 'login' | 'admin'>('home')
  const [venues, setVenues] = useState<Venue[]>([])
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [category, setCategory] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('authToken'))
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
      }, () => {
        setUserLocation({ lat: 40.7128, lng: -74.0060 })
      })
    }
  }, [])

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
      if (!response.ok) {
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
      setPage('admin')
    } catch (error) {
      setLoginError('Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleLogout = () => {
    setAuthToken(null)
    localStorage.removeItem('authToken')
    setPage('home')
  }

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

  useEffect(() => {
    if (userLocation) {
      fetchVenues()
    }
  }, [category, userLocation])

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Login Page */}
      {page === 'login' && (
        <div className="flex items-center justify-center min-h-screen px-4 bg-gray-50">
          <form
            onSubmit={handleLogin}
            className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow-lg border border-gray-200"
          >
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Sign in to EXΩ</h2>
              <p className="mt-2 text-sm text-gray-600">Manage venues and categories</p>
            </div>

            {loginError && (
              <div className="rounded-lg bg-red-50 p-4 border border-red-200">
                <p className="text-sm font-medium text-red-800">{loginError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="input-field"
                  placeholder="admin"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button type="submit" className="w-full btn-primary">
              Sign in
            </button>

            <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
              <p className="text-sm text-gray-600">
                <strong>Demo credentials:</strong> <br />
                Username: <code className="bg-blue-100 px-2 py-1 rounded text-blue-900 font-mono text-xs">admin</code> <br />
                Password: <code className="bg-blue-100 px-2 py-1 rounded text-blue-900 font-mono text-xs">admin123</code>
              </p>
            </div>

            {authToken && (
              <button
                type="button"
                onClick={() => setPage('home')}
                className="w-full btn-secondary"
              >
                Back to Home
              </button>
            )}
          </form>
        </div>
      )}

      {/* Home - List View */}
      {page === 'home' && (
        <div className="flex flex-col h-full">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-20">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-xl font-bold text-gray-900">🍴 EXΩ 🍷</h1>
              <nav className="flex items-center gap-2">
                {!authToken && (
                  <button
                    onClick={() => setPage('login')}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Login
                  </button>
                )}
                {authToken && (
                  <>
                    <button
                      onClick={() => setPage('admin')}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <Settings size={18} />
                      <span className="hidden sm:inline">Dashboard</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                    >
                      <LogOut size={18} />
                      <span className="hidden sm:inline">Logout</span>
                    </button>
                  </>
                )}
              </nav>
            </div>
          </header>

          {/* Search & Filters */}
          <div className="bg-white border-b border-gray-200 p-4 sticky top-16 z-10 space-y-3">
            {/* Search Bar */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search Our Database"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field flex-1"
              />
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Search size={18} />
              </button>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCategory('')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  category === ''
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.slug)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    category === cat.slug
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {loading && <p className="text-xs text-gray-600">Loading venues...</p>}
          </div>

          {/* Venues List */}
          <div className="flex-1 overflow-y-auto">
            <VenueList
              venues={venues.filter(venue =>
                searchTerm === ''
                  ? true
                  : venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    venue.address?.toLowerCase().includes(searchTerm.toLowerCase())
              )}
              categories={categories}
              userLocation={userLocation || undefined}
            />
          </div>
        </div>
      )}

      {/* Admin */}
      {page === 'admin' && authToken && (
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
          onViewHome={() => setPage('home')}
        />
      )}
    </div>
  )
}

export default App
