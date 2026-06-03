import { useState, useEffect } from 'react'
import { Settings, LogOut } from 'lucide-react'
import Map from './components/Map'
import VenueList from './components/VenueList'
import AdminPanel from './components/AdminPanel'
import BottomTabBar from './components/BottomTabBar'
import type { Venue, Category } from './types'

function App() {
  const [page, setPage] = useState<'home' | 'login' | 'admin'>('home')
  const [venues, setVenues] = useState<Venue[]>([])
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [category, setCategory] = useState<string>('')
  const [loading, setLoading] = useState(false)

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
      {/* Header */}
      {(page === 'home' || page === 'login') && (
        <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between px-4 py-4 md:px-6">
            <h1 className="text-2xl font-bold text-gray-900">🌍 EXO</h1>
            <nav className="flex items-center gap-2">
              {!authToken && page === 'home' && (
                <button
                  onClick={() => setPage('login')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Login
                </button>
              )}
              {!authToken && page === 'login' && (
                <button
                  onClick={() => setPage('home')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Back
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
      )}

      {/* Admin Header */}
      {page === 'admin' && authToken && (
        <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between px-4 py-4 md:px-6">
            <h1 className="text-2xl font-bold text-gray-900">🌍 EXO Admin</h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </header>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        {page === 'login' && (
          <div className="flex items-center justify-center min-h-full px-4">
            <form
              onSubmit={handleLogin}
              className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow-lg border border-gray-200"
            >
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Sign in to EXO</h2>
                <p className="mt-2 text-sm text-gray-600">Manage venues and categories</p>
              </div>

              {loginError && (
                <div className="rounded-lg bg-red-50 p-4 border border-red-200">
                  <p className="text-sm font-medium text-red-800">{loginError}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
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

              <button
                type="submit"
                className="w-full btn-primary"
              >
                Sign in
              </button>

              <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
                <p className="text-sm text-gray-600">
                  <strong>Demo credentials:</strong> <br />
                  Username: <code className="bg-blue-100 px-2 py-1 rounded text-blue-900 font-mono text-xs">admin</code> <br />
                  Password: <code className="bg-blue-100 px-2 py-1 rounded text-blue-900 font-mono text-xs">admin123</code>
                </p>
              </div>
            </form>
          </div>
        )}

        {page === 'home' && (
          <div className="flex flex-col h-full md:flex-row gap-0 md:gap-4 md:p-4">
            {/* Map on desktop or when filters closed on mobile */}
            <div className="flex-1 flex flex-col min-h-0">
              {userLocation && (
                <Map
                  venues={venues}
                  userLocation={userLocation}
                  selectedVenue={selectedVenue}
                />
              )}
            </div>

            {/* Venue list - sidebar on desktop, sheet on mobile */}
            <div className="hidden md:flex md:flex-col md:w-96 min-h-0">
              <div className="p-4 border-b border-gray-200">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Filter by Category</label>
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
                </div>
                {loading && <p className="mt-3 text-sm text-gray-600">Loading venues...</p>}
              </div>
              <div className="flex-1 overflow-auto">
                <VenueList
                  venues={venues}
                  onSelectVenue={setSelectedVenue}
                  selectedVenue={selectedVenue}
                  categories={categories}
                />
              </div>
            </div>

            {/* Mobile: Bottom sheet for venues and filters */}
            <div className="fixed md:hidden bottom-16 left-0 right-0 bg-white rounded-t-2xl shadow-lg border-t border-gray-200 max-h-1/2 overflow-auto">
              <div className="p-4 space-y-3 sticky top-0 bg-white border-b border-gray-200 rounded-t-2xl">
                <label className="block text-sm font-medium text-gray-700">Filter by Category</label>
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
                {loading && <p className="text-sm text-gray-600">Loading venues...</p>}
              </div>
              <VenueList
                venues={venues}
                onSelectVenue={setSelectedVenue}
                selectedVenue={selectedVenue}
                categories={categories}
              />
            </div>
          </div>
        )}

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
          />
        )}
      </main>

      {/* Mobile Bottom Tab Bar */}
      {page === 'home' && <BottomTabBar currentPage={page} onNavigate={setPage} />}
    </div>
  )
}

export default App
