import { X, Wallet, Building2, MapPin, Clock, Phone, MessageCircle, Maximize2, Minimize2 } from 'lucide-react'
import { useState, useRef } from 'react'
import type { Venue, Category, VenueComment } from '../types'

interface MobileVenueSheetProps {
  venue: Venue | null
  categories: Category[]
  comments?: VenueComment[]
  onClose: () => void
  onStartHere?: (venue: Venue) => void
}

export default function MobileVenueSheet({
  venue,
  categories,
  comments = [],
  onClose,
  onStartHere
}: MobileVenueSheetProps) {
  const [expandedMap, setExpandedMap] = useState(false)
  const commentsRef = useRef<HTMLDivElement>(null)

  if (!venue) return null

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
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(21, 34, 74, 0.45)',
          opacity: 1,
          pointerEvents: 'auto',
          transition: 'opacity 0.3s',
          zIndex: 5
        }}
      />

      {/* Slide-up Sheet */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          top: '84px',
          background: '#fff',
          borderRadius: '24px 24px 0 0',
          boxShadow: '0 -16px 44px rgba(21, 34, 74, 0.32)',
          zIndex: 6,
          display: 'flex',
          flexDirection: 'column',
          transform: 'translateY(0)',
          transition: 'transform 0.42s cubic-bezier(0.32, 0.72, 0, 1)'
        }}
      >
        {/* Drag Handle */}
        <div style={{ padding: '9px 0 3px', flexShrink: 0 }}>
          <div
            style={{
              width: '42px',
              height: '5px',
              borderRadius: '100px',
              background: '#dfe3ee',
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
            borderBottom: '1px solid #f1f3f8'
          }}
        >
          <span style={{ fontSize: '19px', fontWeight: 700, color: '#15224a' }}>
            {venue.name}
          </span>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              flexShrink: 0,
              borderRadius: '50%',
              background: '#eef0f4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: 'none',
              padding: 0
            }}
          >
            <X size={13} color="#5d6584" strokeWidth={2.5} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 16px 30px' }}>
          {/* Category Pill */}
          <span
            style={{
              display: 'inline-block',
              background: '#eaf1ff',
              color: '#2563eb',
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
              <Wallet size={14} color="#9aa0b2" strokeWidth={2} style={{ flexShrink: 0 }} />
              <span style={{ color: '#16a34a', fontWeight: 700 }}>{getPriceDisplay(venue)}</span>
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
                color: '#3f4660',
                marginBottom: '7px'
              }}
            >
              <Building2 size={13} color="#9aa0b2" strokeWidth={2} style={{ flexShrink: 0 }} />
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
                color: '#3f4660',
                marginBottom: '7px'
              }}
            >
              <MapPin size={13} color="#9aa0b2" strokeWidth={2} style={{ flexShrink: 0 }} />
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(venue.address)}`}
                target="_blank"
                rel="noopener"
                style={{ color: '#3f4660', textDecoration: 'none' }}
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
                color: '#3f4660',
                marginBottom: '11px'
              }}
            >
              <Clock size={13} color="#9aa0b2" strokeWidth={2} style={{ flexShrink: 0 }} />
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
                  color: '#f5b50a'
                }}
              >
                {filledStars}
                <span style={{ color: '#d8dce5' }}>{emptyStars}</span>
              </span>
              <span style={{ fontSize: '13.5px', color: '#3f4660', fontWeight: 600 }}>
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
                  background: '#eef0f4',
                  color: '#15224a',
                  borderRadius: '10px',
                  padding: '11px',
                  fontSize: '13.5px',
                  fontWeight: 600
                }}
              >
                <Phone size={14} color="#15224a" strokeWidth={2} />
                Call
              </a>
            )}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(venue.address || venue.name)}`}
              target="_blank"
              rel="noopener"
              style={{
                flex: 1,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
                background: '#eef0f4',
                color: '#15224a',
                borderRadius: '10px',
                padding: '11px',
                fontSize: '13.5px',
                fontWeight: 600
              }}
            >
              <MapPin size={13} color="#15224a" strokeWidth={2} />
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
                  background: '#2563eb',
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '11px 14px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  flexShrink: 0,
                  border: 'none',
                  cursor: 'pointer'
                }}
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
                  background: '#4f46e5',
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '11px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  border: 'none',
                  cursor: 'pointer'
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
          {venue.latitude && venue.longitude && (
            <div style={{ borderTop: '1px solid #eef0f6', paddingTop: '14px', marginBottom: '16px', position: 'relative' }}>
              <button
                onClick={() => setExpandedMap(true)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '12px',
                  zIndex: 10,
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Maximize2 size={16} color="#fff" strokeWidth={2} />
              </button>
              <iframe
                title="Venue map mobile"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${venue.longitude - 0.01},${venue.latitude - 0.01},${venue.longitude + 0.01},${venue.latitude + 0.01}&layer=mapnik&marker=${venue.latitude},${venue.longitude}`}
                style={{
                  width: '100%',
                  height: '200px',
                  border: '1px solid #e0e5f4',
                  borderRadius: '13px',
                  display: 'block'
                }}
                loading="lazy"
              />
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
      {expandedMap && venue.latitude && venue.longitude && (
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
                backgroundColor: 'rgba(0, 0, 0, 0.7)'
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
            <iframe
              title="Venue map mobile expanded"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${venue.longitude - 0.02},${venue.latitude - 0.02},${venue.longitude + 0.02},${venue.latitude + 0.02}&layer=mapnik&marker=${venue.latitude},${venue.longitude}`}
              style={{
                flex: 1,
                border: 'none',
                width: '100%'
              }}
              loading="lazy"
            />
          </div>
        </>
      )}
    </>
  )
}
