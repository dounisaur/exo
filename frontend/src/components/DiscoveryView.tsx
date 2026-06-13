import { useState, useEffect } from 'react'
import { Settings, LogOut, MapPin, ChevronUp, ChevronDown } from 'lucide-react'
import Map from './Map'
import VenueCard from './VenueCard'
import VenueDetailPanel from './VenueDetailPanel'
import VenueDetailPage from './VenueDetailPage'
import FilterBar from './FilterBar'
import MobileVenueSheet from './MobileVenueSheet'
import type { Venue, Category, VenueComment } from '../types'

interface DiscoveryViewProps {
  venues: Venue[]
  categories: Category[]
  allCities: string[]
  userLocation?: { lat: number; lng: number }
  onStartHere?: (venue: Venue) => void
  onGenerateItinerary?: () => void
  authToken?: string | null
  onLogin?: () => void
  onLogout?: () => void
  onAdmin?: () => void
  selectedCity?: string
  onCityChange?: (city: string) => void
  selectedCategory?: string
  onCategoryChange?: (category: string) => void
  selectedRadius?: { min: number | null; max: number | null }
  onRadiusChange?: (radius: { min: number | null; max: number | null }) => void
}

export default function DiscoveryView({
  venues,
  categories,
  allCities,
  userLocation,
  onStartHere,
  onGenerateItinerary,
  authToken,
  onLogin,
  onLogout,
  onAdmin,
  selectedCity,
  onCityChange,
  selectedCategory,
  onCategoryChange,
  selectedRadius,
  onRadiusChange
}: DiscoveryViewProps) {
  const [selectedVenueId, setSelectedVenueId] = useState<number | null>(null)
  const [venueComments, setVenueComments] = useState<Record<number, VenueComment[]>>({})
  const [showDetailPage, setShowDetailPage] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false)

  const selectedVenue = venues.find(v => v.id === selectedVenueId) || null

  // Fetch comments for all venues
  useEffect(() => {
    venues.forEach(venue => {
      if (!venueComments[venue.id]) {
        fetchVenueComments(venue.id)
      }
    })
  }, [venues])

  const fetchVenueComments = async (venueId: number) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/venues/${venueId}/comments`)
      if (!response.ok) return
      const comments = await response.json()
      setVenueComments(prev => ({ ...prev, [venueId]: Array.isArray(comments) ? comments : [] }))
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const handleVenueSelect = (venue: Venue) => {
    setSelectedVenueId(venue.id)
    if (!isMobile) {
      setShowDetailPage(true)
    }
  }

  const handleBackToList = () => {
    setShowDetailPage(false)
    setSelectedVenueId(null)
  }

  const handleStartHere = (venue: Venue) => {
    onStartHere?.(venue)
  }


  // Handle responsive changes
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    // Check on mount in case window object wasn't available initially
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (isMobile) {
    // Mobile Layout: Header → Scrollable list (Plan My Itinerary + Filters + Venues) → Detail sheet overlay
    return (
      <div className="w-screen h-screen flex flex-col bg-white overflow-hidden">
        {/* Header */}
        <header className="text-white p-4 flex-shrink-0" style={{ backgroundColor: '#1e3a8a' }}>
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-lg font-bold">🍴 EXΩ 🍷</h1>
            <nav className="flex items-center gap-2">
              {!authToken && (
                <button
                  onClick={onLogin}
                  className="px-3 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
                >
                  Login
                </button>
              )}
              {authToken && (
                <>
                  <button
                    onClick={onAdmin}
                    className="p-2 hover:opacity-80 transition-opacity"
                    title="Admin"
                  >
                    <Settings size={18} />
                  </button>
                  <button
                    onClick={onLogout}
                    className="p-2 hover:opacity-80 transition-opacity"
                    title="Logout"
                  >
                    <LogOut size={18} />
                  </button>
                </>
              )}
            </nav>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* Plan My Itinerary Button */}
          <button
            onClick={onGenerateItinerary}
            className="w-full px-4 py-2.5 text-white rounded-lg font-medium transition-colors flex items-center justify-between gap-2 mb-2.5"
            style={{ backgroundColor: '#4f46e5' }}
          >
            <span>Plan My Itinerary</span>
            <MapPin size={20} />
          </button>

          {/* Filters Button */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="w-full px-4 py-2.5 text-white font-medium rounded-lg flex items-center justify-between gap-2 transition-colors mb-4"
            style={{ backgroundColor: '#f5841f' }}
          >
            <span>Filters</span>
            {showMobileFilters ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {/* Inline Filter Dropdowns */}
          {showMobileFilters && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3 mb-4">
              {/* City Dropdown */}
              {allCities.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">City</label>
                  <select
                    value={selectedCity || ''}
                    onChange={(e) => onCityChange?.(e.target.value)}
                    className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer"
                  >
                    <option value="">All Cities</option>
                    {allCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Category Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Venue</label>
                <select
                  value={selectedCategory || ''}
                  onChange={(e) => onCategoryChange?.(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Radius Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Radius</label>
                <select
                  value={selectedRadius?.min === null ? 'null-null' : `${selectedRadius?.min}-${selectedRadius?.max}`}
                  onChange={(e) => {
                    if (e.target.value === 'null-null') {
                      onRadiusChange?.({ min: null, max: null })
                    } else {
                      const [min, max] = e.target.value.split('-').map(Number)
                      onRadiusChange?.({ min, max })
                    }
                  }}
                  className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent cursor-pointer"
                >
                  <option value="null-null">None</option>
                  <option value="0-1">0 - 1 km</option>
                  <option value="1-5">1 - 5 km</option>
                  <option value="5-10">5 - 10 km</option>
                  <option value="10-20">10 - 20 km</option>
                  <option value="20-50">20 - 50 km</option>
                  <option value="50-100">50 - 100 km</option>
                </select>
              </div>
            </div>
          )}

          {/* Venue Cards */}
          <div>
            {venues.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-gray-500">
                <p>No venues found</p>
              </div>
            ) : (
              venues.map(venue => (
                <VenueCard
                  key={venue.id}
                  venue={venue}
                  categories={categories}
                  venueComments={venueComments[venue.id] || []}
                  onSelect={handleVenueSelect}
                  mobile={true}
                />
              ))
            )}
          </div>
        </div>

        {/* Mobile Venue Detail Sheet */}
        {selectedVenue && (
          <MobileVenueSheet
            venue={selectedVenue}
            categories={categories}
            comments={venueComments[selectedVenue.id] || []}
            userLocation={userLocation}
            onClose={() => setSelectedVenueId(null)}
            onStartHere={handleStartHere}
          />
        )}
      </div>
    )
  }

  // Desktop Layout: Header + Filters → 3 columns (sidebar, map, detail)
  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header
        className="text-white p-4 sticky top-0 z-30"
        style={{ backgroundColor: '#1e3a8a' }}
      >
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold">🍴 EXΩ 🍷</h1>
          <nav className="flex items-center gap-2">
            {!authToken && (
              <button
                onClick={onLogin}
                className="px-4 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
              >
                Login
              </button>
            )}
            {authToken && (
              <>
                <button
                  onClick={onAdmin}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
                >
                  <Settings size={18} />
                  <span>Admin</span>
                </button>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </>
            )}
          </nav>
        </div>
      </header>


      {/* Layout: 3-Column or Detail Page */}
      {showDetailPage && selectedVenue ? (
        // Detail Page replaces map + right panel
        <div className="flex flex-1 overflow-hidden gap-0">
        {/* Left: Sidebar with venue list */}
        <div className="border-r flex flex-col flex-shrink-0" style={{ width: '392px', backgroundColor: '#fafbff', borderColor: '#e7eaf4' }}>
          {/* Sidebar header */}
          <div className="px-4 py-2.5 bg-white">
            <button
              onClick={onGenerateItinerary}
              className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-between gap-2"
            >
              <span>Plan My Itinerary</span>
              <MapPin size={20} />
            </button>
          </div>

          {/* Filters */}
          <div style={{ borderBottomColor: '#e7eaf4', borderBottomWidth: '1px' }}>
            <FilterBar
              categories={categories}
              selectedCategory={selectedCategory || ''}
              selectedRadius={selectedRadius || { min: 0, max: 1 }}
              selectedCity={selectedCity || ''}
              cities={allCities}
              onCategoryChange={onCategoryChange || (() => {})}
              onRadiusChange={onRadiusChange || (() => {})}
              onCityChange={onCityChange || (() => {})}
            />
          </div>

          {/* Scrollable venue list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {venues.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>No venues found</p>
              </div>
            ) : (
              venues.map(venue => (
                <VenueCard
                  key={venue.id}
                  venue={venue}
                  categories={categories}
                  isSelected={selectedVenueId === venue.id}
                  venueComments={venueComments[venue.id] || []}
                  onSelect={handleVenueSelect}
                />
              ))
            )}
          </div>
        </div>

          {/* Detail Page - full width */}
          <div className="flex-1 overflow-hidden transition-all duration-300 ease-out">
            <VenueDetailPage
              venue={selectedVenue}
              categories={categories}
              userLocation={userLocation}
              comments={venueComments[selectedVenue.id] || []}
              onBack={handleBackToList}
              onStartHere={handleStartHere}
            />
          </div>
        </div>
      ) : (
        // Standard 3-Column Layout
        <div className="flex flex-1 overflow-hidden gap-0">
          {/* Left: Sidebar (same as above) */}
          <div className="border-r flex flex-col flex-shrink-0" style={{ width: '392px', backgroundColor: '#fafbff', borderColor: '#e7eaf4' }}>
            {/* Sidebar header */}
            <div className="px-4 py-2.5 bg-white">
              <button
                onClick={onGenerateItinerary}
                className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-between gap-2"
              >
                <span>Plan My Itinerary</span>
                <MapPin size={20} />
              </button>
            </div>

            {/* Filters */}
            <div style={{ borderBottomColor: '#e7eaf4', borderBottomWidth: '1px' }}>
              <FilterBar
                categories={categories}
                selectedCategory={selectedCategory || ''}
                selectedRadius={selectedRadius || { min: 0, max: 1 }}
                selectedCity={selectedCity || ''}
                cities={allCities}
                onCategoryChange={onCategoryChange || (() => {})}
                onRadiusChange={onRadiusChange || (() => {})}
                onCityChange={onCityChange || (() => {})}
              />
            </div>

            {/* Scrollable venue list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {venues.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>No venues found</p>
                </div>
              ) : (
                venues.map(venue => (
                  <VenueCard
                    key={venue.id}
                    venue={venue}
                    categories={categories}
                    isSelected={selectedVenueId === venue.id}
                    venueComments={venueComments[venue.id] || []}
                    onSelect={handleVenueSelect}
                  />
                ))
              )}
            </div>
          </div>

          {/* Center: Map */}
          <div className="relative flex-1 transition-all duration-200" style={{ backgroundColor: '#eef1f8', borderRightColor: selectedVenue ? '#e7eaf4' : 'transparent', borderRightWidth: '1px' }}>
            {userLocation && (
              <Map
                venues={venues}
                userLocation={userLocation}
                selectedVenue={selectedVenue}
                onVenueClick={handleVenueSelect}
              />
            )}
          </div>

          {/* Right: Detail Panel */}
          {selectedVenue && (
            <div className="bg-white flex-shrink-0 overflow-hidden flex flex-col transition-all duration-200" style={{ width: '384px' }}>
              <VenueDetailPanel
                venue={selectedVenue}
                categories={categories}
                userLocation={userLocation}
                comments={venueComments[selectedVenue.id] || []}
                onStartHere={handleStartHere}
                isEmbedded={true}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
