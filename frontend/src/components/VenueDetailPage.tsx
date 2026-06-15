import { ArrowLeft, Phone, MapPin, Clock, Building2, Wallet, MessageCircle, ArrowUpRight, ChevronDown, Maximize2, Minimize2 } from 'lucide-react'
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
  const [showComments, setShowComments] = useState(false)
  const [expandedMap, setExpandedMap] = useState(false)

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
    <div className="h-full w-full flex flex-col bg-white overflow-hidden">
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 28px', height: '54px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '14px', color: 'var(--muted)', fontWeight: '500' }}>
          <button
            onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: '9px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--terracotta)', fontWeight: '600', fontSize: '14px' }}
            className="hover:opacity-70 transition-opacity"
          >
            <ArrowLeft size={15} />
            <span>Back to Map View</span>
          </button>
          <span style={{ color: 'var(--border)' }}>/</span>
          <span style={{ color: 'var(--muted)' }}>{venue.name}</span>
        </div>
      </div>

      {/* Content - Two Column Layout */}
      <div className="flex-1 overflow-hidden flex gap-7 p-7 min-h-0">
        {/* Left Column */}
        <div className="flex-1 overflow-y-auto pr-4 min-w-0">
          {/* Name */}
          <h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--ink)' }}>{venue.name}</h1>

          {/* Category Pill */}
          <div className="mb-4">
            <span className="inline-block px-3 py-1 rounded-full text-sm font-medium" style={{ background: 'var(--sage)', color: 'white' }}>
              {getSubcategoryName(venue.subcategory_id) || venue.category}
            </span>
          </div>

          {/* Info Rows */}
          <div className="mb-6">
            {getPriceDisplay(venue) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '16px', marginBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                <Wallet size={18} style={{ color: 'var(--muted)' }} className="flex-shrink-0" />
                <span style={{ fontSize: '15px', color: 'var(--sage)', fontWeight: '700' }}>{getPriceDisplay(venue)}</span>
              </div>
            )}
            {venue.canonical_city && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '16px', marginBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                <Building2 size={18} style={{ color: 'var(--muted)' }} className="flex-shrink-0" />
                <span style={{ fontSize: '15px', color: 'var(--text)' }}>{venue.canonical_city}</span>
              </div>
            )}
            {venue.address && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '16px', marginBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                <MapPin size={18} style={{ color: 'var(--muted)' }} className="flex-shrink-0" />
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(venue.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '15px', color: 'var(--text)', textDecoration: 'none', cursor: 'pointer' }}
                  className="hover:underline transition-colors"
                >
                  {venue.address}
                </a>
              </div>
            )}
            {venue.opening_hours && getTodayHours(venue.opening_hours) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '16px', marginBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                <Clock size={18} style={{ color: 'var(--muted)' }} className="flex-shrink-0" />
                <span style={{ fontSize: '15px', color: 'var(--text)' }}>{getTodayHours(venue.opening_hours)}</span>
              </div>
            )}
          </div>

          {/* Rating */}
          {venue.rating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '16px', marginBottom: '16px', borderBottom: '1px solid var(--border)' }}>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => {
                  const fillPercentage = Math.min(Math.max((venue.rating || 0) - i, 0), 1)
                  return (
                    <div key={i} className="relative">
                      <span style={{ fontSize: '17px', color: 'var(--star-empty)' }}>★</span>
                      <div
                        className="absolute top-0 left-0 overflow-hidden"
                        style={{ width: `${fillPercentage * 100}%`, color: 'var(--honey)' }}
                      >
                        <span style={{ fontSize: '17px' }}>★</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <span style={{ fontSize: '15px', color: 'var(--honey-text)', fontWeight: '600' }}>
                {venue.rating.toFixed(1)}
              </span>
            </div>
          )}

          {/* About */}
          <div className="mb-6 pb-6" style={{ borderBottom: `1px solid var(--border)` }}>
            <h4 className="text-sm font-bold mb-2 uppercase tracking-widest" style={{ color: 'var(--ink)' }}>About</h4>
            <p className="text-sm italic" style={{ color: 'var(--muted)' }}>Coming soon</p>
          </div>

          {/* Comments */}
          {comments.length > 0 && (
            <div className="mt-8">
              <button
                onClick={() => setShowComments(!showComments)}
                className="w-full flex items-center justify-between mb-3 hover:opacity-70 transition-opacity"
              >
                <h4 className="font-bold flex items-center gap-2" style={{ color: 'var(--ink)' }}>
                  <MessageCircle size={16} />
                  Comments ({comments.length})
                </h4>
                <ChevronDown size={18} style={{ color: 'var(--muted)', transition: 'transform' }} className={`transition-transform ${showComments ? 'rotate-180' : ''}`} />
              </button>
              {showComments && (
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
              )}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="w-96 flex flex-col gap-6 flex-shrink-0">
          {/* Map */}
          {expandedMap && userLocation && venue.latitude && venue.longitude && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '16px', borderBottom: '1px solid var(--border)' }}>
                <button
                  onClick={() => setExpandedMap(false)}
                  style={{ background: 'var(--sage)', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                  className="hover:opacity-80 transition-opacity"
                >
                  <Minimize2 size={24} color="white" />
                </button>
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <Map
                  venues={[venue]}
                  userLocation={userLocation}
                  selectedVenue={venue}
                  onVenueClick={() => {}}
                  categories={categories}
                />
              </div>
            </div>
          )}

          {!expandedMap && userLocation && venue.latitude && venue.longitude && (
            <div className="relative h-64 rounded-lg overflow-hidden" style={{ background: 'var(--canvas)', border: `1px solid var(--border)` }}>
              <button
                onClick={() => setExpandedMap(true)}
                style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 9999, background: 'var(--sage)', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                className="hover:opacity-80 transition-opacity"
              >
                <Maximize2 size={20} color="white" />
              </button>
              <Map
                venues={[venue]}
                userLocation={userLocation}
                selectedVenue={venue}
                onVenueClick={() => {}}
                categories={categories}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {venue.phone_number && (
              <a
                href={`tel:${venue.phone_number}`}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[13px] text-sm font-medium text-white transition-colors hover:opacity-90"
                style={{ background: 'var(--sage)', fontSize: '15.5px', fontWeight: 600, boxShadow: '0 12px 22px -14px rgba(111, 143, 106, 0.8)' }}
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

          {/* Start Here Button */}
          {onStartHere && (
            <button
              onClick={() => onStartHere(venue)}
              className="w-full px-4 py-3 text-white rounded-[13px] text-sm font-medium transition-colors hover:opacity-90"
              style={{ background: 'var(--terracotta)', fontSize: '15.5px', fontWeight: 600, boxShadow: '0 14px 26px -14px rgba(199, 91, 63, 0.7)' }}
            >
              Start Here
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
