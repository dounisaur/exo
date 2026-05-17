import { useState, useEffect } from 'react'
import type { Venue, Category } from '../types'
import MobileNav from './MobileNav'

interface AdminPanelProps {
  onVenueAdded: () => void
  authToken: string
  categories: Category[]
  onCategoriesUpdated: () => void
}

type AdminTab = 'venues' | 'categories' | 'subcategories'

export default function AdminPanel({ _onVenueAdded, authToken, categories, onCategoriesUpdated }: AdminPanelProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: categories.length > 0 ? categories[0].slug : 'food',
    subcategory_id: '',
    latitude: '',
    longitude: '',
    address: '', // Hidden, auto-filled from search
    image_url: '',
    website_url: '',
    phone_number: '',
    reservation_link: '',
    rating: ''
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [venues, setVenues] = useState<Venue[]>([])
  const [loadingVenues, setLoadingVenues] = useState(false)
  const [activeTab, setActiveTab] = useState<AdminTab>('venues')
  const [showAddVenueForm, setShowAddVenueForm] = useState(false)

  // CMS states
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newSubcategoryName, setNewSubcategoryName] = useState('')
  const [selectedCategoryForSubcat, setSelectedCategoryForSubcat] = useState<number | null>(null)
  const [_editingCategory, _setEditingCategory] = useState<number | null>(null)
  const [editingSubcategory, setEditingSubcategory] = useState<number | null>(null)
  const [cmsMessage, setCmsMessage] = useState('')
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false)
  const [showAddSubcategoryForm, setShowAddSubcategoryForm] = useState(false)

  // Lookup states
  const [lookupQuery, setLookupQuery] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupResults, setLookupResults] = useState<any[]>([])
  const [lookupMessage, setLookupMessage] = useState('')

  // Edit venue states
  const [editingVenueId, setEditingVenueId] = useState<number | null>(null)

  // Edit category state
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [subcategoryPage, setSubcategoryPage] = useState(1)
  const VENUES_PER_PAGE = 10
  const SUBCATEGORIES_PER_PAGE = 10

  // Subcategory filter state
  const [subcategoryFilterId, setSubcategoryFilterId] = useState<number | null>(null)
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)

  // View venue state
  const [viewingVenueId, setViewingVenueId] = useState<number | null>(null)

  // Mobile action sheet state
  const [actionSheetVenueId, setActionSheetVenueId] = useState<number | null>(null)
  const [actionSheetCategoryId, setActionSheetCategoryId] = useState<number | null>(null)

  // Fetch admin venues on mount
  useEffect(() => {
    fetchAdminVenues()
  }, [])

  // Cleanup object URLs on unmount or image change
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  // Update formData when category changes
  useEffect(() => {
    if (formData.category) {
      setFormData(prev => ({ ...prev, subcategory_id: '' }))
    }
  }, [formData.category])

  const fetchAdminVenues = async () => {
    setLoadingVenues(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/venues`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      if (!response.ok) throw new Error('Failed to fetch venues')
      const data = await response.json()
      setVenues(data)
    } catch (error) {
      console.error('Error fetching venues:', error)
    } finally {
      setLoadingVenues(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setImageFile(file)
    setImagePreview(file ? URL.createObjectURL(file) : '')
  }

  const handleLookup = async () => {
    if (!lookupQuery.trim()) {
      setLookupMessage('Please enter a restaurant name')
      return
    }

    setLookupLoading(true)
    setLookupMessage('')
    setLookupResults([])

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/venues/lookup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ type: 'search', query: lookupQuery })
      })

      const data = await response.json()

      if (data.results && data.results.length > 0) {
        setLookupResults(data.results)
      } else {
        setLookupMessage('No results found')
      }
    } catch (error) {
      setLookupMessage('Error looking up location')
      console.error('Lookup error:', error)
    } finally {
      setLookupLoading(false)
    }
  }

  const selectVenueFromResults = async (result: any) => {
    // If result has place_id, fetch full details including website and phone
    if (result.place_id) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/venues/lookup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ placeId: result.place_id })
        })

        const data = await response.json()
        if (data.results && data.results.length > 0) {
          const fullResult = data.results[0]
          setFormData(prev => ({
            ...prev,
            name: fullResult.name || prev.name,
            address: fullResult.address || prev.address,
            latitude: String(fullResult.latitude || prev.latitude),
            longitude: String(fullResult.longitude || prev.longitude),
            website_url: fullResult.website_url || prev.website_url,
            phone_number: fullResult.phone || prev.phone_number
          }))
        }
      } catch (error) {
        console.error('Error fetching place details:', error)
      }
    } else {
      // Fallback if result already has all data
      setFormData(prev => ({
        ...prev,
        name: result.name || prev.name,
        address: result.address || prev.address,
        latitude: String(result.latitude || prev.latitude),
        longitude: String(result.longitude || prev.longitude),
        website_url: result.website_url || prev.website_url,
        phone_number: result.phone || prev.phone_number
      }))
    }

    setLookupResults([])
    setLookupQuery('')
    setLookupMessage(`✅ Selected: "${result.name}"`)
    setTimeout(() => setLookupMessage(''), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // Validate required fields
    if (!formData.name.trim()) {
      setMessage('Error: Venue name is required')
      setLoading(false)
      return
    }

    if (!formData.latitude || !formData.longitude) {
      setMessage('Error: Please search for a restaurant to auto-fill location')
      setLoading(false)
      return
    }

    try {
      let finalImageUrl = formData.image_url

      if (imageFile) {
        const fd = new FormData()
        fd.append('image', imageFile)
        const uploadRes = await fetch(`${import.meta.env.VITE_API_URL}/api/upload`, {
          method: 'POST',
          body: fd
        })
        if (!uploadRes.ok) throw new Error('Image upload failed')
        const { url } = await uploadRes.json()
        finalImageUrl = url
      }

      const endpoint = editingVenueId
        ? `${import.meta.env.VITE_API_URL}/api/venues/${editingVenueId}`
        : `${import.meta.env.VITE_API_URL}/api/venues`;

      const method = editingVenueId ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          ...formData,
          image_url: finalImageUrl,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          subcategory_id: formData.subcategory_id ? parseInt(formData.subcategory_id) : null,
          status: editingVenueId ? venues.find(v => v.id === editingVenueId)?.status : 'draft'
        })
      })

      if (!response.ok) throw new Error(`Failed to ${editingVenueId ? 'update' : 'add'} venue`)

      setMessage(`Venue ${editingVenueId ? 'updated' : 'added'} successfully!`)
      setImageFile(null)
      setImagePreview('')
      setLookupQuery('')
      setEditingVenueId(null)
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

      setShowAddVenueForm(false)
      setActiveTab('venues')
      setTimeout(() => {
        fetchAdminVenues()
      }, 500)
    } catch (error) {
      setMessage('Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published'
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/venues/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ status: newStatus })
      })
      if (!response.ok) throw new Error(`Failed to ${newStatus === 'published' ? 'publish' : 'unpublish'} venue`)
      fetchAdminVenues()
    } catch (error) {
      alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this venue?')) return
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/venues/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      if (!response.ok) throw new Error('Failed to delete venue')
      setShowAddVenueForm(false)
      fetchAdminVenues()
    } catch (error) {
      alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleEditVenue = (venue: Venue) => {
    setFormData({
      name: venue.name,
      category: venue.category,
      subcategory_id: venue.subcategory_id ? venue.subcategory_id.toString() : '',
      latitude: venue.latitude.toString(),
      longitude: venue.longitude.toString(),
      address: venue.address || '',
      image_url: venue.image_url || '',
      website_url: venue.website_url || '',
      phone_number: venue.phone_number || '',
      reservation_link: venue.reservation_link || '',
      rating: venue.rating ? venue.rating.toString() : ''
    })
    setEditingVenueId(venue.id)
    setShowAddVenueForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // CMS Functions
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setCmsMessage('')

    if (!newCategoryName.trim()) {
      setCmsMessage('Category name required')
      return
    }

    try {
      const method = editingCategoryId ? 'PUT' : 'POST'
      const endpoint = editingCategoryId
        ? `${import.meta.env.VITE_API_URL}/api/categories/${editingCategoryId}`
        : `${import.meta.env.VITE_API_URL}/api/categories`

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ name: newCategoryName })
      })

      if (!response.ok) {
        const error = await response.json()
        setCmsMessage(error.error || `Failed to ${editingCategoryId ? 'update' : 'add'} category`)
        return
      }

      setCmsMessage(`Category ${editingCategoryId ? 'updated' : 'added'}!`)
      setNewCategoryName('')
      setEditingCategoryId(null)
      setShowAddCategoryForm(false)
      onCategoriesUpdated()
      setTimeout(() => setCmsMessage(''), 2000)
    } catch (error) {
      setCmsMessage('Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleEditCategory = (category: Category) => {
    setNewCategoryName(category.name)
    setEditingCategoryId(category.id)
    setShowAddCategoryForm(true)
  }

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Delete this category and all its subcategories?')) return

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      if (!response.ok) throw new Error('Failed to delete category')
      onCategoriesUpdated()
    } catch (error) {
      alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleAddSubcategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setCmsMessage('')

    if (!selectedCategoryForSubcat || !newSubcategoryName.trim()) {
      setCmsMessage('Select a category and enter a name')
      return
    }

    try {
      const method = editingSubcategory ? 'PUT' : 'POST'
      const endpoint = editingSubcategory
        ? `${import.meta.env.VITE_API_URL}/api/subcategories/${editingSubcategory}`
        : `${import.meta.env.VITE_API_URL}/api/categories/${selectedCategoryForSubcat}/subcategories`

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(editingSubcategory ? { name: newSubcategoryName } : { name: newSubcategoryName })
      })

      if (!response.ok) {
        const error = await response.json()
        setCmsMessage(error.error || `Failed to ${editingSubcategory ? 'update' : 'add'} subcategory`)
        return
      }

      setCmsMessage(`Subcategory ${editingSubcategory ? 'updated' : 'added'}!`)
      setNewSubcategoryName('')
      setSelectedCategoryForSubcat(null)
      setEditingSubcategory(null)
      setShowAddSubcategoryForm(false)
      setActiveTab('subcategories')
      onCategoriesUpdated()
      setTimeout(() => setCmsMessage(''), 2000)
    } catch (error) {
      setCmsMessage('Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleEditSubcategory = (subcat: any) => {
    setEditingSubcategory(subcat.id)
    setSelectedCategoryForSubcat(subcat.categoryId)
    setNewSubcategoryName(subcat.name)
    setShowAddSubcategoryForm(true)
  }

  const handleDeleteSubcategory = async (id: number) => {
    if (!confirm('Delete this subcategory?')) return

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/subcategories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      if (!response.ok) throw new Error('Failed to delete subcategory')
      onCategoriesUpdated()
    } catch (error) {
      alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const selectedCategory = categories.find(c => c.slug === formData.category)
  const subcategories = selectedCategory?.subcategories || []

  return (
    <div className="admin-layout">
      {/* Mobile Navigation Component */}
      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="admin-sidebar-desktop">
        <nav className="admin-nav">
          <button
            className={`admin-nav-item ${activeTab === 'venues' ? 'active' : ''}`}
            onClick={() => setActiveTab('venues')}
          >
            <span className="nav-icon">📍</span>
            <span>Venues</span>
          </button>
          <button
            className={`admin-nav-item ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            <span className="nav-icon">🏷️</span>
            <span>Categories</span>
          </button>
          <button
            className={`admin-nav-item ${activeTab === 'subcategories' ? 'active' : ''}`}
            onClick={() => setActiveTab('subcategories')}
          >
            <span className="nav-icon">✨</span>
            <span>Sub Categories</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-content">

        {activeTab === 'venues' && (
          <>
            <h2>Venues</h2>

            {/* Header with Stats and Add Button */}
            <div className="venue-stats-header" style={{
              display: 'flex',
              gap: '2rem',
              marginBottom: '3rem',
              alignItems: 'center',
              position: 'relative',
              background: 'linear-gradient(135deg, #2a5298 0%, #3a6db5 100%)',
              padding: '1.5rem 2.5rem',
              borderRadius: '16px',
              color: 'white',
              boxShadow: '0 4px 16px rgba(42, 82, 152, 0.2)',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                📊 Venues Overview
              </h3>

              <div className="venue-stats-button-container" style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginLeft: 'auto' }}>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, lineHeight: '1' }}>
                      {venues.length}
                    </div>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', opacity: 0.9 }}>
                      Total venues
                    </p>
                  </div>
                  <div style={{ borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, lineHeight: '1' }}>
                      {venues.filter(v => v.status === 'published').length}
                    </div>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', opacity: 0.9 }}>
                      Published
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowAddVenueForm(!showAddVenueForm)}
                  style={{
                    padding: '0.8rem 1.5rem',
                    background: 'white',
                    color: '#2a5298',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }}
                >
                  {showAddVenueForm ? '✕ Close' : '➕ Add New Venue'}
                </button>
              </div>
            </div>

            {/* Add Venue Form - Conditional */}
            {showAddVenueForm && (
              <div style={{
                background: 'white',
                padding: '2.5rem',
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                border: '1px solid #e5e7eb',
                marginBottom: '3rem'
              }}>
                <h3 style={{
                  margin: '0 0 2rem 0',
                  fontSize: '1.3rem',
                  color: '#1f2937',
                  fontWeight: 600
                }}>
                  {editingVenueId ? 'Edit Venue' : 'Create New Venue'}
                </h3>

          <form onSubmit={handleSubmit}>
            {/* Lookup Section */}
            <div className="form-group" style={{ backgroundColor: '#f3f4f6', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid #e5e7eb' }}>
              <label style={{ marginBottom: '1rem', display: 'block' }}>🔍 Search Restaurant by Name (optional)</label>

              {/* Input and Button */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    placeholder="e.g., Noma, Copenhagen"
                    value={lookupQuery}
                    onChange={(e) => setLookupQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleLookup()
                      }
                    }}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleLookup}
                  disabled={lookupLoading}
                  style={{
                    background: 'linear-gradient(135deg, #2a5298 0%, #3a6db5 100%)',
                    color: 'white',
                    padding: '0.9rem 1.75rem',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    cursor: lookupLoading ? 'not-allowed' : 'pointer',
                    opacity: lookupLoading ? 0.6 : 1,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {lookupLoading ? 'Searching...' : 'Search'}
                </button>
              </div>

              {/* Results List */}
              {lookupResults.length > 0 && (
                <div style={{ marginTop: '1.5rem', backgroundColor: 'white', borderRadius: '8px', padding: '1rem', border: '1px solid #d1d5db' }}>
                  <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>Found {lookupResults.length} result{lookupResults.length > 1 ? 's' : ''}:</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {lookupResults.map((result, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectVenueFromResults(result)}
                        style={{
                          textAlign: 'left',
                          padding: '1rem',
                          backgroundColor: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          fontSize: '0.95rem'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f3f4f6'
                          e.currentTarget.style.borderColor = '#2a5298'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#f9fafb'
                          e.currentTarget.style.borderColor = '#e5e7eb'
                        }}
                      >
                        <div style={{ fontWeight: 600, color: '#1f2937', marginBottom: '0.25rem' }}>{result.name}</div>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{result.address}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message */}
              {lookupMessage && (
                <p style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  backgroundColor: lookupMessage.includes('No results') ? '#fef2f2' : '#ecfdf5',
                  color: lookupMessage.includes('No results') ? '#dc2626' : '#059669',
                  border: `1px solid ${lookupMessage.includes('No results') ? '#fee2e2' : '#d1fae5'}`
                }}>
                  {lookupMessage}
                </p>
              )}
            </div>

            <div className="form-group">
              <label>Venue Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Category *</label>
              <select name="category" value={formData.category} onChange={handleChange} required>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
            </div>

            {subcategories.length > 0 && (
              <div className="form-group">
                <label>Subcategory</label>
                <select name="subcategory_id" value={formData.subcategory_id} onChange={handleChange}>
                  <option value="">Select a subcategory...</option>
                  {subcategories.map(subcat => (
                    <option key={subcat.id} value={subcat.id.toString()}>{subcat.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Hidden inputs for latitude/longitude - still stored and sent to API */}
            <input
              type="hidden"
              name="latitude"
              value={formData.latitude}
            />
            <input
              type="hidden"
              name="longitude"
              value={formData.longitude}
            />

            {/* Google Maps Link Display */}
            <div className="form-group">
              <label>Location *</label>
              {formData.latitude && formData.longitude ? (
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#f0f4ff',
                  border: '1px solid #2a5298',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}>
                  <div style={{
                    fontSize: '0.95rem',
                    color: '#1f2937',
                    fontWeight: 500
                  }}>
                    📍 {formData.address || 'Location set'}
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/${encodeURIComponent(formData.name)}/@${formData.latitude},${formData.longitude},15z`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '0.6rem 1.2rem',
                      background: 'linear-gradient(135deg, #2a5298 0%, #3a6db5 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(42, 82, 152, 0.3)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    View on Maps
                  </a>
                </div>
              ) : (
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#f3f4f6',
                  border: '1px dashed #d1d5db',
                  borderRadius: '8px',
                  color: '#6b7280',
                  fontSize: '0.95rem',
                  textAlign: 'center'
                }}>
                  Search for a restaurant above to auto-fill location
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Image</label>
              <input type="file" accept="image/*" onChange={handleImageChange} />
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{
                    marginTop: 8,
                    maxWidth: '100%',
                    maxHeight: 200,
                    objectFit: 'cover',
                    borderRadius: 4
                  }}
                />
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Website URL</label>
                <input
                  type="url"
                  name="website_url"
                  value={formData.website_url}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Reservation Link</label>
              <input
                type="url"
                name="reservation_link"
                value={formData.reservation_link}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Star Rating (0-5)</label>
              <input
                type="text"
                name="rating"
                value={formData.rating}
                onChange={(e) => {
                  const val = e.target.value;
                  // Allow empty, numbers, and decimal point
                  if (val === '' || /^\d+\.?\d*$/.test(val)) {
                    handleChange(e);
                  }
                }}
                placeholder="e.g., 4, 4.5, 4.8, 5"
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #2a5298 0%, #3a6db5 100%)',
                  color: 'white',
                  padding: '0.95rem 1.5rem',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(42, 82, 152, 0.25)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.boxShadow = '0 6px 20px rgba(42, 82, 152, 0.35)', e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.boxShadow = '0 4px 12px rgba(42, 82, 152, 0.25)', e.currentTarget.style.transform = 'translateY(0)')}
              >
                {loading ? (editingVenueId ? 'Updating...' : 'Creating...') : (editingVenueId ? 'Update Venue' : 'Create Venue')}
              </button>

              <button
                type="button"
                onClick={() => {
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
                  setMessage('')
                  setLookupMessage('')
                  setEditingVenueId(null)
                }}
                className="btn-clear"
                style={{ flex: 1, padding: '0.95rem 1.5rem', fontSize: '1rem', textAlign: 'center', justifyContent: 'center' }}
                title="Clear form"
              >
                Clear
              </button>
            </div>
            {message && <p className={message.includes('Error') ? 'error' : 'success'}>{message}</p>}
          </form>
              </div>
            )}

            {/* Venues List Section - Only show when form is closed */}
            {!showAddVenueForm && (
              <div style={{
                background: 'white',
                padding: '1.5rem 2.5rem',
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                border: '1px solid #e5e7eb',
                width: '100%',
                boxSizing: 'border-box',
                overflow: 'visible'
              }}>
                <h3 style={{
                  margin: '0 0 2rem 0',
                  fontSize: '1.3rem',
                  color: '#1f2937',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <span>📍</span> All Venues
                </h3>

            {loadingVenues ? (
              <p style={{ textAlign: 'center', color: '#6b7280' }}>Loading venues...</p>
            ) : venues.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem 0' }}>No venues yet. Create your first venue!</p>
            ) : (
              <>
              <div className="venue-list">
                {venues.slice((currentPage - 1) * VENUES_PER_PAGE, currentPage * VENUES_PER_PAGE).map(venue => (
                  <div key={venue.id} className="venue-item">
                    <div className="venue-info">
                      {venue.image_url && (
                        <img
                          src={venue.image_url}
                          alt={venue.name}
                          className="venue-thumbnail"
                          style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4, marginRight: 16 }}
                        />
                      )}
                      <div>
                        <h3>{venue.name}</h3>
                        <p className="status-badge">
                          Status: <strong style={{
                            color: (venue.status === 'published') ? '#10b981' : '#ef4444',
                            textTransform: 'capitalize'
                          }}>
                            {(venue.status === 'published' ? 'Published' : 'Unpublished')}
                          </strong>
                        </p>
                      </div>
                    </div>
                    <div className="venue-actions">
                      {/* Desktop buttons (hidden on mobile) */}
                      <div style={{ display: 'contents' }} className="venue-actions-desktop">
                        <button
                          onClick={() => handleEditVenue(venue)}
                          className="btn-edit"
                          style={{ marginLeft: 0 }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => setViewingVenueId(venue.id)}
                          style={{
                            padding: '0.6rem 1.2rem',
                            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                            color: '#1f2937',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.2)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)'
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.2)'
                          }}
                        >
                          👁️ View
                        </button>
                        <button
                          onClick={() => handlePublish(venue.id, venue.status || 'draft')}
                          style={{
                            padding: '0.6rem 1.2rem',
                            background: venue.status === 'published'
                              ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: venue.status === 'published'
                              ? '0 2px 8px rgba(107, 114, 128, 0.2)'
                              : '0 2px 8px rgba(16, 185, 129, 0.2)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)'
                            e.currentTarget.style.boxShadow = venue.status === 'published'
                              ? '0 4px 12px rgba(107, 114, 128, 0.3)'
                              : '0 4px 12px rgba(16, 185, 129, 0.3)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = venue.status === 'published'
                              ? '0 2px 8px rgba(107, 114, 128, 0.2)'
                              : '0 2px 8px rgba(16, 185, 129, 0.2)'
                          }}
                        >
                          {venue.status === 'published' ? '✕ Unpublish' : '✓ Publish'}
                        </button>
                        <button
                          onClick={() => handleDelete(venue.id)}
                          className="btn-delete"
                        >
                          🗑️ Delete
                        </button>
                      </div>

                      {/* Mobile action button (shown on mobile) */}
                      <button
                        onClick={() => setActionSheetVenueId(actionSheetVenueId === venue.id ? null : venue.id)}
                        style={{
                          display: 'none',
                          padding: '0.6rem 1.2rem',
                          background: 'linear-gradient(135deg, #2a5298 0%, #3a6db5 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        className="venue-actions-mobile"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {venues.length > VENUES_PER_PAGE && (
                <div style={{
                  marginTop: '2rem',
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  alignItems: 'center'
                }}>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: '0.6rem 1rem',
                      background: currentPage === 1 ? '#d1d5db' : '#2a5298',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      fontWeight: 600
                    }}
                  >
                    ← Previous
                  </button>

                  {Array.from({ length: Math.ceil(venues.length / VENUES_PER_PAGE) }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      style={{
                        padding: '0.6rem 0.8rem',
                        background: currentPage === page ? '#2a5298' : '#e5e7eb',
                        color: currentPage === page ? 'white' : '#1f2937',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: currentPage === page ? 600 : 400
                      }}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(venues.length / VENUES_PER_PAGE), prev + 1))}
                    disabled={currentPage === Math.ceil(venues.length / VENUES_PER_PAGE)}
                    style={{
                      padding: '0.6rem 1rem',
                      background: currentPage === Math.ceil(venues.length / VENUES_PER_PAGE) ? '#d1d5db' : '#2a5298',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: currentPage === Math.ceil(venues.length / VENUES_PER_PAGE) ? 'not-allowed' : 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Next →
                  </button>
                </div>
              )}
              </>
            )}
              </div>
            )}

            {/* Mobile Action Sheet */}
            {actionSheetVenueId && venues.find(v => v.id === actionSheetVenueId) && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                zIndex: 1000
              }}>
                <div style={{
                  background: 'white',
                  borderRadius: '16px 16px 0 0',
                  padding: '1.5rem',
                  width: '100%',
                  maxWidth: '100%',
                  boxShadow: '0 -20px 60px rgba(0, 0, 0, 0.3)',
                  animation: 'slideUp 0.3s ease-out'
                }}>
                  {(() => {
                    const venue = venues.find(v => v.id === actionSheetVenueId)
                    if (!venue) return null
                    return (
                      <>
                        <div style={{ marginBottom: '1.5rem' }}>
                          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#1f2937' }}>{venue.name}</h3>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>
                            Status: <strong style={{
                              color: (venue.status === 'published') ? '#10b981' : '#ef4444',
                              textTransform: 'capitalize'
                            }}>
                              {(venue.status === 'published' ? 'Published' : 'Unpublished')}
                            </strong>
                          </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <button
                            onClick={() => {
                              handleEditVenue(venue)
                              setActionSheetVenueId(null)
                            }}
                            style={{
                              padding: '0.95rem 1.5rem',
                              background: 'linear-gradient(135deg, #2a5298 0%, #3a6db5 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '10px',
                              fontSize: '0.95rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => {
                              setViewingVenueId(venue.id)
                              setActionSheetVenueId(null)
                            }}
                            style={{
                              padding: '0.95rem 1.5rem',
                              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                              color: '#1f2937',
                              border: 'none',
                              borderRadius: '10px',
                              fontSize: '0.95rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            👁️ View
                          </button>
                          <button
                            onClick={() => {
                              handlePublish(venue.id, venue.status || 'draft')
                              setActionSheetVenueId(null)
                            }}
                            style={{
                              padding: '0.95rem 1.5rem',
                              background: venue.status === 'published'
                                ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '10px',
                              fontSize: '0.95rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            {venue.status === 'published' ? '✕ Unpublish' : '✓ Publish'}
                          </button>
                          <button
                            onClick={() => {
                              handleDelete(venue.id)
                              setActionSheetVenueId(null)
                            }}
                            style={{
                              padding: '0.95rem 1.5rem',
                              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '10px',
                              fontSize: '0.95rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            🗑️ Delete
                          </button>
                          <button
                            onClick={() => setActionSheetVenueId(null)}
                            style={{
                              padding: '0.95rem 1.5rem',
                              background: '#e5e7eb',
                              color: '#1f2937',
                              border: 'none',
                              borderRadius: '10px',
                              fontSize: '0.95rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              marginTop: '0.75rem'
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            )}

            {/* View Venue Modal */}
            {viewingVenueId && venues.find(v => v.id === viewingVenueId) && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}>
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '2.5rem',
                  maxWidth: '600px',
                  width: '90%',
                  maxHeight: '80vh',
                  overflow: 'auto',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
                }}>
                  {(() => {
                    const venue = venues.find(v => v.id === viewingVenueId)
                    if (!venue) return null
                    return (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '2rem' }}>
                          <div>
                            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem', fontWeight: 700, color: '#1f2937' }}>{venue.name}</h2>
                            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 700, color: '#1f2937', textTransform: 'uppercase' }}>
                              Status: <strong style={{
                                color: (venue.status === 'published') ? '#10b981' : '#ef4444',
                                textTransform: 'capitalize',
                                fontWeight: 700
                              }}>
                                {(venue.status === 'published' ? 'Published' : 'Unpublished')}
                              </strong>
                            </p>
                          </div>
                          <button
                            onClick={() => setViewingVenueId(null)}
                            style={{
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '32px',
                              height: '32px',
                              fontSize: '1.2rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            ✕
                          </button>
                        </div>

                        {venue.image_url && (
                          <img
                            src={venue.image_url}
                            alt={venue.name}
                            style={{
                              width: '100%',
                              height: '250px',
                              objectFit: 'cover',
                              borderRadius: '10px',
                              marginBottom: '2rem'
                            }}
                          />
                        )}

                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                          <div>
                            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 700, color: '#1f2937', textTransform: 'uppercase' }}>Category</p>
                            <p style={{ margin: 0, fontSize: '1rem', color: '#1f2937' }}>{venue.category}</p>
                          </div>

                          {venue.subcategory_id && (
                            <div>
                              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 700, color: '#1f2937', textTransform: 'uppercase' }}>Subcategory</p>
                              <p style={{ margin: 0, fontSize: '1rem', color: '#1f2937' }}>
                                {categories.find(c => c.subcategories.some(s => s.id === venue.subcategory_id))?.subcategories.find(s => s.id === venue.subcategory_id)?.name || 'N/A'}
                              </p>
                            </div>
                          )}

                          {venue.rating && (
                            <div>
                              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 700, color: '#1f2937', textTransform: 'uppercase' }}>Rating</p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '1.2rem' }}>
                                  {[...Array(5)].map((_, i) => {
                                    const fillPercentage = Math.min(Math.max((venue.rating || 0) - i, 0), 1);
                                    return (
                                      <span key={i} style={{ display: 'inline-block', position: 'relative', width: '1.2em', color: '#FFB800' }}>
                                        <span style={{ position: 'absolute', overflow: 'hidden', width: `${fillPercentage * 100}%`, color: '#FFB800' }}>★</span>
                                        <span style={{ color: '#D1D5DB' }}>★</span>
                                      </span>
                                    );
                                  })}
                                </span>
                                <span style={{ fontSize: '0.95rem', color: '#6b7280', marginLeft: '0.5rem' }}>
                                  {venue.rating.toFixed(1)}
                                </span>
                              </div>
                            </div>
                          )}

                          {venue.address && (
                            <div>
                              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 700, color: '#1f2937', textTransform: 'uppercase' }}>Address</p>
                              <p style={{ margin: 0, fontSize: '1rem', color: '#1f2937' }}>📍 {venue.address}</p>
                            </div>
                          )}

                          {venue.phone_number && (
                            <div>
                              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 700, color: '#1f2937', textTransform: 'uppercase' }}>Phone</p>
                              <a href={`tel:${venue.phone_number}`} style={{ margin: 0, fontSize: '1rem', color: '#2a5298', textDecoration: 'none', fontWeight: 500 }}>
                                📞 {venue.phone_number}
                              </a>
                            </div>
                          )}

                          {venue.website_url && (
                            <div>
                              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 700, color: '#1f2937', textTransform: 'uppercase' }}>Website</p>
                              <a href={venue.website_url} target="_blank" rel="noopener noreferrer" style={{
                                display: 'inline-block',
                                padding: '0.6rem 1.2rem',
                                background: 'linear-gradient(135deg, #2a5298 0%, #3a6db5 100%)',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                fontWeight: 600
                              }}>
                                🔗 View Website
                              </a>
                            </div>
                          )}

                          {venue.reservation_link && (
                            <div>
                              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 700, color: '#1f2937', textTransform: 'uppercase' }}>Reservation</p>
                              <a href={venue.reservation_link} target="_blank" rel="noopener noreferrer" style={{
                                display: 'inline-block',
                                padding: '0.6rem 1.2rem',
                                background: 'linear-gradient(135deg, #2a5298 0%, #3a6db5 100%)',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                fontWeight: 600
                              }}>
                                Reserve Now
                              </a>
                            </div>
                          )}

                          <div>
                            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Location</p>
                            <a
                              href={`https://www.google.com/maps/search/${encodeURIComponent(venue.name)}/@${venue.latitude},${venue.longitude},15z`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-block',
                                padding: '0.6rem 1.2rem',
                                background: 'linear-gradient(135deg, #2a5298 0%, #3a6db5 100%)',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                boxShadow: '0 2px 8px rgba(42, 82, 152, 0.2)',
                                transition: 'all 0.2s',
                                cursor: 'pointer'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)'
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(42, 82, 152, 0.3)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(42, 82, 152, 0.2)'
                              }}
                            >
                              🗺️ View on Maps
                            </a>
                          </div>

                          {venue.created_at && (
                            <div>
                              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 700, color: '#1f2937', textTransform: 'uppercase' }}>Created</p>
                              <p style={{ margin: 0, fontSize: '0.95rem', color: '#6b7280' }}>
                                {new Date(venue.created_at).toLocaleDateString()} {new Date(venue.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                          <button
                            onClick={() => {
                              setViewingVenueId(null)
                              handleEditVenue(venue)
                            }}
                            style={{
                              flex: 1,
                              padding: '0.8rem 1.5rem',
                              background: 'linear-gradient(135deg, #2a5298 0%, #3a6db5 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '0.95rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => setViewingVenueId(null)}
                            style={{
                              flex: 1,
                              padding: '0.8rem 1.5rem',
                              background: '#e5e7eb',
                              color: '#1f2937',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '0.95rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Close
                          </button>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'categories' && (
          <>
            <h2>Categories</h2>

            {/* Header with Stats and Add Button */}
            <div className="venue-stats-header" style={{
              display: 'flex',
              gap: '2rem',
              marginBottom: '3rem',
              alignItems: 'center',
              position: 'relative',
              background: 'linear-gradient(135deg, #2a5298 0%, #3a6db5 100%)',
              padding: '1.5rem 2.5rem',
              borderRadius: '16px',
              color: 'white',
              boxShadow: '0 4px 16px rgba(42, 82, 152, 0.2)',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                📊 Categories Overview
              </h3>

              <div className="venue-stats-button-container" style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginLeft: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, lineHeight: '1' }}>
                    {categories.length}
                  </div>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', opacity: 0.9 }}>
                    Total categories
                  </p>
                </div>

                <button
                  onClick={() => setShowAddCategoryForm(!showAddCategoryForm)}
                  style={{
                    padding: '0.8rem 1.5rem',
                    background: 'white',
                    color: '#2a5298',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }}
                >
                  {showAddCategoryForm ? '✕ Close' : '➕ Add New Category'}
                </button>
              </div>
            </div>

            {/* Add Category Form - Conditional */}
            {showAddCategoryForm && (
              <div style={{
                background: 'white',
                padding: '2.5rem',
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                border: '1px solid #e5e7eb',
                marginBottom: '3rem'
              }}>
                <h3 style={{
                  margin: '0 0 2rem 0',
                  fontSize: '1.3rem',
                  color: '#1f2937',
                  fontWeight: 600
                }}>
                  {editingCategoryId ? 'Edit Category' : 'Create New Category'}
                </h3>

                <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <input
                      type="text"
                      placeholder="Category name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    style={{
                      background: 'linear-gradient(135deg, #2a5298 0%, #3a6db5 100%)',
                      color: 'white',
                      padding: '0.9rem 1.75rem',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(42, 82, 152, 0.25)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 6px 20px rgba(42, 82, 152, 0.35)', e.currentTarget.style.transform = 'translateY(-2px)')}
                    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(42, 82, 152, 0.25)', e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    {editingCategoryId ? 'Update Category' : 'Create Category'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewCategoryName('')
                      setEditingCategoryId(null)
                    }}
                    className="btn-clear"
                    style={{ padding: '0.9rem 1.75rem', fontSize: '0.95rem' }}
                  >
                    Clear
                  </button>
                </form>

                {cmsMessage && <p className={cmsMessage.includes('Error') ? 'error' : 'success'}>{cmsMessage}</p>}
              </div>
            )}

            {/* Categories List Section - Only show when form is closed */}
            {!showAddCategoryForm && (
              <div style={{
                background: 'white',
                padding: '1.5rem 2.5rem',
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                border: '1px solid #e5e7eb',
                width: '100%',
                boxSizing: 'border-box',
                overflow: 'visible'
              }}>
                <h3 style={{
                  margin: '0 0 2rem 0',
                  fontSize: '1.3rem',
                  color: '#1f2937',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <span>📋</span> All Categories
                </h3>

                {categories.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem 0' }}>No categories yet. Create your first category!</p>
                ) : (
                  <div className="venue-list">
                    {categories.map(cat => (
                      <div key={cat.id} className="venue-item">
                        <div className="venue-info">
                          <div>
                            <h3>{cat.name}</h3>
                            <p className="status-badge">{cat.subcategories.length} subcategories</p>
                          </div>
                        </div>
                        <div className="venue-actions">
                          {/* Desktop buttons (hidden on mobile) */}
                          <div style={{ display: 'contents' }} className="venue-actions-desktop">
                            <button
                              onClick={() => handleEditCategory(cat)}
                              className="btn-edit"
                              style={{ marginLeft: 0 }}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="btn-delete"
                            >
                              🗑️ Delete
                            </button>
                          </div>

                          {/* Mobile action button (shown on mobile) */}
                          <button
                            onClick={() => setActionSheetCategoryId(actionSheetCategoryId === cat.id ? null : cat.id)}
                            style={{
                              display: 'none',
                              padding: '0.6rem 1.2rem',
                              background: 'linear-gradient(135deg, #2a5298 0%, #3a6db5 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '0.9rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            className="venue-actions-mobile"
                          >
                            Select
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Mobile Action Sheet for Categories */}
            {actionSheetCategoryId && categories.find(c => c.id === actionSheetCategoryId) && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                zIndex: 1000
              }}>
                <div style={{
                  background: 'white',
                  borderRadius: '16px 16px 0 0',
                  padding: '1.5rem',
                  width: '100%',
                  maxWidth: '100%',
                  boxShadow: '0 -20px 60px rgba(0, 0, 0, 0.3)',
                  animation: 'slideUp 0.3s ease-out'
                }}>
                  {(() => {
                    const category = categories.find(c => c.id === actionSheetCategoryId)
                    if (!category) return null
                    return (
                      <>
                        <div style={{ marginBottom: '1.5rem' }}>
                          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#1f2937' }}>{category.name}</h3>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>{category.subcategories.length} subcategories</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <button
                            onClick={() => {
                              handleEditCategory(category)
                              setActionSheetCategoryId(null)
                            }}
                            style={{
                              padding: '0.95rem 1.5rem',
                              background: 'linear-gradient(135deg, #2a5298 0%, #3a6db5 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '10px',
                              fontSize: '0.95rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => {
                              handleDeleteCategory(category.id)
                              setActionSheetCategoryId(null)
                            }}
                            style={{
                              padding: '0.95rem 1.5rem',
                              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '10px',
                              fontSize: '0.95rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            🗑️ Delete
                          </button>
                          <button
                            onClick={() => setActionSheetCategoryId(null)}
                            style={{
                              padding: '0.95rem 1.5rem',
                              background: '#e5e7eb',
                              color: '#1f2937',
                              border: 'none',
                              borderRadius: '10px',
                              fontSize: '0.95rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              marginTop: '0.75rem'
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'subcategories' && (
          <>
            <h2>Sub Categories</h2>

            {/* Header with Stats and Add Button */}
            <div className="venue-stats-header" style={{
              display: 'flex',
              gap: '2rem',
              marginBottom: '3rem',
              alignItems: 'center',
              position: 'relative',
              background: 'linear-gradient(135deg, #2a5298 0%, #3a6db5 100%)',
              padding: '1.5rem 2.5rem',
              borderRadius: '16px',
              color: 'white',
              boxShadow: '0 4px 16px rgba(42, 82, 152, 0.2)',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                📊 Subcategories Overview
              </h3>

              <div className="venue-stats-button-container" style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginLeft: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, lineHeight: '1' }}>
                    {categories.reduce((total, cat) => total + cat.subcategories.length, 0)}
                  </div>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', opacity: 0.9 }}>
                    Total subcategories
                  </p>
                </div>

                <button
                  onClick={() => setShowAddSubcategoryForm(!showAddSubcategoryForm)}
                  style={{
                    padding: '0.8rem 1.5rem',
                    background: 'white',
                    color: '#2a5298',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }}
                >
                  {showAddSubcategoryForm ? '✕ Close' : '➕ Add New Subcategory'}
                </button>
              </div>
            </div>

            {/* Add Subcategory Form - Conditional */}
            {showAddSubcategoryForm && (
              <div style={{
                background: 'white',
                padding: '2.5rem',
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                border: '1px solid #e5e7eb',
                marginBottom: '3rem'
              }}>
                <h3 style={{
                  margin: '0 0 2rem 0',
                  fontSize: '1.3rem',
                  color: '#1f2937',
                  fontWeight: 600
                }}>
                  {editingSubcategory ? 'Edit Subcategory' : 'Create New Subcategory'}
                </h3>

                <form onSubmit={handleAddSubcategory} style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', alignItems: 'flex-end' }}>
                  {!editingSubcategory && (
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label>Select Category</label>
                      <select
                        value={selectedCategoryForSubcat || ''}
                        onChange={(e) => setSelectedCategoryForSubcat(e.target.value ? parseInt(e.target.value) : null)}
                        required
                      >
                        <option value="">Choose a category...</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label>Subcategory Name</label>
                    <input
                      type="text"
                      placeholder="e.g., Street Food"
                      value={newSubcategoryName}
                      onChange={(e) => setNewSubcategoryName(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    style={{
                      background: 'linear-gradient(135deg, #2a5298 0%, #3a6db5 100%)',
                      color: 'white',
                      padding: '0.9rem 1.75rem',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(42, 82, 152, 0.25)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 6px 20px rgba(42, 82, 152, 0.35)', e.currentTarget.style.transform = 'translateY(-2px)')}
                    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(42, 82, 152, 0.25)', e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    {editingSubcategory ? 'Update Subcategory' : 'Create Subcategory'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewSubcategoryName('')
                      setSelectedCategoryForSubcat(null)
                      setEditingSubcategory(null)
                    }}
                    className="btn-clear"
                    style={{ padding: '0.9rem 1.75rem', fontSize: '0.95rem' }}
                  >
                    Clear
                  </button>
                </form>

                {cmsMessage && <p className={cmsMessage.includes('Error') ? 'error' : 'success'}>{cmsMessage}</p>}
              </div>
            )}

            {/* Subcategories List Section - Only show when form is closed */}
            {!showAddSubcategoryForm && (
              <div style={{
                background: 'white',
                padding: '1.5rem 2.5rem',
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                border: '1px solid #e5e7eb',
                width: '100%',
                boxSizing: 'border-box',
                overflow: 'visible'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '2rem',
                  justifyContent: 'space-between'
                }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '1.3rem',
                    color: '#1f2937',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <span>✨</span> All Subcategories
                  </h3>
                  {/* Desktop Filter Dropdown */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="desktop-filter">
                    <label style={{ fontWeight: 700, color: '#374151', fontSize: '0.9rem' }}>Filter:</label>
                    <select
                      value={subcategoryFilterId || ''}
                      onChange={(e) => {
                        setSubcategoryFilterId(e.target.value ? parseInt(e.target.value) : null)
                        setSubcategoryPage(1)
                      }}
                      style={{
                        padding: '0.6rem 0.9rem',
                        border: '1.5px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        background: 'white',
                        color: '#1f2937',
                        fontWeight: 500,
                        transition: 'all 0.2s'
                      }}
                    >
                      <option value="">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  {/* Mobile Filter Icon Button */}
                  <button
                    onClick={() => setFilterSheetOpen(true)}
                    className="mobile-filter-button"
                    style={{
                      display: 'none',
                      background: 'linear-gradient(135deg, #2a5298 0%, #3a6db5 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.6rem 0.8rem',
                      fontSize: '1.2rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(42, 82, 152, 0.2)',
                      transition: 'all 0.2s'
                    }}
                  >
                    🔽
                  </button>
                </div>

                {(() => {
                  const hasAnySubcategories = categories.filter(cat => cat.subcategories.length > 0).length > 0
                  const filteredSubcats = subcategoryFilterId
                    ? categories.find(cat => cat.id === subcategoryFilterId)?.subcategories || []
                    : categories.flatMap(cat => cat.subcategories)

                  if (!hasAnySubcategories) {
                    return <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem 0' }}>No subcategories yet. Create your first subcategory!</p>
                  }

                  if (filteredSubcats.length === 0 && subcategoryFilterId) {
                    return <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem 0' }}>No subcategories found for this category.</p>
                  }

                  return (
                  <>
                    <div className="venue-list" style={{ paddingTop: '0.5rem' }}>
                      {(() => {
                        // Flatten all subcategories with their category info
                        let allSubcats = categories.flatMap(cat =>
                          cat.subcategories.map(subcat => ({ ...subcat, categoryName: cat.name, categoryId: cat.id }))
                        )

                        // Apply filter if selected
                        if (subcategoryFilterId) {
                          allSubcats = allSubcats.filter(subcat => subcat.categoryId === subcategoryFilterId)
                        }

                        return allSubcats
                          .slice((subcategoryPage - 1) * SUBCATEGORIES_PER_PAGE, subcategoryPage * SUBCATEGORIES_PER_PAGE)
                          .map(subcat => (
                            <div key={subcat.id} className="venue-item">
                              <div className="venue-info">
                                <div>
                                  <h3>{subcat.name}</h3>
                                  <p className="status-badge">In {subcat.categoryName}</p>
                                </div>
                              </div>
                              <div className="venue-actions">
                                <button
                                  onClick={() => handleEditSubcategory(subcat)}
                                  className="btn-edit"
                                  style={{ marginLeft: 0 }}
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteSubcategory(subcat.id)}
                                  className="btn-delete"
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            </div>
                          ))
                      })()}
                    </div>

                    {/* Pagination */}
                    {(() => {
                      let allSubcats = categories.flatMap(cat =>
                        cat.subcategories.map(subcat => ({ ...subcat, categoryName: cat.name, categoryId: cat.id }))
                      )

                      // Apply filter if selected
                      if (subcategoryFilterId) {
                        allSubcats = allSubcats.filter(subcat => subcat.categoryId === subcategoryFilterId)
                      }

                      const totalPages = Math.ceil(allSubcats.length / SUBCATEGORIES_PER_PAGE)
                      if (allSubcats.length <= SUBCATEGORIES_PER_PAGE) return null

                      return (
                        <div style={{
                          marginTop: '2rem',
                          display: 'flex',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          alignItems: 'center'
                        }}>
                          <button
                            onClick={() => setSubcategoryPage(prev => Math.max(1, prev - 1))}
                            disabled={subcategoryPage === 1}
                            style={{
                              padding: '0.6rem 1rem',
                              background: subcategoryPage === 1 ? '#d1d5db' : '#2a5298',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: subcategoryPage === 1 ? 'not-allowed' : 'pointer',
                              fontWeight: 600
                            }}
                          >
                            ← Previous
                          </button>

                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                              key={page}
                              onClick={() => setSubcategoryPage(page)}
                              style={{
                                padding: '0.6rem 0.8rem',
                                background: subcategoryPage === page ? '#2a5298' : '#e5e7eb',
                                color: subcategoryPage === page ? 'white' : '#1f2937',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: subcategoryPage === page ? 600 : 400
                              }}
                            >
                              {page}
                            </button>
                          ))}

                          <button
                            onClick={() => setSubcategoryPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={subcategoryPage === totalPages}
                            style={{
                              padding: '0.6rem 1rem',
                              background: subcategoryPage === totalPages ? '#d1d5db' : '#2a5298',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: subcategoryPage === totalPages ? 'not-allowed' : 'pointer',
                              fontWeight: 600
                            }}
                          >
                            Next →
                          </button>
                        </div>
                      )
                    })()}
                  </>
                  )
                })()}
              </div>
            )}

            {/* Filter Action Sheet */}
            {filterSheetOpen && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                zIndex: 1000
              }}>
                <div style={{
                  background: 'white',
                  borderRadius: '16px 16px 0 0',
                  padding: '1.5rem',
                  width: '100%',
                  maxWidth: '100%',
                  boxShadow: '0 -20px 60px rgba(0, 0, 0, 0.3)',
                  animation: 'slideUp 0.3s ease-out'
                }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#1f2937' }}>Filter Subcategories</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>Select a category to filter by</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button
                      onClick={() => {
                        setSubcategoryFilterId(null)
                        setSubcategoryPage(1)
                        setFilterSheetOpen(false)
                      }}
                      style={{
                        padding: '0.95rem 1.5rem',
                        background: !subcategoryFilterId ? 'linear-gradient(135deg, #2a5298 0%, #3a6db5 100%)' : '#e5e7eb',
                        color: !subcategoryFilterId ? 'white' : '#1f2937',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      📋 All Categories
                    </button>

                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSubcategoryFilterId(cat.id)
                          setSubcategoryPage(1)
                          setFilterSheetOpen(false)
                        }}
                        style={{
                          padding: '0.95rem 1.5rem',
                          background: subcategoryFilterId === cat.id ? 'linear-gradient(135deg, #2a5298 0%, #3a6db5 100%)' : '#e5e7eb',
                          color: subcategoryFilterId === cat.id ? 'white' : '#1f2937',
                          border: 'none',
                          borderRadius: '10px',
                          fontSize: '0.95rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {cat.name}
                      </button>
                    ))}

                    <button
                      onClick={() => setFilterSheetOpen(false)}
                      style={{
                        padding: '0.95rem 1.5rem',
                        background: '#e5e7eb',
                        color: '#1f2937',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        marginTop: '0.75rem'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
