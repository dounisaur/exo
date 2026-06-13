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
    return (
      <div
        onClick={() => onSelect?.(venue)}
        style={{
          borderRadius: '16px',
          background: '#fff',
          border: '1px solid #e7eaf4',
          padding: '15px',
          marginBottom: '12px',
          boxShadow: '0 6px 18px -12px rgba(21, 34, 74, 0.3)',
          cursor: 'pointer'
        }}
      >
        {/* Name and Rating Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '7px' }}>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#15224a' }}>{venue.name}</span>
          {venue.rating && (
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#f5841f', whiteSpace: 'nowrap' }}>
              ★ {venue.rating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Category + Price + Hours + View Link Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '12.5px', color: '#6a7191' }}>
          <span style={{ background: '#eaf1ff', color: '#2563eb', borderRadius: '100px', padding: '3px 10px', fontWeight: 600 }}>
            {getSubcategoryName(venue.subcategory_id) || venue.category}
          </span>
          {getPriceDisplay(venue) && (
            <span style={{ color: '#16a34a', fontWeight: 700 }}>{getPriceDisplay(venue)}</span>
          )}
          {getPriceDisplay(venue) && (venue.canonical_city || (venue.opening_hours && getTodayHours(venue.opening_hours))) && (
            <span>·</span>
          )}
          {venue.opening_hours && getTodayHours(venue.opening_hours) && (
            <span>{getTodayHours(venue.opening_hours)}</span>
          )}
          <span style={{ marginLeft: 'auto', color: '#1e40af', fontWeight: 600 }}>View ›</span>
        </div>
      </div>
    )
  }

  // Desktop version - existing behavior
  const cardBg = isSelected ? 'bg-orange-600' : 'bg-white'
  const cardText = isSelected ? 'text-white' : 'text-gray-900'
  const borderClass = isSelected ? 'border-transparent' : 'border-blue-100'
  const shadowClass = isSelected ? 'shadow-lg' : 'shadow-sm'

  return (
    <div
      onClick={() => onSelect?.(venue)}
      className={`p-4 rounded-lg cursor-pointer transition-all duration-200 border ${cardBg} ${borderClass} ${shadowClass} ${
        !isSelected ? 'hover:shadow-md' : ''
      }`}
    >
      {/* Name and Rating */}
      <div className="flex justify-between items-start gap-2 mb-2">
        <h3 className={`font-bold text-sm leading-tight flex-1 ${cardText}`}>{venue.name}</h3>
        {venue.rating && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className={`text-xs font-semibold ${isSelected ? 'text-yellow-300' : 'text-yellow-500'}`}>
              ★ {venue.rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Category Pill */}
      <div className="mb-2">
        <span
          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
            isSelected ? 'bg-orange-500 bg-opacity-30 text-orange-100' : 'bg-blue-100 text-blue-700'
          }`}
        >
          {getSubcategoryName(venue.subcategory_id) || venue.category}
        </span>
      </div>

      {/* Info Row: Price · City · Hours */}
      <div className={`flex flex-wrap gap-2 text-xs mb-3 ${isSelected ? 'text-orange-100' : 'text-gray-600'}`}>
        {getPriceDisplay(venue) && (
          <div className="flex items-center gap-1">
            <Wallet size={14} className="flex-shrink-0" />
            <span className={isSelected ? '' : 'text-green-600'}>{getPriceDisplay(venue)}</span>
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
        <div className={`flex items-center gap-1 text-xs mt-2 pt-2 ${
          isSelected
            ? 'text-orange-100 border-t border-orange-500 border-opacity-30'
            : 'text-gray-600 border-t border-gray-200'
        }`}>
          <MessageCircle size={14} />
          <span>{venueComments.length} comment{venueComments.length !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  )
}
