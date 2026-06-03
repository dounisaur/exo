export interface Venue {
  id: number
  name: string
  category: string
  subcategory_id?: number
  latitude: number
  longitude: number
  address: string
  image_url?: string
  website_url?: string
  phone_number?: string
  reservation_link?: string
  rating?: number
  status?: 'draft' | 'published'
  created_at?: string
  updated_at?: string
}

export interface Category {
  id: number
  name: string
  slug: string
  subcategories: Subcategory[]
}

export interface Subcategory {
  id: number
  category_id: number
  name: string
  slug: string
}

export interface User {
  id: number
  username: string
  role: string
}

export interface TravelSegment {
  distanceMeters: number
  walkable: boolean
  minutes: number
}

export interface ItineraryStop {
  venue: Venue
  duration: number
  travelToNext: TravelSegment | null
}

export interface Itinerary {
  stops: ItineraryStop[]
}
