import { useState, useEffect } from 'react'
import './App.css'
import Map from './components/Map'
import VenueList from './components/VenueList'
import AdminPanel from './components/AdminPanel'
import type { Venue } from './types'

function App() {
  const [page, setPage] = useState<'home' | 'admin'>('home')
  const [venues, setVenues] = useState<Venue[]>([])
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [category, setCategory] = useState<string>('')
  const [loading, setLoading] = useState(false)

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
        // Default to a location if denied
        setUserLocation({ lat: 40.7128, lng: -74.0060 }) // NYC
      })
    }
  }, [])

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

  const handleVenueAdded = () => {
    fetchVenues()
    setPage('home')
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🌍 EXO</h1>
        <nav>
          <button onClick={() => setPage('home')} className={page === 'home' ? 'active' : ''}>Home</button>
          <button onClick={() => setPage('admin')} className={page === 'admin' ? 'active' : ''}>Admin</button>
        </nav>
      </header>

      <main>
        {page === 'home' ? (
          <div className="home">
            <div className="filters">
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All Categories</option>
                <option value="food">Food</option>
                <option value="bar">Bar</option>
                <option value="concert">Concert</option>
                <option value="cafe">Cafe</option>
              </select>
              {loading && <p>Loading...</p>}
            </div>

            <div className="content">
              {userLocation && <Map venues={venues} userLocation={userLocation} selectedVenue={selectedVenue} />}
              <VenueList venues={venues} onSelectVenue={setSelectedVenue} selectedVenue={selectedVenue} />
            </div>
          </div>
        ) : (
          <AdminPanel onVenueAdded={handleVenueAdded} />
        )}
      </main>
    </div>
  )
}

export default App
