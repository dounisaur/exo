import { ArrowLeft, MapIcon, AlertCircle } from 'lucide-react'
import type { Itinerary } from '../types'

interface ItineraryViewProps {
  itinerary: (Itinerary & { travelToFirst?: { distanceMeters: number; walkable: boolean; minutes: number } }) | null
  loading: boolean
  error: string | null
  onBack: () => void
  startVenueName?: string
}

const getTodayHours = (openingHours?: string): string | null => {
  if (!openingHours) return null
  try {
    const hours = JSON.parse(openingHours)
    const today = new Date().getDay().toString() // "0"–"6"
    const todayHours = hours[today]
    if (!todayHours || todayHours === 'CLOSED') {
      return null
    }
    return todayHours // "09:00-22:00"
  } catch {
    return null
  }
}

export default function ItineraryView({
  itinerary,
  loading,
  error,
  onBack,
  startVenueName
}: ItineraryViewProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Curating your night out...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen bg-white">
        <header className="bg-white border-b border-gray-200 p-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft size={20} />
            Back
          </button>
        </header>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!itinerary || itinerary.stops.length === 0) {
    return (
      <div className="flex flex-col h-screen bg-white">
        <header className="bg-white border-b border-gray-200 p-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft size={20} />
            Back
          </button>
        </header>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <MapIcon size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No venues found nearby. Try a different location!</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Itinerary</h2>
            {startVenueName && (
              <p className="text-sm text-gray-600">Starting from {startVenueName}</p>
            )}
          </div>
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Timeline */}
        <div className="px-4 pb-8">
          {/* Starting Point - only show if not starting from a venue card */}
          {!startVenueName && (
            <>
              <div className="flex gap-4 mb-6">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm">
                    📍
                  </div>
                  {itinerary.stops.length > 0 && (
                    <div className="w-0.5 h-20 bg-green-200 my-2"></div>
                  )}
                </div>

                <div className="flex-1 pb-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Your Location</h3>
                  <p className="text-sm text-gray-600">Starting point for your itinerary</p>
                </div>
              </div>

              {/* Travel to First Stop */}
              {itinerary.travelToFirst && (
                <div className="flex gap-4 mb-6">
                  <div className="w-8 flex justify-center">
                    <span className="text-2xl">{itinerary.travelToFirst.walkable ? '🚶' : '🚕'}</span>
                  </div>
                  <div className="flex-1 flex items-center gap-2 text-sm text-gray-600 pb-4 border-b border-gray-200">
                    {itinerary.travelToFirst.walkable ? (
                      <span>{itinerary.travelToFirst.minutes} min walk · {(itinerary.travelToFirst.distanceMeters / 1000).toFixed(2)}km</span>
                    ) : (
                      <span>Taxi needed (~{itinerary.travelToFirst.minutes} min) · {(itinerary.travelToFirst.distanceMeters / 1000).toFixed(2)}km</span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {itinerary.stops.map((stop, index) => {
            return (
              <div key={stop.venue.id}>
                {/* Stop */}
                <div className="flex gap-4 mb-6">
                  {/* Timeline */}
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    {index < itinerary.stops.length - 1 && (
                      <div className="w-0.5 h-20 bg-blue-200 my-2"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{stop.venue.name}</h3>

                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <span className="text-gray-500">{stop.venue.category}</span>
                      {stop.venue.address && (
                        <>
                          <span>•</span>
                          <span className="text-gray-500">{stop.venue.address}</span>
                        </>
                      )}
                    </div>

                    {stop.venue.opening_hours && (
                      <div className="text-sm text-gray-600 mb-3">
                        <p>⏰ {getTodayHours(stop.venue.opening_hours) || 'Closed today'}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {stop.venue.phone_number && (
                        <a
                          href={`tel:${stop.venue.phone_number}`}
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
                        >
                          Call
                        </a>
                      )}
                      {stop.venue.reservation_link && (
                        <a
                          href={stop.venue.reservation_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                          Reserve
                        </a>
                      )}
                      {stop.venue.website_url && (
                        <a
                          href={stop.venue.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
                        >
                          Website
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Travel Segment */}
                {stop.travelToNext && (
                  <div className="flex gap-4 mb-6">
                    <div className="w-8 flex justify-center">
                      <span className="text-2xl">{stop.travelToNext.walkable ? '🚶' : '🚕'}</span>
                    </div>
                    <div className="flex-1 flex items-center gap-2 text-sm text-gray-600 pb-4 border-b border-gray-200">
                      {stop.travelToNext.walkable ? (
                        <span>{stop.travelToNext.minutes} min walk · {(stop.travelToNext.distanceMeters / 1000).toFixed(2)}km</span>
                      ) : (
                        <span>Taxi needed (~{stop.travelToNext.minutes} min) · {(stop.travelToNext.distanceMeters / 1000).toFixed(2)}km</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
