import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Venue } from '../types'

interface MapProps {
  venues: Venue[]
  userLocation: { lat: number; lng: number }
  selectedVenue: Venue | null
  onVenueClick?: (venue: Venue) => void
}

export default function Map({ venues, userLocation, selectedVenue, onVenueClick }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    // Initialize map
    mapInstance.current = L.map(mapRef.current).setView(
      [userLocation.lat, userLocation.lng],
      13
    )

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(mapInstance.current)

    // Add user location marker
    L.circleMarker([userLocation.lat, userLocation.lng], {
      radius: 8,
      fillColor: '#3b82f6',
      color: '#1e40af',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8
    })
      .addTo(mapInstance.current)
      .bindPopup('Your location')
      .bindTooltip('You are here', {
        permanent: true,
        direction: 'top',
        offset: [0, -20],
        className: 'venue-tooltip'
      })
  }, [])

  // Update venue markers
  useEffect(() => {
    if (!mapInstance.current) return

    // Remove old markers
    mapInstance.current.eachLayer((layer: L.Layer) => {
      if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
        if (layer.getPopup()?.getContent() !== 'Your location') {
          mapInstance.current!.removeLayer(layer)
        }
      }
    })

    // Add venue markers
    venues.forEach((venue) => {
      const isSelected = selectedVenue?.id === venue.id
      const fillColor = isSelected ? '#ff3333' : '#a78bfa'
      const borderColor = isSelected ? '#991b1b' : '#6d28d9'
      const marker = L.circleMarker([venue.latitude, venue.longitude], {
        radius: isSelected ? 10 : 8,
        fillColor: fillColor,
        color: borderColor,
        weight: isSelected ? 3 : 2,
        opacity: 1,
        fillOpacity: 0.95
      })
        .addTo(mapInstance.current!)

      // Add click handler to show venue in bottom sheet
      marker.on('click', (e) => {
        console.log('Marker clicked:', venue.name)
        L.DomEvent.stopPropagation(e)
        if (onVenueClick) {
          console.log('Calling onVenueClick for:', venue.name)
          onVenueClick(venue)
        }
      })

      // Show name on hover
      marker.bindTooltip(venue.name, {
        permanent: isSelected,
        direction: 'top',
        offset: [0, -15],
        className: 'venue-tooltip'
      })
    })
  }, [venues, selectedVenue])

  // Fit both user location and selected venue in view
  useEffect(() => {
    if (selectedVenue && mapInstance.current && userLocation) {
      const bounds = L.latLngBounds([
        [userLocation.lat, userLocation.lng],
        [selectedVenue.latitude, selectedVenue.longitude]
      ])
      mapInstance.current.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [selectedVenue, userLocation])

  return <div ref={mapRef} className="w-full h-full" />
}
