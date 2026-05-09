import type { Venue } from '../types'

interface VenueListProps {
  venues: Venue[]
  onSelectVenue: (venue: Venue) => void
  selectedVenue: Venue | null
}

export default function VenueList({ venues, onSelectVenue, selectedVenue }: VenueListProps) {
  if (venues.length === 0) {
    return <div className="venue-list"><p>No venues found</p></div>
  }

  return (
    <div className="venue-list">
      {venues.map((venue) => (
        <div
          key={venue.id}
          className={`venue-card ${selectedVenue?.id === venue.id ? 'selected' : ''}`}
          onClick={() => onSelectVenue(venue)}
        >
          {venue.image_url && (
            <img src={venue.image_url} alt={venue.name} className="venue-image" />
          )}
          <div className="venue-content">
            <h3>{venue.name}</h3>
            <p className="category">{venue.category}</p>
            <p className="address">{venue.address}</p>

            <div className="venue-links">
              {venue.website_url && (
                <a href={venue.website_url} target="_blank" rel="noopener noreferrer">
                  Website
                </a>
              )}
              {venue.reservation_link && (
                <a href={venue.reservation_link} target="_blank" rel="noopener noreferrer">
                  Reserve
                </a>
              )}
              <a
                href={`https://maps.google.com/?q=${venue.latitude},${venue.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Maps
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
