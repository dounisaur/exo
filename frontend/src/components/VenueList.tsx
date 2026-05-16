import type { Venue, Category } from '../types'

interface VenueListProps {
  venues: Venue[]
  onSelectVenue: (venue: Venue) => void
  selectedVenue: Venue | null
  categories?: Category[]
}

export default function VenueList({ venues, onSelectVenue, selectedVenue, categories = [] }: VenueListProps) {
  const getSubcategoryName = (subcategoryId?: number) => {
    if (!subcategoryId || categories.length === 0) return null;

    for (const category of categories) {
      const subcategory = category.subcategories.find(s => s.id === subcategoryId);
      if (subcategory) return subcategory.name;
    }
    return null;
  };

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
            <p className="category">
              {getSubcategoryName(venue.subcategory_id) || venue.category}
            </p>
            <p className="address">{venue.address}</p>

            {venue.rating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0', fontSize: '0.9rem' }}>
                <span style={{ display: 'inline-block' }}>
                  {[...Array(5)].map((_, i) => {
                    const fillPercentage = Math.min(Math.max(venue.rating - i, 0), 1);
                    return (
                      <span key={i} style={{ display: 'inline-block', position: 'relative', width: '1em', color: '#FFB800' }}>
                        <span style={{ position: 'absolute', overflow: 'hidden', width: `${fillPercentage * 100}%`, color: '#FFB800' }}>★</span>
                        <span style={{ color: '#D1D5DB' }}>★</span>
                      </span>
                    );
                  })}
                </span>
                <span style={{ color: '#666', marginLeft: '0.25rem' }}>
                  {venue.rating.toFixed(1)}
                </span>
              </div>
            )}

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
                href={`https://maps.google.com/?q=${encodeURIComponent(venue.name)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Get Directions
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
