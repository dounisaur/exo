import { useState, useEffect } from 'react'
import { Plus, Edit2, Eye as EyeIcon } from 'lucide-react'
import BottomSheet from './BottomSheet'
import type { Venue, Category, User } from '../types'

interface AdminPanelProps {
  authToken: string
  userRole: string
  categories: Category[]
  onCategoriesUpdated: () => void
  onViewHome: () => void
}

type AdminTab = 'venues' | 'categories' | 'subcategories' | 'users'

function parseGoogleMapsLink(url: string): { lat: number; lng: number } | null {
  try {
    // Try to extract coordinates from various Google Maps URL formats
    // Format 1: ?q=37.7749,-122.4194 or @37.7749,-122.4194
    const coordMatch = url.match(/[?@](?:q=)?(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1])
      const lng = parseFloat(coordMatch[2])
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng }
      }
    }

    // Format 2: /maps/@37.7749,-122.4194,15z
    const mapMatch = url.match(/\/maps\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    if (mapMatch) {
      const lat = parseFloat(mapMatch[1])
      const lng = parseFloat(mapMatch[2])
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng }
      }
    }

    return null
  } catch {
    return null
  }
}

export default function AdminPanel({ authToken, userRole, categories, onCategoriesUpdated, onViewHome }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('venues')
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Venue sheet state
  const [showVenueSheet, setShowVenueSheet] = useState(false)
  const [editingVenueId, setEditingVenueId] = useState<number | null>(null)
  const [lookupQuery, setLookupQuery] = useState('')
  const [lookupResults, setLookupResults] = useState<any[]>([])
  const [lookupLoading, setLookupLoading] = useState(false)
  const [manualAddressEnabled, setManualAddressEnabled] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [googleMapsLink, setGoogleMapsLink] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    category: categories.length > 0 ? categories[0].slug : 'food',
    subcategory_id: '',
    latitude: '',
    longitude: '',
    address: '',
    image_url: '',
    website_url: '',
    phone_number: '',
    reservation_link: '',
    rating: ''
  })

  // Category sheet state
  const [showCategorySheet, setShowCategorySheet] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null)

  // Subcategory sheet state
  const [showSubcategorySheet, setShowSubcategorySheet] = useState(false)
  const [newSubcategoryName, setNewSubcategoryName] = useState('')
  const [selectedCategoryForSubcat, setSelectedCategoryForSubcat] = useState<number | null>(null)

  // User management state (admin only)
  const [users, setUsers] = useState<User[]>([])
  const [showUserSheet, setShowUserSheet] = useState(false)
  const [newUserUsername, setNewUserUsername] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserRole, setNewUserRole] = useState<'admin' | 'creator'>('creator')
  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  const [editUserPassword, setEditUserPassword] = useState('')

  useEffect(() => {
    if (activeTab === 'venues') {
      fetchAdminVenues()
    } else if (activeTab === 'users') {
      fetchUsers()
    }
  }, [activeTab])

  const fetchAdminVenues = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/venues`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      if (!response.ok) throw new Error('Failed to fetch venues')
      const data = await response.json()
      setVenues(data)
    } catch (error) {
      console.error('Error fetching venues:', error)
      setMessage('Error loading venues')
    } finally {
      setLoading(false)
    }
  }

  const handleLookup = async () => {
    if (!lookupQuery.trim()) return

    setLookupLoading(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/venues/lookup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ query: lookupQuery })
      })

      const data = await response.json()
      setLookupResults(data.results || [])
    } catch (error) {
      console.error('Error looking up venue:', error)
    } finally {
      setLookupLoading(false)
    }
  }

  const selectLookupResult = async (result: any) => {
    console.log('Selected lookup result:', result)

    // If we have a place_id, fetch full details including phone and website
    if (result.place_id) {
      try {
        console.log('Fetching full details for place_id:', result.place_id)
        const detailsResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/venues/lookup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ placeId: result.place_id })
        })
        const detailsData = await detailsResponse.json()
        console.log('Details response:', detailsData)
        const fullResult = detailsData.results?.[0]

        if (fullResult) {
          console.log('Full result with details:', fullResult)
          setFormData(prev => ({
            ...prev,
            name: fullResult.name,
            address: fullResult.address,
            latitude: fullResult.latitude.toString(),
            longitude: fullResult.longitude.toString(),
            website_url: fullResult.website_url || '',
            phone_number: fullResult.phone || ''
          }))
        }
      } catch (error) {
        console.error('Error fetching venue details:', error)
        // Fallback to basic result if detail fetch fails
        setFormData(prev => ({
          ...prev,
          name: result.name,
          address: result.address,
          latitude: result.latitude.toString(),
          longitude: result.longitude.toString()
        }))
      }
    } else {
      // Fallback for results without place_id
      console.log('No place_id found, using basic info')
      setFormData(prev => ({
        ...prev,
        name: result.name,
        address: result.address,
        latitude: result.latitude.toString(),
        longitude: result.longitude.toString(),
        website_url: result.website_url || '',
        phone_number: result.phone || ''
      }))
    }
    setLookupResults([])
    setLookupQuery('')
  }

  const handleParseGoogleMapsLink = () => {
    const coords = parseGoogleMapsLink(googleMapsLink)
    if (coords) {
      setFormData(prev => ({
        ...prev,
        latitude: coords.lat.toString(),
        longitude: coords.lng.toString()
      }))
      setGoogleMapsLink('')
      setMessage('Coordinates extracted successfully!')
      setTimeout(() => setMessage(''), 2000)
    } else {
      setMessage('Could not extract coordinates from link. Check the URL format.')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSaveVenue = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    if (!formData.name || !formData.category) {
      setMessage('Name and category are required')
      return
    }

    // Check if we have coordinates (either manually entered or via Google Maps link)
    let lat = parseFloat(formData.latitude)
    let lng = parseFloat(formData.longitude)

    // If coordinates are missing but Google Maps link is provided, try to parse it
    if ((isNaN(lat) || isNaN(lng)) && googleMapsLink) {
      const coords = parseGoogleMapsLink(googleMapsLink)
      if (coords) {
        lat = coords.lat
        lng = coords.lng
      } else {
        setMessage('Could not extract coordinates from Google Maps link')
        return
      }
    }

    // Check if we have valid coordinates
    if (isNaN(lat) || isNaN(lng)) {
      setMessage('Latitude and longitude are required (provide coordinates or Google Maps link)')
      return
    }

    setLoading(true)
    try {
      let imageUrl = formData.image_url
      if (imageFile) {
        const uploadFormData = new FormData()
        uploadFormData.append('image', imageFile)
        const uploadResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}` },
          body: uploadFormData
        })
        const uploadData = await uploadResponse.json()
        imageUrl = uploadData.url
      }

      const payload = {
        ...formData,
        image_url: imageUrl,
        subcategory_id: formData.subcategory_id ? parseInt(formData.subcategory_id) : null,
        latitude: lat,
        longitude: lng,
        rating: formData.rating ? parseFloat(formData.rating) : null
      }

      const method = editingVenueId ? 'PUT' : 'POST'
      const url = editingVenueId
        ? `${import.meta.env.VITE_API_URL}/api/venues/${editingVenueId}`
        : `${import.meta.env.VITE_API_URL}/api/venues`

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error('Failed to save venue')

      setMessage(editingVenueId ? 'Venue updated' : 'Venue created')
      resetVenueForm()
      fetchAdminVenues()
    } catch (error) {
      setMessage('Error saving venue')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const resetVenueForm = () => {
    setFormData({
      name: '',
      category: categories.length > 0 ? categories[0].slug : 'food',
      subcategory_id: '',
      latitude: '',
      longitude: '',
      address: '',
      image_url: '',
      website_url: '',
      phone_number: '',
      reservation_link: '',
      rating: ''
    })
    setImageFile(null)
    setImagePreview('')
    setLookupQuery('')
    setLookupResults([])
    setGoogleMapsLink('')
    setShowVenueSheet(false)
    setEditingVenueId(null)
    setManualAddressEnabled(false)
  }

  const editVenue = (venue: Venue) => {
    setFormData({
      name: venue.name,
      category: venue.category,
      subcategory_id: venue.subcategory_id?.toString() || '',
      latitude: venue.latitude.toString(),
      longitude: venue.longitude.toString(),
      address: venue.address || '',
      image_url: venue.image_url || '',
      website_url: venue.website_url || '',
      phone_number: venue.phone_number || '',
      reservation_link: venue.reservation_link || '',
      rating: venue.rating?.toString() || ''
    })
    setImagePreview(venue.image_url || '')
    setEditingVenueId(venue.id)
    setShowVenueSheet(true)
    setManualAddressEnabled(true)
  }

  const handleDeleteVenue = async (id: number) => {
    if (!confirm('Delete this venue?')) return
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/venues/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      if (!response.ok) throw new Error('Failed to delete')
      setMessage('Venue deleted')
      fetchAdminVenues()
    } catch (error) {
      setMessage('Error deleting venue')
    }
  }

  const handlePublishVenue = async (id: number, currentStatus: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/venues/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ status: currentStatus === 'published' ? 'draft' : 'published' })
      })
      if (!response.ok) throw new Error('Failed to update status')
      fetchAdminVenues()
    } catch (error) {
      setMessage('Error updating status')
    }
  }

  // Category handlers
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return

    setLoading(true)
    try {
      const method = editingCategoryId ? 'PUT' : 'POST'
      const url = editingCategoryId
        ? `${import.meta.env.VITE_API_URL}/api/categories/${editingCategoryId}`
        : `${import.meta.env.VITE_API_URL}/api/categories`

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ name: newCategoryName })
      })

      if (!response.ok) throw new Error('Failed to save category')
      setMessage(editingCategoryId ? 'Category updated' : 'Category created')
      setNewCategoryName('')
      setEditingCategoryId(null)
      setShowCategorySheet(false)
      onCategoriesUpdated()
    } catch (error) {
      setMessage('Error saving category')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Delete this category?')) return
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      if (!response.ok) throw new Error('Failed to delete')
      onCategoriesUpdated()
    } catch (error) {
      setMessage('Error deleting category')
    }
  }

  // Subcategory handlers
  const handleSaveSubcategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubcategoryName.trim() || !selectedCategoryForSubcat) return

    setLoading(true)
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/categories/${selectedCategoryForSubcat}/subcategories`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ name: newSubcategoryName })
        }
      )

      if (!response.ok) throw new Error('Failed to save subcategory')
      setMessage('Subcategory created')
      setNewSubcategoryName('')
      setSelectedCategoryForSubcat(null)
      setShowSubcategorySheet(false)
      onCategoriesUpdated()
    } catch (error) {
      setMessage('Error saving subcategory')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSubcategory = async (id: number) => {
    if (!confirm('Delete this subcategory?')) return
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/subcategories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      if (!response.ok) throw new Error('Failed to delete')
      onCategoriesUpdated()
    } catch (error) {
      setMessage('Error deleting subcategory')
    }
  }

  // User management handlers
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      if (!response.ok) throw new Error('Failed to fetch users')
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      setMessage('Error loading users')
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUserUsername.trim() || !newUserPassword.trim()) return
    setLoading(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ username: newUserUsername, password: newUserPassword, role: newUserRole })
      })
      if (!response.ok) {
        const err = await response.json()
        setMessage(err.error || 'Error creating user')
        return
      }
      setMessage('User created')
      setNewUserUsername('')
      setNewUserPassword('')
      setNewUserRole('creator')
      setShowUserSheet(false)
      fetchUsers()
    } catch (error) {
      setMessage('Error creating user')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Delete this user? This cannot be undone.')) return
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      if (!response.ok) {
        const err = await response.json()
        setMessage(err.error || 'Error deleting user')
        return
      }
      setMessage('User deleted')
      fetchUsers()
    } catch (error) {
      setMessage('Error deleting user')
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUserId(user.id)
    setEditUserPassword('')
    setShowUserSheet(true)
  }

  const handleUpdateUserPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUserPassword.trim() || !editingUserId) return
    setLoading(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${editingUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ password: editUserPassword })
      })
      if (!response.ok) {
        const err = await response.json()
        setMessage(err.error || 'Error updating password')
        return
      }
      setMessage('Password updated')
      setEditingUserId(null)
      setEditUserPassword('')
      setShowUserSheet(false)
    } catch (error) {
      setMessage('Error updating password')
    } finally {
      setLoading(false)
    }
  }

  const getSubcategoryName = (subcategoryId?: number) => {
    for (const category of categories) {
      const subcategory = category.subcategories.find(s => s.id === subcategoryId)
      if (subcategory) return subcategory.name
    }
    return null
  }

  const getCategoryById = (slug: string) => categories.find(c => c.slug === slug)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">🍴 EXΩ 🍷 Admin</h1>
          <button
            onClick={onViewHome}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            <EyeIcon size={18} />
            <span>View Site</span>
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white">
        <div className="flex">
          {[
            { id: 'venues', label: 'Venues' },
            { id: 'categories', label: 'Categories' },
            { id: 'subcategories', label: 'Subcategories' },
            ...(userRole === 'admin' ? [{ id: 'users', label: 'Users' }] : [])
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`px-6 py-4 font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-4">
          {/* Messages */}
          {message && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 animate-slide-in">
              <p className="text-sm font-medium text-green-800">{message}</p>
            </div>
          )}

          {/* Venues Tab */}
          {activeTab === 'venues' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Venues</h2>
                <button
                  onClick={() => {
                    resetVenueForm()
                    setShowVenueSheet(true)
                  }}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus size={18} />
                  <span>Add Venue</span>
                </button>
              </div>

              <div className="grid gap-4">
                {loading && !showVenueSheet ? (
                  <div className="p-8 text-center text-gray-600">Loading venues...</div>
                ) : venues.length === 0 ? (
                  <div className="p-8 text-center text-gray-600">No venues yet</div>
                ) : (
                  venues.map(venue => (
                    <div key={venue.id} className="card p-4 flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{venue.name}</h3>
                        <p className="text-sm text-gray-600">{getSubcategoryName(venue.subcategory_id) || venue.category}</p>
                        <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          venue.status === 'published'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {venue.status === 'published' ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => editVenue(venue)}
                          className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handlePublishVenue(venue.id, venue.status || 'draft')}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title={venue.status === 'published' ? 'Unpublish' : 'Publish'}
                        >
                          <EyeIcon size={16} className={venue.status === 'published' ? 'text-green-600' : 'text-gray-400'} />
                        </button>
                        <button
                          onClick={() => handleDeleteVenue(venue.id)}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Categories</h2>
                <button
                  onClick={() => {
                    setNewCategoryName('')
                    setEditingCategoryId(null)
                    setShowCategorySheet(true)
                  }}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus size={18} />
                  <span>Add Category</span>
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categories.map(cat => (
                  <div key={cat.id} className="card p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-bold text-lg text-gray-900">{cat.name}</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setNewCategoryName(cat.name)
                            setEditingCategoryId(cat.id)
                            setShowCategorySheet(true)
                          }}
                          className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{cat.subcategories.length} subcategories</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subcategories Tab */}
          {activeTab === 'subcategories' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Subcategories</h2>
                <button
                  onClick={() => {
                    setNewSubcategoryName('')
                    setSelectedCategoryForSubcat(null)
                    setShowSubcategorySheet(true)
                  }}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus size={18} />
                  <span>Add Subcategory</span>
                </button>
              </div>

              <div className="grid gap-4">
                {categories.flatMap(cat =>
                  cat.subcategories.map(sub => (
                    <div key={sub.id} className="card p-4 flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900">{sub.name}</h3>
                        <p className="text-sm text-gray-600">in {cat.name}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteSubcategory(sub.id)}
                        className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && userRole === 'admin' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Users</h2>
                <button
                  onClick={() => setShowUserSheet(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus size={18} />
                  <span>Add User</span>
                </button>
              </div>
              <div className="grid gap-4">
                {users.length === 0 ? (
                  <div className="p-8 text-center text-gray-600">No users found</div>
                ) : (
                  users.map(user => (
                    <div key={user.id} className="card p-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900">{user.username}</h3>
                        <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                          title="Edit password"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                          title="Delete user"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Venue Sheet */}
      <BottomSheet
        isOpen={showVenueSheet}
        onClose={resetVenueForm}
        title={editingVenueId ? 'Edit Venue' : 'Add Venue'}
      >
        <form onSubmit={handleSaveVenue} className="space-y-6">
          {/* Lookup Section - Only show when adding new venue */}
          {!editingVenueId && (
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-4 space-y-3">
              <h3 className="font-semibold text-blue-900">Quick Lookup</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  placeholder="Search for a venue..."
                  className="input-field flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleLookup()}
                />
                <button
                  type="button"
                  onClick={handleLookup}
                  disabled={lookupLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  {lookupLoading ? '...' : 'Search'}
                </button>
              </div>

              {lookupResults.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {lookupResults.map((result, idx) => (
                    <div
                      key={idx}
                      onClick={() => selectLookupResult(result)}
                      className="p-3 bg-white border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
                    >
                      <p className="font-medium text-gray-900 text-sm">{result.name}</p>
                      <p className="text-xs text-gray-600">{result.address}</p>
                    </div>
                  ))}
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={manualAddressEnabled}
                  onChange={(e) => setManualAddressEnabled(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium text-blue-900">Or enter details manually</span>
              </label>
            </div>
          )}

          {/* Form Sections */}
          <div className="space-y-4">
            {/* Basic Info Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 px-1">Basic Information</h3>
              <div className="space-y-3 bg-white rounded-lg p-4 border border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="input-field"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="input-field"
                      required
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.slug}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
                    <select
                      name="subcategory_id"
                      value={formData.subcategory_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, subcategory_id: e.target.value }))}
                      className="input-field"
                    >
                      <option value="">None</option>
                      {getCategoryById(formData.category)?.subcategories.map(sub => (
                        <option key={sub.id} value={sub.id.toString()}>{sub.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating (0-5)</label>
                  <input
                    type="number"
                    name="rating"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.rating}
                    onChange={(e) => setFormData(prev => ({ ...prev, rating: e.target.value }))}
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* Location Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 px-1">Location</h3>
              <div className="space-y-3 bg-white rounded-lg p-4 border border-gray-200">
                {!manualAddressEnabled ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-600 mb-2">Auto-filled from lookup</p>
                    <p className="text-xs text-gray-500">{formData.address || 'Use quick lookup above'}</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        className="input-field"
                      />
                    </div>

                    {/* Google Maps Link Option */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Google Maps Link (optional)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Paste Google Maps share link..."
                          value={googleMapsLink}
                          onChange={(e) => setGoogleMapsLink(e.target.value)}
                          className="input-field flex-1"
                        />
                        <button
                          type="button"
                          onClick={handleParseGoogleMapsLink}
                          disabled={!googleMapsLink}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-sm font-medium"
                        >
                          Parse
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">or enter coordinates manually below</p>
                    </div>

                    {/* Manual Coordinates */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                        <input
                          type="number"
                          name="latitude"
                          step="0.0001"
                          value={formData.latitude}
                          onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                          className="input-field"
                          placeholder="e.g., 37.7749"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                        <input
                          type="number"
                          name="longitude"
                          step="0.0001"
                          value={formData.longitude}
                          onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                          className="input-field"
                          placeholder="e.g., -122.4194"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Contact Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 px-1">Contact & Links</h3>
              <div className="space-y-3 bg-white rounded-lg p-4 border border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="url"
                    name="website_url"
                    value={formData.website_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                    className="input-field"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                    className="input-field"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reservation Link</label>
                  <input
                    type="url"
                    name="reservation_link"
                    value={formData.reservation_link}
                    onChange={(e) => setFormData(prev => ({ ...prev, reservation_link: e.target.value }))}
                    className="input-field"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            {/* Media Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 px-1">Media</h3>
              <div className="space-y-3 bg-white rounded-lg p-4 border border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="input-field"
                  />
                </div>
                {imagePreview && (
                  <div className="space-y-2">
                    <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview('')
                        setImageFile(null)
                        setFormData(prev => ({ ...prev, image_url: '' }))
                      }}
                      className="w-full px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      Delete Image
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button type="submit" disabled={loading} className="btn-primary flex-1 font-semibold">
              {loading ? 'Saving...' : editingVenueId ? 'Update Venue' : 'Create Venue'}
            </button>
            <button
              type="button"
              onClick={resetVenueForm}
              className="btn-secondary flex-1 font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Category Sheet */}
      <BottomSheet
        isOpen={showCategorySheet}
        onClose={() => setShowCategorySheet(false)}
        title={editingCategoryId ? 'Edit Category' : 'Add Category'}
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setShowCategorySheet(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Subcategory Sheet */}
      <BottomSheet
        isOpen={showSubcategorySheet}
        onClose={() => setShowSubcategorySheet(false)}
        title="Add Subcategory"
      >
        <form onSubmit={handleSaveSubcategory} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Parent Category</label>
            <select
              value={selectedCategoryForSubcat || ''}
              onChange={(e) => setSelectedCategoryForSubcat(e.target.value ? parseInt(e.target.value) : null)}
              className="input-field"
              required
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory Name</label>
            <input
              type="text"
              value={newSubcategoryName}
              onChange={(e) => setNewSubcategoryName(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setShowSubcategorySheet(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* User Sheet */}
      <BottomSheet
        isOpen={showUserSheet}
        onClose={() => {
          setShowUserSheet(false)
          setEditingUserId(null)
          setEditUserPassword('')
          setNewUserUsername('')
          setNewUserPassword('')
        }}
        title={editingUserId ? 'Edit Password' : 'Add User'}
      >
        {editingUserId ? (
          <form onSubmit={handleUpdateUserPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                type="text"
                value={users.find(u => u.id === editingUserId)?.username || ''}
                disabled
                className="input-field bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <input
                type="password"
                value={editUserPassword}
                onChange={(e) => setEditUserPassword(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? 'Updating...' : 'Update Password'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUserSheet(false)
                  setEditingUserId(null)
                  setEditUserPassword('')
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                type="text"
                value={newUserUsername}
                onChange={(e) => setNewUserUsername(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'creator')}
                className="input-field"
              >
                <option value="creator">Creator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? 'Creating...' : 'Create User'}
              </button>
              <button
                type="button"
                onClick={() => setShowUserSheet(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </BottomSheet>
    </div>
  )
}
