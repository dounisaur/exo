import { useState } from 'react'
import { Phone, MapPin, Star, X } from 'lucide-react'
import Map from './Map'
import type { Venue, Category } from '../types'

interface VenueListProps {
  venues: Venue[]
  categories?: Category[]
  userLocation?: { lat: number; lng: number }
}

export default function VenueList({ venues, categories = [], userLocation }: VenueListProps) {
  const [expandedMapVenue, setExpandedMapVenue] = useState<number | null>(null)

  const getSubcategoryName = (subcategoryId?: number) => {
    if (!subcategoryId || categories.length === 0) return null

    for (const category of categories) {
      const subcategory = category.subcategories.find(s => s.id === subcategoryId)
      if (subcategory) return subcategory.name
    }
    return null
  }

  if (venues.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <MapPin className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-gray-600 font-medium">No venues found</p>
          <p className="text-sm text-gray-500">Try adjusting your filters</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 md:space-y-4 p-3 md:p-4">
      {venues.map((venue) => (
        <div key={venue.id}>
          <div className="card p-4 transition-all duration-200 hover:shadow-md">
          {/* Image */}
          {venue.image_url && (
            <img
              src={venue.image_url}
              alt={venue.name}
              className="w-full h-40 md:h-48 object-cover rounded-lg mb-4"
            />
          )}

          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 mb-1">{venue.name}</h3>

          {/* Category */}
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-block px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              {getSubcategoryName(venue.subcategory_id) || venue.category}
            </span>
          </div>

          {/* Address */}
          {venue.address && (
            <div className="flex items-start gap-2 mb-3 text-sm text-gray-600">
              <MapPin size={16} className="mt-0.5 flex-shrink-0 text-gray-400" />
              <span>{venue.address}</span>
            </div>
          )}

          {/* Rating */}
          {venue.rating && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => {
                  const fillPercentage = Math.min(Math.max((venue.rating || 0) - i, 0), 1)
                  return (
                    <div key={i} className="relative">
                      <Star
                        size={16}
                        className="text-gray-300"
                        fill="currentColor"
                      />
                      <div
                        className="absolute top-0 left-0 overflow-hidden text-yellow-400"
                        style={{ width: `${fillPercentage * 100}%` }}
                      >
                        <Star
                          size={16}
                          className="text-yellow-400"
                          fill="currentColor"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              <span className="text-sm font-medium text-gray-700 ml-1">
                {venue.rating.toFixed(1)}
              </span>
            </div>
          )}

          {/* Links */}
          <div className="flex flex-wrap gap-2">
            {venue.phone_number && (
              <a
                href={`tel:${venue.phone_number}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
              >
                <Phone size={16} />
                <span className="hidden sm:inline">Call</span>
              </a>
            )}
            {venue.reservation_link && (
              <a
                href={venue.reservation_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-colors"
              >
                <span>Reserve</span>
              </a>
            )}
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(venue.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
            >
              <MapPin size={16} />
              <span className="hidden sm:inline">Directions</span>
            </a>
            <button
              onClick={() => setExpandedMapVenue(expandedMapVenue === venue.id ? null : venue.id)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <MapPin size={16} />
              <span>{expandedMapVenue === venue.id ? 'Hide' : 'View'}</span>
            </button>
          </div>
          </div>

          {/* Inline Map */}
          {expandedMapVenue === venue.id && userLocation && (
            <div className="mt-4 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
              <div className="relative h-80 bg-gray-200">
                <Map
                  venues={[venue]}
                  userLocation={userLocation}
                  selectedVenue={venue}
                  onVenueClick={() => {}}
                />
              </div>
              <div className="p-4 bg-white border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setExpandedMapVenue(null)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                >
                  <X size={16} />
                  <span>Close</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
