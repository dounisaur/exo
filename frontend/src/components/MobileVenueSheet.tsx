import { X, Wallet, Building2, MapPin, Clock, Phone, MessageCircle, Maximize2, Minimize2 } from 'lucide-react'
import { useState, useRef } from 'react'
import Map from './Map'
import type { Venue, Category, VenueComment } from '../types'

interface MobileVenueSheetProps {
  venue: Venue | null
  categories: Category[]
  comments?: VenueComment[]
  userLocation?: { lat: number; lng: number }
  onClose: () => void
  onStartHere?: (venue: Venue) => void
}

export default function MobileVenueSheet({
  venue,
  categories,
  comments = [],
  userLocation,
  onClose,
  onStartHere
}: MobileVenueSheetProps) {
  const [expandedMap, setExpandedMap] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const commentsRef = useRef<HTMLDivElement>(null)

  if (!venue) return null

  const handleCloseSheet = () => {
    setIsClosing(true)
    // Wait for animation to complete before calling onClose
    setTimeout(() => {
      onClose()
    }, 400)
  }

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

  const scrollToComments = () => {
    if (commentsRef.current) {
      commentsRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const rating = venue.rating ? Math.round(venue.rating) : 0
  const filledStars = '★'.repeat(rating)
  const emptyStars = '★'.repeat(5 - rating)

  return (
    <>
      {/* Scrim Overlay */}
      <div
        onClick={handleCloseSheet}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(42, 37, 32, 0.45)',
          opacity: 1,
          pointerEvents: 'auto',
          transition: 'opacity 0.3s',
          zIndex: 5
        }}
      />

      {/* Slide-up Sheet */}
      <div
        className={isClosing ? 'animate-slide-down-mobile' : 'animate-slide-up-mobile'}
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          top: '84px',
          background: 'var(--canvas)',
          borderRadius: '24px 24px 0 0',
          boxShadow: '0 -16px 44px rgba(42, 37, 32, 0.2)',
          zIndex: 6,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Drag Handle */}
        <div style={{ padding: '9px 0 3px', flexShrink: 0 }}>
          <div
            style={{
              width: '42px',
              height: '5px',
              borderRadius: '100px',
              background: 'var(--border)',
              margin: '0 auto'
            }}
          />
        </div>

        {/* Header Row: Name + Close Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 18px 12px',
            flexShrink: 0,
            borderBottom: '1px solid var(--border)'
          }}
        >
          <span style={{ fontSize: '19px', fontWeight: 700, color: 'var(--ink)' }}>
            {venue.name}
          </span>
          <button
            onClick={handleCloseSheet}
            style={{
              width: '32px',
              height: '32px',
              flexShrink: 0,
              borderRadius: '50%',
              background: 'var(--surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: 'none',
              padding: 0
            }}
          >
            <X size={13} color="var(--muted)" strokeWidth={2.5} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 16px 30px' }}>
          {/* Category Pill */}
          <span
            style={{
              display: 'inline-block',
              background: 'var(--terracotta-tint)',
              color: 'var(--terracotta-press)',
              borderRadius: '100px',
              padding: '5px 12px',
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: '14px'
            }}
          >
            {getSubcategoryName(venue.subcategory_id) || venue.category}
          </span>

          {/* Price Row */}
          {getPriceDisplay(venue) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                fontSize: '13.5px',
                marginBottom: '7px'
              }}
            >
              <Wallet size={14} color="var(--muted)" strokeWidth={2} style={{ flexShrink: 0 }} />
              <span style={{ color: 'var(--sage)', fontWeight: 700 }}>{getPriceDisplay(venue)}</span>
            </div>
          )}

          {/* City Row */}
          {venue.canonical_city && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                fontSize: '13.5px',
                color: 'var(--text)',
                marginBottom: '7px'
              }}
            >
              <Building2 size={13} color="var(--muted)" strokeWidth={2} style={{ flexShrink: 0 }} />
              <span>{venue.canonical_city}</span>
            </div>
          )}

          {/* Address Row (clickable) */}
          {venue.address && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                fontSize: '13.5px',
                color: 'var(--text)',
                marginBottom: '7px'
              }}
            >
              <MapPin size={13} color="var(--muted)" strokeWidth={2} style={{ flexShrink: 0 }} />
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(venue.address)}`}
                target="_blank"
                rel="noopener"
                style={{ color: 'var(--text)', textDecoration: 'none' }}
              >
                {venue.address}
              </a>
            </div>
          )}

          {/* Hours Row */}
          {venue.opening_hours && getTodayHours(venue.opening_hours) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                fontSize: '13.5px',
                color: 'var(--text)',
                marginBottom: '11px'
              }}
            >
              <Clock size={13} color="var(--muted)" strokeWidth={2} style={{ flexShrink: 0 }} />
              <span>{getTodayHours(venue.opening_hours)}</span>
            </div>
          )}

          {/* Star Rating Row */}
          {venue.rating && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px'
              }}
            >
              <span
                style={{
                  fontSize: '16px',
                  letterSpacing: '2px',
                  color: 'var(--honey)'
                }}
              >
                {filledStars}
                <span style={{ color: 'var(--star-empty)' }}>{emptyStars}</span>
              </span>
              <span style={{ fontSize: '13.5px', color: 'var(--honey-text)', fontWeight: 600 }}>
                {venue.rating.toFixed(1)}
              </span>
            </div>
          )}

          {/* Call + Directions Buttons */}
          <div style={{ display: 'flex', gap: '9px', marginBottom: '18px' }}>
            {venue.phone_number && (
              <a
                href={`tel:${venue.phone_number}`}
                style={{
                  flex: 1,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '7px',
                  background: 'var(--sage)',
                  color: 'white',
                  borderRadius: '13px',
                  padding: '11px',
                  fontSize: '15.5px',
                  fontWeight: 600,
                  boxShadow: '0 12px 22px -14px rgba(111, 143, 106, 0.8)'
                }}
              >
                <Phone size={14} color="white" strokeWidth={2} />
                Call
              </a>
            )}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(venue.address || venue.name)}`}
              target="_blank"
              rel="noopener"
              className="transition-all duration-200 hover:shadow-md"
              style={{
                flex: 1,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
                background: 'var(--surface)',
                color: 'var(--ink)',
                borderRadius: '13px',
                padding: '11px',
                fontSize: '15.5px',
                fontWeight: 600,
                border: '1px solid var(--border-strong)'
              }}
            >
              <MapPin size={13} color="var(--ink)" strokeWidth={2} />
              Directions
            </a>
          </div>

          {/* Comment Chip + Start Here Button Row */}
          <div style={{ display: 'flex', gap: '9px', marginBottom: '18px' }}>
            {comments.length > 0 && (
              <button
                onClick={scrollToComments}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--terracotta)',
                  color: '#fff',
                  borderRadius: '13px',
                  padding: '11px 14px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  flexShrink: 0,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 8px 16px -8px rgba(199, 91, 63, 0.5)',
                  transition: 'all 0.2s'
                }}
                className="hover:opacity-90"
              >
                <MessageCircle size={13} color="#fff" strokeWidth={2} />
                {comments.length}
              </button>
            )}
            {onStartHere && (
              <button
                onClick={() => onStartHere(venue)}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  background: 'var(--terracotta)',
                  color: '#fff',
                  borderRadius: '13px',
                  padding: '11px',
                  fontSize: '15.5px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 14px 26px -14px rgba(199, 91, 63, 0.7)'
                }}
              >
                Start Here
              </button>
            )}
          </div>

          {/* About Section */}
          <div style={{ borderTop: '1px solid #eef0f6', paddingTop: '14px', marginBottom: '4px' }}>
            <h4
              style={{
                fontSize: '13.5px',
                fontWeight: 700,
                color: '#15224a',
                margin: '0 0 7px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              About{' '}
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '9px',
                  letterSpacing: '0.08em',
                  color: '#9097b3',
                  background: '#f1f3fb',
                  border: '1px solid #e0e5f4',
                  borderRadius: '5px',
                  padding: '2px 6px'
                }}
              >
                COMING SOON
              </span>
            </h4>
            <p
              style={{
                margin: '0 0 16px',
                fontSize: '13.5px',
                lineHeight: 1.6,
                color: '#9097b3',
                fontStyle: 'italic'
              }}
            >
              A short description of this venue will appear here.
            </p>
          </div>

          {/* Map */}
          {venue.latitude && venue.longitude && userLocation && (
            <div style={{ borderTop: '1px solid #eef0f6', paddingTop: '14px', marginBottom: '16px', position: 'relative' }}>
              <div style={{ height: '200px', borderRadius: '13px', border: '1px solid #e0e5f4' }}>
                <Map
                  venues={[venue]}
                  userLocation={userLocation}
                  selectedVenue={venue}
                  onVenueClick={() => {}}
                />
              </div>
              <button
                onClick={() => setExpandedMap(true)}
                style={{
                  position: 'absolute',
                  top: '17px',
                  right: '17px',
                  zIndex: 10000,
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                  pointerEvents: 'auto'
                }}
              >
                <Maximize2 size={16} color="#fff" strokeWidth={2} />
              </button>
            </div>
          )}

          {/* Comments Section */}
          {comments.length > 0 && (
            <div ref={commentsRef} style={{ borderTop: '1px solid #eef0f6', paddingTop: '14px' }}>
              <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: '#15224a', margin: '0 0 11px' }}>
                Comments ({comments.length})
              </h4>
              {comments.map(comment => (
                <div
                  key={comment.id}
                  style={{
                    background: '#f6f7fa',
                    borderRadius: '12px',
                    padding: '13px 15px',
                    marginBottom: '9px'
                  }}
                >
                  <p
                    style={{
                      margin: '0 0 6px',
                      fontSize: '13.5px',
                      lineHeight: 1.55,
                      color: '#15224a'
                    }}
                  >
                    {comment.content}
                  </p>
                  <span style={{ fontSize: '12px', color: '#9097b3' }}>
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Map Overlay */}
      {expandedMap && venue.latitude && venue.longitude && userLocation && (
        <>
          {/* Overlay Background */}
          <div
            onClick={() => setExpandedMap(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: '#000',
              zIndex: 7,
              opacity: 0.5
            }}
          />

          {/* Fullscreen Map Container */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 8,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Close Button */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                padding: '12px',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                zIndex: 9
              }}
            >
              <button
                onClick={() => setExpandedMap(false)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Minimize2 size={20} color="#fff" strokeWidth={2} />
              </button>
            </div>

            {/* Map */}
            <div style={{ flex: 1, width: '100%', height: '100%' }}>
              <Map
                venues={[venue]}
                userLocation={userLocation}
                selectedVenue={venue}
                onVenueClick={() => {}}
              />
            </div>
          </div>
        </>
      )}
    </>
  )
}
