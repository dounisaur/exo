import { useState, useEffect } from 'react'
import { Settings, LogOut, MapPin, ChevronUp, ChevronDown, UtensilsCrossed, Wine } from 'lucide-react'
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
  const [isAnimatingOut, setIsAnimatingOut] = useState(false)
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
    setIsAnimatingOut(true)
    // Wait for animation to complete before unmounting
    setTimeout(() => {
      setShowDetailPage(false)
      setIsAnimatingOut(false)
      setSelectedVenueId(null)
    }, 400)
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
        <header className="p-4 flex-shrink-0" style={{ backgroundColor: 'var(--ink)', height: 'calc(max(64px, env(safe-area-inset-top) + 64px))' }}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1">
              <UtensilsCrossed size={24} style={{ color: 'var(--sage)' }} strokeWidth={1.5} />
              <h1 className="text-lg font-bold" style={{ fontFamily: 'Schibsted Grotesk, sans-serif', fontWeight: 800, color: 'var(--ink-on-dark)' }}>EXΩ</h1>
              <Wine size={24} style={{ color: 'var(--terracotta)', marginLeft: '-2px' }} strokeWidth={1.5} />
            </div>
            <nav className="flex items-center gap-2">
              {!authToken && (
                <button
                  onClick={onLogin}
                  className="px-3 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--ink-on-dark)' }}
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
                    style={{ color: 'var(--nav-muted)' }}
                  >
                    <Settings size={18} />
                  </button>
                  <button
                    onClick={onLogout}
                    className="p-2 hover:opacity-80 transition-opacity"
                    title="Logout"
                    style={{ color: 'var(--nav-muted)' }}
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
            className="w-full px-4 py-2.5 text-white rounded-[13px] font-medium font-600 transition-colors flex items-center justify-between gap-2 mb-2.5"
            style={{ backgroundColor: 'var(--terracotta)', boxShadow: '0 14px 26px -14px rgba(199, 91, 63, 0.7)', fontSize: '15.5px' }}
          >
            <span>Plan My Itinerary</span>
            <MapPin size={20} />
          </button>

          {/* Filters Button */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="w-full px-4 py-2.5 text-white font-medium rounded-lg flex items-center justify-between gap-2 transition-colors mb-4 hover:opacity-90"
            style={{ backgroundColor: '#6f8f6a' }}
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
                <p>Venues Loading...</p>
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
        className="p-4 sticky top-0 z-30"
        style={{ backgroundColor: 'var(--ink)', height: '64px' }}
      >
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <UtensilsCrossed size={32} style={{ color: 'var(--sage)' }} strokeWidth={1.5} />
              <h1 className="text-xl font-bold" style={{ fontFamily: 'Schibsted Grotesk, sans-serif', fontWeight: 800, color: 'var(--ink-on-dark)' }}>EXΩ</h1>
              <Wine size={32} style={{ color: 'var(--terracotta)', marginLeft: '-4px' }} strokeWidth={1.5} />
            </div>
          <nav className="flex items-center gap-2">
            {!authToken && (
              <button
                onClick={onLogin}
                className="px-4 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
                style={{ color: 'var(--ink-on-dark)' }}
              >
                Login
              </button>
            )}
            {authToken && (
              <>
                <button
                  onClick={onAdmin}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--nav-muted)' }}
                >
                  <Settings size={18} />
                  <span>Admin</span>
                </button>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--nav-muted)' }}
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
      <div className="flex flex-1 overflow-hidden gap-0">
        {/* Left: Sidebar with venue list */}
        <div className="border-r flex flex-col flex-shrink-0" style={{ width: '392px', backgroundColor: '#fafbff', borderColor: '#e7eaf4' }}>
          {/* Sidebar header */}
          <div className="px-4 py-2.5 bg-white">
            <button
              onClick={onGenerateItinerary}
              className="w-full px-4 py-2.5 text-white rounded-[13px] font-medium transition-colors flex items-center justify-between gap-2 hover:opacity-90"
              style={{ backgroundColor: 'var(--terracotta)', boxShadow: '0 14px 26px -14px rgba(199, 91, 63, 0.7)', fontSize: '15.5px', fontWeight: 600 }}
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
                <p>Venues Loading...</p>
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

        {/* Center: Map and Right: Detail Panel (toggles based on showDetailPage) */}
        {(showDetailPage || isAnimatingOut) && selectedVenue ? (
          // Detail Page - full width with slide-in/out animation
          <div className="flex-1 overflow-hidden" style={{
            animation: isAnimatingOut ? 'slideOutToRight 0.4s cubic-bezier(0.32, 0.72, 0, 1) forwards' : 'slideInFromRight 0.4s cubic-bezier(0.32, 0.72, 0, 1) forwards'
          }}>
            <VenueDetailPage
              venue={selectedVenue}
              categories={categories}
              userLocation={userLocation}
              comments={venueComments[selectedVenue.id] || []}
              onBack={handleBackToList}
              onStartHere={handleStartHere}
            />
          </div>
        ) : (
          // Standard 3-Column Layout
          <>
            {/* Center: Map */}
            <div className="relative flex-1 transition-all duration-200" style={{ backgroundColor: '#eef1f8', borderRightColor: selectedVenue ? '#e7eaf4' : 'transparent', borderRightWidth: '1px' }}>
              {userLocation && (
                <Map
                  venues={venues}
                  userLocation={userLocation}
                  selectedVenue={selectedVenue}
                  onVenueClick={handleVenueSelect}
                  categories={categories}
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
          </>
        )}
      </div>
    </div>
  )
}
