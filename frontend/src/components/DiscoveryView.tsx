import { useState, useEffect } from 'react'
import { Settings, LogOut } from 'lucide-react'
import Map from './Map'
import VenueCard from './VenueCard'
import VenueDetailPanel from './VenueDetailPanel'
import FilterBar from './FilterBar'
import BottomSheet from './BottomSheet'
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
  const [showFiltersSheet, setShowFiltersSheet] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

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
  }

  const handleStartHere = (venue: Venue) => {
    onStartHere?.(venue)
  }


  // Handle responsive changes
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (isMobile) {
    // Mobile Layout: Header → Controls → Map → Bottom Sheet
    return (
      <div className="flex flex-col h-screen bg-white">
        {/* Header */}
        <header className="bg-cobalt text-white p-4 sticky top-0 z-30">
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


        {/* Map */}
        <div className="flex-1 relative">
          {userLocation && (
            <Map
              venues={venues}
              userLocation={userLocation}
              selectedVenue={selectedVenue}
              onVenueClick={handleVenueSelect}
            />
          )}
        </div>

        {/* Bottom Sheet with Venue List */}
        <BottomSheet
          isOpen={true}
          title={`${venues.length} place${venues.length !== 1 ? 's' : ''}`}
          onClose={() => {}}
        >
          <div className="space-y-2 p-4">
            {venues.map(venue => (
              <VenueCard
                key={venue.id}
                venue={venue}
                categories={categories}
                isSelected={selectedVenueId === venue.id}
                venueComments={venueComments[venue.id] || []}
                onSelect={handleVenueSelect}
              />
            ))}
          </div>
        </BottomSheet>

        {/* Filters Sheet */}
        {showFiltersSheet && (
          <BottomSheet
            isOpen={showFiltersSheet}
            title="Filters"
            onClose={() => setShowFiltersSheet(false)}
          >
            <div className="p-4">
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
          </BottomSheet>
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


      {/* 3-Column Layout (map expands when no venue selected) */}
      <div className="flex flex-1 overflow-hidden gap-0">
        {/* Left: Sidebar with venue list */}
        <div className="border-r flex flex-col flex-shrink-0" style={{ width: '392px', backgroundColor: '#fafbff', borderColor: '#e7eaf4' }}>
          {/* Sidebar header */}
          <div className="px-4 pt-4 pb-3 bg-white">
            <button
              onClick={onGenerateItinerary}
              className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Plan My Itinerary
            </button>
          </div>

          {/* Filters */}
          <div className="pb-0" style={{ borderBottomColor: '#e7eaf4', borderBottomWidth: '1px' }}>
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

        {/* Center: Map (expands when no venue selected) */}
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

        {/* Right: Detail Panel (only show when venue selected) */}
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
    </div>
  )
}
