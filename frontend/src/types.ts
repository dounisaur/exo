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
