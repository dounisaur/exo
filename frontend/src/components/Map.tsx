import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Venue } from '../types'

interface MapProps {
  venues: Venue[]
  userLocation: { lat: number; lng: number }
  selectedVenue: Venue | null
}

export default function Map({ venues, userLocation, selectedVenue }: MapProps) {
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
    }).addTo(mapInstance.current).bindPopup('Your location')
  }, [])

  // Update venue markers
  useEffect(() => {
    if (!mapInstance.current) return

    // Remove old markers
    mapInstance.current.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
        if (layer.getPopup()?.getContent() !== 'Your location') {
          mapInstance.current!.removeLayer(layer)
        }
      }
    })

    // Add venue markers
    venues.forEach((venue) => {
      const color = selectedVenue?.id === venue.id ? '#ef4444' : '#8b5cf6'
      L.circleMarker([venue.latitude, venue.longitude], {
        radius: 6,
        fillColor: color,
        color: color,
        weight: 1,
        opacity: 1,
        fillOpacity: 0.7
      })
        .addTo(mapInstance.current!)
        .bindPopup(`<strong>${venue.name}</strong><br/>${venue.category}`)
    })
  }, [venues, selectedVenue])

  // Center on selected venue
  useEffect(() => {
    if (selectedVenue && mapInstance.current) {
      mapInstance.current.setView(
        [selectedVenue.latitude, selectedVenue.longitude],
        15
      )
    }
  }, [selectedVenue])

  return <div ref={mapRef} style={{ height: '500px', width: '100%' }} />
}
