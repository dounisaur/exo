import { Clock, Building2, Wallet, MessageCircle } from 'lucide-react'
import type { Venue, Category, VenueComment } from '../types'

interface VenueCardProps {
  venue: Venue
  categories: Category[]
  isSelected?: boolean
  venueComments?: VenueComment[]
  onSelect?: (venue: Venue) => void
  mobile?: boolean
}

export default function VenueCard({
  venue,
  categories,
  isSelected = false,
  venueComments = [],
  onSelect,
  mobile = false
}: VenueCardProps) {
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

  // Mobile version - design-exact styling
  if (mobile) {
    const imageUrl = venue.primary_photo_url || venue.image_url
    return (
      <div
        onClick={() => onSelect?.(venue)}
        style={{
          borderRadius: '16px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          marginBottom: '12px',
          boxShadow: '0 16px 34px -22px rgba(74, 56, 36, 0.4)',
          cursor: 'pointer'
        }}
      >
        {/* Image */}
        {imageUrl && (
          <img
            src={imageUrl}
            alt={venue.name}
            style={{
              width: '100%',
              height: '220px',
              objectFit: 'cover'
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        )}

        {/* Content */}
        <div style={{ padding: '15px' }}>
          {/* Name and Rating Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '7px' }}>
          <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)' }}>{venue.name}</span>
          {venue.rating && (
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--honey)', whiteSpace: 'nowrap' }}>
              ★ {venue.rating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Category Pill Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <span style={{ background: 'var(--sage)', color: 'white', borderRadius: '100px', padding: '3px 10px', fontWeight: 600, fontSize: '12.5px' }}>
            {getSubcategoryName(venue.subcategory_id) || venue.category}
          </span>
        </div>

        {/* Info Row with Icons: Price, City, Hours, View Link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '12.5px', color: 'var(--muted)' }}>
          {getPriceDisplay(venue) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--sage)', fontWeight: 700 }}>
              <Wallet size={14} color="var(--muted)" strokeWidth={2} />
              <span>{getPriceDisplay(venue)}</span>
            </div>
          )}
          {venue.canonical_city && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Building2 size={14} color="var(--muted)" strokeWidth={2} />
              <span>{venue.canonical_city}</span>
            </div>
          )}
          {venue.opening_hours && getTodayHours(venue.opening_hours) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={14} color="var(--muted)" strokeWidth={2} />
              <span>{getTodayHours(venue.opening_hours)}</span>
            </div>
          )}
          <span style={{ marginLeft: 'auto', color: 'var(--terracotta)', fontWeight: 600 }}>View ›</span>
        </div>
        </div>
      </div>
    )
  }

  // Desktop version - existing behavior
  const cardBg = isSelected ? 'var(--terracotta)' : 'var(--surface)'
  const cardText = isSelected ? 'text-white' : ''
  const cardTextColor = isSelected ? 'white' : 'var(--ink)'
  const borderStyle = isSelected ? 'border-transparent' : '1px solid var(--border)'
  const shadowStyle = isSelected ? '0 16px 34px -22px rgba(74, 56, 36, 0.4)' : '0 16px 34px -22px rgba(74, 56, 36, 0.4)'
  const imageUrl = venue.primary_photo_url || venue.image_url

  return (
    <div
      onClick={() => onSelect?.(venue)}
      className={`rounded-[16px] cursor-pointer transition-all duration-200 overflow-hidden ${cardText} ${
        !isSelected ? 'hover:opacity-90' : ''
      }`}
      style={{ background: cardBg, border: borderStyle, boxShadow: shadowStyle }}
    >
      {/* Image */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt={venue.name}
          className="w-full h-56 object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      )}

      {/* Content */}
      <div className="p-4">
      {/* Name and Rating */}
      <div className="flex justify-between items-start gap-2 mb-2">
        <h3 className="font-bold text-sm leading-tight flex-1" style={{ color: cardTextColor }}>{venue.name}</h3>
        {venue.rating && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: isSelected ? 'rgba(255, 255, 255, 0.8)' : 'var(--honey)' }}>
              ★ {venue.rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Category Pill */}
      <div className="mb-2">
        <span
          className="inline-block px-2 py-1 rounded-full text-xs font-medium"
          style={{
            background: 'var(--sage)',
            color: 'white'
          }}
        >
          {getSubcategoryName(venue.subcategory_id) || venue.category}
        </span>
      </div>

      {/* Info Row: Price · City · Hours */}
      <div className="flex flex-wrap gap-2 text-xs mb-3" style={{ color: isSelected ? 'rgba(255, 255, 255, 0.8)' : 'var(--muted)' }}>
        {getPriceDisplay(venue) && (
          <div className="flex items-center gap-1">
            <Wallet size={14} className="flex-shrink-0" />
            <span style={{ color: isSelected ? 'rgba(255, 255, 255, 0.8)' : 'var(--sage)', fontWeight: 700 }}>{getPriceDisplay(venue)}</span>
          </div>
        )}
        {venue.canonical_city && (
          <div className="flex items-center gap-1">
            <Building2 size={14} className="flex-shrink-0" />
            <span>{venue.canonical_city}</span>
          </div>
        )}
        {venue.opening_hours && getTodayHours(venue.opening_hours) && (
          <div className="flex items-center gap-1">
            <Clock size={14} className="flex-shrink-0" />
            <span>{getTodayHours(venue.opening_hours)}</span>
          </div>
        )}
      </div>

      {/* Comments - show for both selected and unselected */}
      {venueComments.length > 0 && (
        <div className="flex items-center gap-1 text-xs mt-2 pt-2" style={{
          color: isSelected ? 'rgba(255, 255, 255, 0.8)' : 'var(--muted)',
          borderTop: `1px solid ${isSelected ? 'rgba(255, 255, 255, 0.2)' : 'var(--border)'}`
        }}>
          <MessageCircle size={14} />
          <span>{venueComments.length} comment{venueComments.length !== 1 ? 's' : ''}</span>
        </div>
      )}
      </div>
    </div>
  )
}
