import { Phone, MapPin, Clock, Building2, Wallet, MessageCircle, ArrowUpRight, X } from 'lucide-react'
import { useState } from 'react'
import Map from './Map'
import type { Venue, Category, VenueComment } from '../types'

interface VenueDetailPanelProps {
  venue: Venue | null
  categories: Category[]
  userLocation?: { lat: number; lng: number }
  comments?: VenueComment[]
  onStartHere?: (venue: Venue) => void
  onClose?: () => void
  isEmbedded?: boolean
}

export default function VenueDetailPanel({
  venue,
  categories,
  userLocation,
  comments = [],
  onStartHere,
  onClose,
  isEmbedded = false
}: VenueDetailPanelProps) {
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

  if (!venue) {
    return isEmbedded ? null : (
      <div className="flex items-center justify-center p-8 text-gray-500">
        <p>Select a venue to view details</p>
      </div>
    )
  }

  return (
    <div className={`bg-white flex flex-col h-full`} style={{ borderLeft: isEmbedded ? `1px solid var(--border)` : 'none' }}>
      {/* Close button for modal */}
      {!isEmbedded && onClose && (
        <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid var(--border)` }}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>Details</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:opacity-80"
            style={{ background: 'var(--surface)' }}
          >
            <X size={20} style={{ color: 'var(--muted)' }} />
          </button>
        </div>
      )}

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* Venue Name */}
        <h3 className="text-xl md:text-2xl font-bold mb-3" style={{ color: 'var(--ink)' }}>{venue.name}</h3>

        {/* Category Pill */}
        <div className="mb-4">
          <span className="inline-block px-3 py-1 rounded-full text-sm font-medium" style={{ background: 'var(--terracotta-tint)', color: 'var(--terracotta-press)' }}>
            {getSubcategoryName(venue.subcategory_id) || venue.category}
          </span>
        </div>

        {/* Info Rows */}
        <div className="space-y-3 mb-6">
          {getPriceDisplay(venue) && (
            <div className="flex items-center gap-3">
              <Wallet size={18} style={{ color: 'var(--muted)' }} className="flex-shrink-0" />
              <span className="text-sm font-medium" style={{ color: 'var(--sage)' }}>{getPriceDisplay(venue)}</span>
            </div>
          )}
          {venue.canonical_city && (
            <div className="flex items-center gap-3">
              <Building2 size={18} style={{ color: 'var(--muted)' }} className="flex-shrink-0" />
              <span className="text-sm" style={{ color: 'var(--text)' }}>{venue.canonical_city}</span>
            </div>
          )}
          {venue.address && (
            <div className="flex items-start gap-3">
              <MapPin size={18} style={{ color: 'var(--muted)' }} className="flex-shrink-0 mt-0.5" />
              <span className="text-sm" style={{ color: 'var(--text)' }}>{venue.address}</span>
            </div>
          )}
          {venue.opening_hours && getTodayHours(venue.opening_hours) && (
            <div className="flex items-center gap-3">
              <Clock size={18} style={{ color: 'var(--muted)' }} className="flex-shrink-0" />
              <span className="text-sm" style={{ color: 'var(--text)' }}>{getTodayHours(venue.opening_hours)}</span>
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
                    <span className="text-xl" style={{ color: 'var(--star-empty)' }}>★</span>
                    <div
                      className="absolute top-0 left-0 overflow-hidden"
                      style={{ width: `${fillPercentage * 100}%`, color: 'var(--honey)' }}
                    >
                      <span className="text-xl">★</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <span className="text-sm font-semibold ml-2" style={{ color: 'var(--honey-text)' }}>
              {venue.rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          {venue.phone_number && (
            <a
              href={`tel:${venue.phone_number}`}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[13px] text-sm font-medium transition-colors hover:opacity-90"
              style={{ background: 'var(--sage)', color: 'white', fontSize: '15.5px', fontWeight: 600, boxShadow: '0 12px 22px -14px rgba(111, 143, 106, 0.8)' }}
            >
              <Phone size={16} />
              <span>Call</span>
            </a>
          )}
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(venue.address || venue.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[13px] text-sm font-medium transition-all duration-200 hover:shadow-md hover:border-opacity-80"
            style={{ background: 'var(--surface)', color: 'var(--ink)', fontSize: '15.5px', fontWeight: 600, border: '1px solid var(--border-strong)' }}
          >
            <ArrowUpRight size={16} />
            <span>Directions</span>
          </a>
        </div>

        {/* About Section */}
        <div className="mb-6 pb-6" style={{ borderBottom: `1px solid var(--border)` }}>
          <h4 className="text-sm font-bold mb-2 uppercase tracking-widest" style={{ color: 'var(--ink)' }}>About</h4>
          <p className="text-sm italic" style={{ color: 'var(--muted)' }}>Coming soon</p>
        </div>

        {/* Map Toggle */}
        {userLocation && venue.latitude && venue.longitude && (
          <div className={showMap ? 'mb-6' : ''}>
            <button
              onClick={() => setShowMap(!showMap)}
              className="w-full px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors hover:opacity-90"
              style={{ background: 'var(--terracotta)', marginBottom: showMap ? '12px' : '0', boxShadow: '0 14px 26px -14px rgba(199, 91, 63, 0.7)' }}
            >
              {showMap ? 'Hide Map' : 'View Map'}
            </button>
            {showMap && (
              <div className="relative h-64 rounded-lg overflow-hidden" style={{ background: 'var(--canvas)', border: `1px solid var(--border)` }}>
                <Map
                  venues={[venue]}
                  userLocation={userLocation}
                  selectedVenue={venue}
                  onVenueClick={() => {}}
                />
              </div>
            )}
          </div>
        )}

        {/* Comments Section */}
        {comments.length > 0 && (
          <div className="mt-8">
            <h4 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--ink)' }}>
              <MessageCircle size={16} />
              Comments ({comments.length})
            </h4>
            <div className="space-y-2">
              {comments.map((comment) => (
                <div key={comment.id} className="p-3 rounded-lg" style={{ background: 'var(--surface)', border: `1px solid var(--border)` }}>
                  <p className="text-sm" style={{ color: 'var(--text)' }}>{comment.content}</p>
                  <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
                    {new Date(comment.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Start Here Button (sticky footer) */}
      {onStartHere && (
        <div className="border-t p-4 bg-white" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => onStartHere(venue)}
            className="w-full px-4 py-2 text-white rounded-[13px] text-sm font-medium transition-colors hover:opacity-90"
            style={{ background: 'var(--terracotta)', fontSize: '15.5px', fontWeight: 600, boxShadow: '0 14px 26px -14px rgba(199, 91, 63, 0.7)' }}
          >
            Start Here
          </button>
        </div>
      )}
    </div>
  )
}
