import { useState, useEffect } from 'react'
import type { Venue, Category } from '../types'

interface AdminPanelProps {
  onVenueAdded: () => void
  authToken: string
  categories: Category[]
  onCategoriesUpdated: () => void
}

type AdminTab = 'venues' | 'categories' | 'subcategories'

export default function AdminPanel({ onVenueAdded, authToken, categories, onCategoriesUpdated }: AdminPanelProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: categories.length > 0 ? categories[0].slug : 'food',
    subcategory_id: '',
    latitude: '',
    longitude: '',
    address: '',
    image_url: '',
    website_url: '',
    reservation_link: ''
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
  const [editingCategory, setEditingCategory] = useState<number | null>(null)
  const [editingSubcategory, setEditingSubcategory] = useState<number | null>(null)
  const [cmsMessage, setCmsMessage] = useState('')
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false)
  const [showAddSubcategoryForm, setShowAddSubcategoryForm] = useState(false)

  // Lookup states
  const [lookupType, setLookupType] = useState<'search' | 'url'>('search')
  const [lookupQuery, setLookupQuery] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupResults, setLookupResults] = useState<any[]>([])
  const [lookupMessage, setLookupMessage] = useState('')

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
      setLookupMessage(`Please enter a ${lookupType === 'url' ? 'Google Maps URL' : 'restaurant name'}`)
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
        body: JSON.stringify({ type: lookupType, query: lookupQuery })
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

  const selectVenueFromResults = (result: any) => {
    setFormData(prev => ({
      ...prev,
      name: result.name || prev.name,
      address: result.address || prev.address,
      latitude: result.latitude || prev.latitude,
      longitude: result.longitude || prev.longitude,
      website_url: result.website_url || prev.website_url
    }))
    setLookupResults([])
    setLookupQuery('')
    setLookupMessage(`✅ Selected: "${result.name}"`)
    setTimeout(() => setLookupMessage(''), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

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

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/venues`, {
        method: 'POST',
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
          status: 'draft'
        })
      })

      if (!response.ok) throw new Error('Failed to add venue')

      setMessage('Venue added successfully!')
      setImageFile(null)
      setImagePreview('')
      setFormData({
        name: '',
        category: categories.length > 0 ? categories[0].slug : 'food',
        subcategory_id: '',
        latitude: '',
        longitude: '',
        address: '',
        image_url: '',
        website_url: '',
        reservation_link: ''
      })

      setTimeout(() => {
        fetchAdminVenues()
        onVenueAdded()
      }, 1500)
    } catch (error) {
      setMessage('Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'draft' ? 'published' : 'draft'
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/venues/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ status: newStatus })
      })
      if (!response.ok) throw new Error('Failed to update status')
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
      fetchAdminVenues()
    } catch (error) {
      alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ name: newCategoryName })
      })

      if (!response.ok) {
        const error = await response.json()
        setCmsMessage(error.error || 'Failed to add category')
        return
      }

      setCmsMessage('Category added!')
      setNewCategoryName('')
      onCategoriesUpdated()
      setTimeout(() => setCmsMessage(''), 2000)
    } catch (error) {
      setCmsMessage('Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories/${selectedCategoryForSubcat}/subcategories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ name: newSubcategoryName })
      })

      if (!response.ok) {
        const error = await response.json()
        setCmsMessage(error.error || 'Failed to add subcategory')
        return
      }

      setCmsMessage('Subcategory added!')
      setNewSubcategoryName('')
      onCategoriesUpdated()
      setTimeout(() => setCmsMessage(''), 2000)
    } catch (error) {
      setCmsMessage('Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
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
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
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
            <span>Category Management</span>
          </button>
          <button
            className={`admin-nav-item ${activeTab === 'subcategories' ? 'active' : ''}`}
            onClick={() => setActiveTab('subcategories')}
          >
            <span className="nav-icon">✨</span>
            <span>Sub Category Management</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-content">

        {activeTab === 'venues' && (
          <>
            <h2>Venues Management</h2>

            {/* Header with Stats and Add Button */}
            <div style={{
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

              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginLeft: 'auto' }}>
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
                  Create New Venue
                </h3>

          <form onSubmit={handleSubmit}>
            {/* Lookup Section with Radio Buttons */}
            <div className="form-group" style={{ backgroundColor: '#f3f4f6', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid #e5e7eb' }}>
              <label style={{ marginBottom: '1rem', display: 'block' }}>🔍 Auto-fill Venue Information (optional)</label>

              {/* Radio Buttons */}
              <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  <input
                    type="radio"
                    name="lookupType"
                    value="search"
                    checked={lookupType === 'search'}
                    onChange={(e) => {
                      setLookupType('search')
                      setLookupResults([])
                      setLookupMessage('')
                    }}
                  />
                  Search By Name
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  <input
                    type="radio"
                    name="lookupType"
                    value="url"
                    checked={lookupType === 'url'}
                    onChange={(e) => {
                      setLookupType('url')
                      setLookupResults([])
                      setLookupMessage('')
                    }}
                  />
                  Google Maps URL
                </label>
              </div>

              {/* Input and Button */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    placeholder={lookupType === 'search' ? 'e.g., Noma, Copenhagen' : 'https://maps.app.goo.gl/... or https://www.google.com/maps/place/...'}
                    value={lookupQuery}
                    onChange={(e) => setLookupQuery(e.target.value)}
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

            <div className="form-row">
              <div className="form-group">
                <label>Latitude *</label>
                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  step="0.0001"
                  required
                />
              </div>
              <div className="form-group">
                <label>Longitude *</label>
                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  step="0.0001"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Address *</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
              />
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
              <label>Reservation Link</label>
              <input
                type="url"
                name="reservation_link"
                value={formData.reservation_link}
                onChange={handleChange}
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
                {loading ? 'Creating...' : 'Create Venue'}
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
                    reservation_link: ''
                  })
                  setImageFile(null)
                  setImagePreview('')
                  setMessage('')
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
              <div className="venue-list">
                {venues.map(venue => (
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
                        <p className="status-badge">Status: <strong>{venue.status || 'draft'}</strong></p>
                      </div>
                    </div>
                    <div className="venue-actions">
                      <button
                        className="btn-edit"
                        style={{ marginLeft: 0 }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(venue.id)}
                        className="btn-delete"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
              </div>
            )}
          </>
        )}

        {activeTab === 'categories' && (
          <>
            <h2>Category Management</h2>

            {/* Header with Stats and Add Button */}
            <div style={{
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

              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginLeft: 'auto' }}>
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
                  Create New Category
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
                    Create Category
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewCategoryName('')}
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
                          <button
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
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'subcategories' && (
          <>
            <h2>Sub Category Management</h2>

            {/* Header with Stats and Add Button */}
            <div style={{
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

              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginLeft: 'auto' }}>
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
                  Create New Subcategory
                </h3>

                <form onSubmit={handleAddSubcategory} style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', alignItems: 'flex-end' }}>
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
                    Create Subcategory
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewSubcategoryName('')
                      setSelectedCategoryForSubcat(null)
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
                <h3 style={{
                  margin: '0 0 2rem 0',
                  fontSize: '1.3rem',
                  color: '#1f2937',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <span>✨</span> All Subcategories
                </h3>

                {categories.filter(cat => cat.subcategories.length > 0).length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem 0' }}>No subcategories yet. Create your first subcategory!</p>
                ) : (
                  <div className="venue-list">
                    {categories.map(cat =>
                      cat.subcategories.map(subcat => (
                        <div key={subcat.id} className="venue-item">
                          <div className="venue-info">
                            <div>
                              <h3>{subcat.name}</h3>
                              <p className="status-badge">In {cat.name}</p>
                            </div>
                          </div>
                          <div className="venue-actions">
                            <button
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
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
