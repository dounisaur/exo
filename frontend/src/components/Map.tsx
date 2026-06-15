import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Venue, Category } from '../types'

interface MapProps {
  venues: Venue[]
  userLocation: { lat: number; lng: number }
  selectedVenue: Venue | null
  onVenueClick?: (venue: Venue) => void
  categories?: Category[]
}

export default function Map({ venues, userLocation, selectedVenue, onVenueClick, categories = [] }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)

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

  const createTooltipContent = (venue: Venue): string => {
    const subcategory = getSubcategoryName(venue.subcategory_id) || venue.category
    const hours = getTodayHours(venue.opening_hours)
    const price = getPriceDisplay(venue)

    let content = `<div style="font-family: 'Schibsted Grotesk, sans-serif'; color: var(--ink); min-width: 140px;">`

    // Header row with name and rating
    content += `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">`
    content += `<div style="font-weight: 700; font-size: 14px;">${venue.name}</div>`
    if (venue.rating) {
      content += `<span style="color: var(--honey); font-size: 12px;">★ ${venue.rating.toFixed(1)}</span>`
    }
    content += `</div>`

    // Info row with separators
    if (subcategory || price || hours) {
      content += `<div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px;">`
      content += `<span style="color: var(--muted); font-weight: 600;">${subcategory || ''}</span>`
      if (price) {
        content += `<span style="color: var(--sage); font-weight: 600;">${price}</span>`
      }
      if (hours) {
        content += `<span style="color: var(--muted); font-weight: 600;">${hours}</span>`
      }
      content += `</div>`
    }

    content += `</div>`
    return content
  }

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
      fillColor: '#FF2D2D',
      color: '#990000',
      weight: 3,
      opacity: 1,
      fillOpacity: 0.8
    })
      .addTo(mapInstance.current)
      .bindPopup('Your location')
      .bindTooltip('You are here', {
        permanent: true,
        direction: 'top',
        offset: [0, -20],
        className: 'user-location-tooltip'
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
      const fillColor = isSelected ? '#f5841f' : '#2563eb' // Cobalt: orange for selected, blue for others
      const borderColor = isSelected ? '#f5841f' : '#1e40af' // Orange border for selected, deep blue for others
      const marker = L.circleMarker([venue.latitude, venue.longitude], {
        radius: isSelected ? 10 : 8,
        fillColor: fillColor,
        color: borderColor,
        weight: isSelected ? 4 : 2,
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

      // Show detailed info on hover
      const tooltipElement = document.createElement('div')
      tooltipElement.innerHTML = createTooltipContent(venue)
      marker.bindTooltip(tooltipElement, {
        permanent: isSelected,
        direction: 'top',
        offset: [0, -15],
        className: 'venue-tooltip'
      })
    })
  }, [venues, selectedVenue])

  // Fit all venues and user location in view
  useEffect(() => {
    if (mapInstance.current && venues.length > 0) {
      const bounds = L.latLngBounds([
        [userLocation.lat, userLocation.lng],
        ...venues.map(v => [v.latitude, v.longitude] as [number, number])
      ])
      mapInstance.current.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [venues, userLocation])

  return <div ref={mapRef} className="w-full h-full" />
}
