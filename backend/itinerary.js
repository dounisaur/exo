import { getDatabase } from './db.js'

// Haversine formula for distance in meters
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

// Infer category type (food/dessert/bar) from category + subcategory slug
function inferCategoryType(categorySlug, subcategorySlug = '') {
  const combined = `${categorySlug} ${subcategorySlug}`.toLowerCase()

  const foodKeywords = ['food', 'restaurant', 'gastro', 'taverna', 'dinner', 'bistro', 'grill', 'trattoria']
  const dessertKeywords = ['cafe', 'coffee', 'dessert', 'sweet', 'gelato', 'pastry', 'bakery', 'tea']
  const barKeywords = ['bar', 'drinks', 'cocktail', 'pub', 'wine', 'brewery', 'lounge', 'club']

  // Check in order: food, dessert, bar
  if (foodKeywords.some(kw => combined.includes(kw))) return 'food'
  if (dessertKeywords.some(kw => combined.includes(kw))) return 'dessert'
  if (barKeywords.some(kw => combined.includes(kw))) return 'bar'

  return 'bar' // fallback
}

// Generate itinerary from anchor point (lat/lng) or starting venue
export async function generateItinerary(req, res) {
  try {
    const { lat, lng, startVenueId } = req.body

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng required' })
    }

    const db = getDatabase()

    // Fetch all published venues with subcategory slug
    const venues = db.prepare(`
      SELECT v.*, s.slug as subcategory_slug
      FROM venues v
      LEFT JOIN subcategories s ON v.subcategory_id = s.id
      WHERE v.published = 1
    `).all()

    // Get start venue if provided
    let startVenue = null
    let anchorLat = lat
    let anchorLng = lng

    if (startVenueId) {
      startVenue = venues.find(v => v.id === startVenueId)
      if (startVenue) {
        anchorLat = startVenue.latitude
        anchorLng = startVenue.longitude
      }
    }

    // Filter to within 3km of anchor
    const nearby = venues.filter(v => {
      const distance = haversine(anchorLat, anchorLng, v.latitude, v.longitude)
      return distance <= 3000
    })

    const stops = []

    // If start venue provided, lock it as stop #1
    if (startVenue) {
      const categoryType = inferCategoryType(startVenue.category || '', startVenue.subcategory_slug || '')
      const duration = categoryType === 'food' ? 90 : categoryType === 'dessert' ? 37 : 60
      stops.push({
        venue: startVenue,
        duration,
        travelToNext: null
      })
    }

    // Get remaining venues for selection
    const remaining = nearby.filter(v => !startVenue || v.id !== startVenue.id)

    // Pick 1 food stop (nearest to anchor, if not already food)
    let lastVenue = startVenue
    const categoryType = startVenue ? inferCategoryType(startVenue.category || '', startVenue.subcategory_slug || '') : null

    if (categoryType !== 'food') {
      const foodVenues = remaining.filter(v => inferCategoryType(v.category || '', v.subcategory_slug || '') === 'food')
      if (foodVenues.length > 0) {
        const nearestFood = foodVenues.reduce((nearest, v) => {
          const dist = haversine(
            lastVenue ? lastVenue.latitude : anchorLat,
            lastVenue ? lastVenue.longitude : anchorLng,
            v.latitude,
            v.longitude
          )
          const nearestDist = haversine(
            lastVenue ? lastVenue.latitude : anchorLat,
            lastVenue ? lastVenue.longitude : anchorLng,
            nearest.latitude,
            nearest.longitude
          )
          return dist < nearestDist ? v : nearest
        })

        const travelDist = haversine(
          lastVenue ? lastVenue.latitude : anchorLat,
          lastVenue ? lastVenue.longitude : anchorLng,
          nearestFood.latitude,
          nearestFood.longitude
        )
        stops[stops.length - 1].travelToNext = {
          distanceMeters: Math.round(travelDist),
          walkable: travelDist <= 800,
          minutes: Math.ceil(travelDist / (travelDist <= 800 ? 83 : 333))
        }

        stops.push({
          venue: nearestFood,
          duration: 90,
          travelToNext: null
        })
        lastVenue = nearestFood
      }
    }

    // Pick up to 2 bar stops
    const barVenues = remaining.filter(v =>
      v.id !== lastVenue?.id &&
      inferCategoryType(v.category || '', v.subcategory_slug || '') === 'bar'
    )

    let barCount = 0
    for (const barVenue of barVenues) {
      if (barCount >= 2) break

      const travelDist = haversine(lastVenue.latitude, lastVenue.longitude, barVenue.latitude, barVenue.longitude)

      // Prefer bars within 1km, else take nearest
      let useThisBar = travelDist <= 1000
      if (!useThisBar && barCount === 0) {
        // Take nearest bar if we don't have one yet
        useThisBar = true
      }

      if (useThisBar) {
        stops[stops.length - 1].travelToNext = {
          distanceMeters: Math.round(travelDist),
          walkable: travelDist <= 800,
          minutes: Math.ceil(travelDist / (travelDist <= 800 ? 83 : 333))
        }

        stops.push({
          venue: barVenue,
          duration: 60,
          travelToNext: null
        })
        lastVenue = barVenue
        barCount++
      }
    }

    // Pick 1 nightcap (dessert first, else bar) within 1.5km
    const nightcapPool = remaining.filter(v => v.id !== lastVenue.id)
    const dessertVenues = nightcapPool.filter(v => inferCategoryType(v.category || '', v.subcategory_slug || '') === 'dessert')
    const nightcapCandidates = dessertVenues.length > 0 ? dessertVenues : nightcapPool

    if (nightcapCandidates.length > 0) {
      const nearestNightcap = nightcapCandidates.reduce((nearest, v) => {
        const dist = haversine(lastVenue.latitude, lastVenue.longitude, v.latitude, v.longitude)
        const nearestDist = haversine(lastVenue.latitude, lastVenue.longitude, nearest.latitude, nearest.longitude)
        return dist < nearestDist ? v : nearest
      })

      const travelDist = haversine(lastVenue.latitude, lastVenue.longitude, nearestNightcap.latitude, nearestNightcap.longitude)
      if (travelDist <= 1500 || nightcapCandidates.length === 1) {
        stops[stops.length - 1].travelToNext = {
          distanceMeters: Math.round(travelDist),
          walkable: travelDist <= 800,
          minutes: Math.ceil(travelDist / (travelDist <= 800 ? 83 : 333))
        }

        stops.push({
          venue: nearestNightcap,
          duration: 37,
          travelToNext: null
        })
      }
    }

    res.json({ stops })
  } catch (error) {
    console.error('Error generating itinerary:', error)
    res.status(500).json({ error: 'Failed to generate itinerary' })
  }
}
