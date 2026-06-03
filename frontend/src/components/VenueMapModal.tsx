import { X } from 'lucide-react'
import Map from './Map'
import type { Venue } from '../types'

interface VenueMapModalProps {
  venue: Venue
  userLocation: { lat: number; lng: number }
  onClose: () => void
}

export default function VenueMapModal({ venue, userLocation, onClose }: VenueMapModalProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">{venue.name}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={24} className="text-gray-600" />
            </button>
          </div>

          {/* Map */}
          <div className="flex-1 min-h-[400px] relative">
            <Map
              venues={[venue]}
              userLocation={userLocation}
              selectedVenue={venue}
              onVenueClick={() => {}}
            />
          </div>
        </div>
      </div>
    </>
  )
}
