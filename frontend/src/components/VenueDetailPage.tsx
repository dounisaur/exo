import { ArrowLeft, Phone, MapPin, Clock, Building2, Wallet, MessageCircle, ArrowUpRight } from 'lucide-react'
import { useState } from 'react'
import Map from './Map'
import type { Venue, Category, VenueComment } from '../types'

interface VenueDetailPageProps {
  venue: Venue
  categories: Category[]
  userLocation?: { lat: number; lng: number }
  comments?: VenueComment[]
  onBack: () => void
  onStartHere?: (venue: Venue) => void
}

export default function VenueDetailPage({
  venue,
  categories,
  userLocation,
  comments = [],
  onBack,
  onStartHere
}: VenueDetailPageProps) {
  const [showMap, setShowMap] = useState(false)

  const getSubcategoryName = (subcategoryId?: number) => {
    if (!subcategoryId || categories.length === 0) return null
    for (const category of categories) {
      const subcategory = category.subcategories.find(s => s.id === subcategoryId)
      if (subcategory) return subcategory.name
    }
    return null
  }

  const getTodayHours = (openingHours?: string): string | null => {
    if (!openingHours) return null
    try {
      const hours = JSON.parse(openingHours)
      const today = new Date().getDay().toString()
      const todayHours = hours[today]
      if (!todayHours || todayHours === 'CLOSED') return null
      return todayHours
    } catch {
      return null
    }
  }

  const getPriceDisplay = (venue: Venue): string | null => {
    if ((venue as any).price_level) {
      const level = parseInt((venue as any).price_level)
      return '$'.repeat(level)
    }
    if (venue.price_range) return venue.price_range
    return null
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <header className="text-white p-4 flex-shrink-0" style={{ backgroundColor: '#1e3a8a' }}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity"
            >
              <ArrowLeft size={20} />
              <span>Back to list</span>
            </button>
            <span className="text-sm font-medium opacity-60">/</span>
            <span className="text-sm font-medium">{venue.name}</span>
          </div>
          <span className="text-sm font-medium">Login</span>
        </div>
      </header>

      {/* Content - Two Column Layout */}
      <div className="flex-1 overflow-hidden flex gap-7 p-7">
        {/* Left Column */}
        <div className="flex-1 overflow-y-auto pr-4">
          {/* Name */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{venue.name}</h1>

          {/* Category Pill */}
          <div className="mb-4">
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              {getSubcategoryName(venue.subcategory_id) || venue.category}
            </span>
          </div>

          {/* Info Rows */}
          <div className="space-y-2 mb-6">
            {getPriceDisplay(venue) && (
              <div className="flex items-center gap-3">
                <Wallet size={18} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm text-green-600 font-medium">{getPriceDisplay(venue)}</span>
              </div>
            )}
            {venue.canonical_city && (
              <div className="flex items-center gap-3">
                <Building2 size={18} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700">{venue.canonical_city}</span>
              </div>
            )}
            {venue.address && (
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{venue.address}</span>
              </div>
            )}
            {venue.opening_hours && getTodayHours(venue.opening_hours) && (
              <div className="flex items-center gap-3">
                <Clock size={18} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700">{getTodayHours(venue.opening_hours)}</span>
              </div>
            )}
          </div>

          {/* Rating */}
          {venue.rating && (
            <div className="flex items-center gap-2 mb-6">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => {
                  const fillPercentage = Math.min(Math.max((venue.rating || 0) - i, 0), 1)
                  return (
                    <div key={i} className="relative">
                      <span className="text-xl text-gray-300">★</span>
                      <div
                        className="absolute top-0 left-0 overflow-hidden text-yellow-500"
                        style={{ width: `${fillPercentage * 100}%` }}
                      >
                        <span className="text-xl">★</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <span className="text-sm font-semibold text-gray-700 ml-2">
                {venue.rating.toFixed(1)}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mb-6">
            {venue.phone_number && (
              <a
                href={`tel:${venue.phone_number}`}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
              >
                <Phone size={16} />
                <span>Call</span>
              </a>
            )}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(venue.address || venue.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
            >
              <ArrowUpRight size={16} />
              <span>Directions</span>
            </a>
            <button
              onClick={() => setShowMap(!showMap)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {showMap ? 'Hide' : 'View'} map
            </button>
          </div>

          {/* About */}
          <div className="mb-6 pb-6 border-b border-blue-100">
            <h4 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-widest">About</h4>
            <p className="text-sm text-gray-600 italic">Coming soon</p>
          </div>

          {/* Comments */}
          {comments.length > 0 && (
            <div className="mt-8">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <MessageCircle size={16} />
                Comments ({comments.length})
              </h4>
              <div className="space-y-2">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-3 bg-gray-50 rounded-lg border border-blue-100">
                    <p className="text-sm text-gray-700">{comment.content}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="w-96 flex flex-col gap-6 flex-shrink-0">
          {/* Map */}
          {userLocation && venue.latitude && venue.longitude && (
            <div className="relative h-64 bg-gray-200 rounded-lg overflow-hidden border border-blue-100">
              <Map
                venues={[venue]}
                userLocation={userLocation}
                selectedVenue={venue}
                onVenueClick={() => {}}
              />
            </div>
          )}

          {/* Info Card */}
          <div className="border border-blue-100 rounded-lg p-6 space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Address</p>
              <p className="text-sm text-gray-900">{venue.address}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Hours</p>
              <p className="text-sm text-gray-900">{getTodayHours(venue.opening_hours) || 'Closed today'}</p>
            </div>
            {getPriceDisplay(venue) && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Price</p>
                <p className="text-sm text-green-600 font-medium">{getPriceDisplay(venue)}</p>
              </div>
            )}
            {venue.canonical_city && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">City</p>
                <p className="text-sm text-gray-900">{venue.canonical_city}</p>
              </div>
            )}
          </div>

          {/* Start Here Button */}
          {onStartHere && (
            <button
              onClick={() => onStartHere(venue)}
              className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Start Here
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
