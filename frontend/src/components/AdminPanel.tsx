import { useState, useEffect } from 'react'
import { Plus, Trash2, Eye, MapPin, Search, X } from 'lucide-react'
import type { Venue, Category } from '../types'

interface AdminPanelProps {
  authToken: string
  categories: Category[]
  onCategoriesUpdated: () => void
}

type AdminTab = 'venues' | 'categories' | 'subcategories'

export default function AdminPanel({ authToken, categories, onCategoriesUpdated }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('venues')
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Venue form states
  const [showVenueForm, setShowVenueForm] = useState(false)
  const [editingVenueId, setEditingVenueId] = useState<number | null>(null)
  const [lookupQuery, setLookupQuery] = useState('')
  const [lookupResults, setLookupResults] = useState<any[]>([])
  const [lookupLoading, setLookupLoading] = useState(false)
  const [manualAddressEnabled, setManualAddressEnabled] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')

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

  // Category form states
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null)

  // Subcategory form states
  const [showSubcategoryForm, setShowSubcategoryForm] = useState(false)
  const [newSubcategoryName, setNewSubcategoryName] = useState('')
  const [selectedCategoryForSubcat, setSelectedCategoryForSubcat] = useState<number | null>(null)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  useEffect(() => {
    if (activeTab === 'venues') {
      fetchAdminVenues()
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

  const selectLookupResult = (result: any) => {
    setFormData(prev => ({
      ...prev,
      name: result.name,
      address: result.address,
      latitude: result.latitude.toString(),
      longitude: result.longitude.toString(),
      website_url: result.website_url || '',
      phone_number: result.phone || ''
    }))
    setLookupResults([])
    setLookupQuery('')
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
    if (!formData.name || !formData.category || !formData.latitude || !formData.longitude) {
      setMessage('Please fill in all required fields')
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
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
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
    setShowVenueForm(false)
    setEditingVenueId(null)
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
      setNewCategoryName('')
      setEditingCategoryId(null)
      setShowCategoryForm(false)
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
      setNewSubcategoryName('')
      setSelectedCategoryForSubcat(null)
      setShowSubcategoryForm(false)
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

  const getSubcategoryName = (subcategoryId?: number) => {
    for (const category of categories) {
      const subcategory = category.subcategories.find(s => s.id === subcategoryId)
      if (subcategory) return subcategory.name
    }
    return null
  }

  const getCategoryById = (slug: string) => categories.find(c => c.slug === slug)

  // Pagination
  const getTotalPagesForCurrentTab = () => {
    let total = 0
    if (activeTab === 'venues') {
      total = venues.length
    } else if (activeTab === 'categories') {
      total = categories.length
    } else {
      total = categories.reduce((sum, c) => sum + c.subcategories.length, 0)
    }
    return Math.ceil(total / ITEMS_PER_PAGE)
  }

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 p-4 md:p-6 bg-gray-50">
      {/* Sidebar */}
      <div className="hidden lg:block w-64 bg-white rounded-lg border border-gray-200 p-4 h-fit sticky top-24">
        <nav className="space-y-2">
          {[
            { id: 'venues', label: 'Venues', icon: MapPin },
            { id: 'categories', label: 'Categories', icon: Plus },
            { id: 'subcategories', label: 'Subcategories', icon: Search }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as AdminTab)
                setCurrentPage(1)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700 font-medium border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Messages */}
        {message && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-4 flex items-center justify-between animate-slide-in">
            <p className="text-sm font-medium text-green-800">{message}</p>
            <button
              onClick={() => setMessage('')}
              className="text-green-600 hover:text-green-700"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Venues Tab */}
        {activeTab === 'venues' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Venues</h2>
              <button
                onClick={() => {
                  setShowVenueForm(!showVenueForm)
                  if (showVenueForm) resetVenueForm()
                }}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={18} />
                <span>Add Venue</span>
              </button>
            </div>

            {/* Venue Form */}
            {showVenueForm && (
              <form onSubmit={handleSaveVenue} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
                {/* Lookup Section */}
                <div className="pb-6 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">Find Venue</h3>
                  <div className="flex gap-2 mb-4">
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
                      className="btn-secondary"
                    >
                      {lookupLoading ? 'Searching...' : 'Search'}
                    </button>
                  </div>

                  {lookupResults.length > 0 && (
                    <div className="space-y-2">
                      {lookupResults.map((result, idx) => (
                        <div
                          key={idx}
                          onClick={() => selectLookupResult(result)}
                          className="p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors"
                        >
                          <p className="font-medium text-gray-900">{result.name}</p>
                          <p className="text-sm text-gray-600">{result.address}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={manualAddressEnabled}
                        onChange={(e) => setManualAddressEnabled(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">Or enter manually</span>
                    </label>
                  </div>
                </div>

                {/* Form Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating (0-5)</label>
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

                  {manualAddressEnabled && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                          className="input-field"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Latitude *</label>
                        <input
                          type="number"
                          name="latitude"
                          step="0.0001"
                          value={formData.latitude}
                          onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                          className="input-field"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Longitude *</label>
                        <input
                          type="number"
                          name="longitude"
                          step="0.0001"
                          value={formData.longitude}
                          onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                          className="input-field"
                          required
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                    <input
                      type="url"
                      name="website_url"
                      value={formData.website_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reservation Link</label>
                    <input
                      type="url"
                      name="reservation_link"
                      value={formData.reservation_link}
                      onChange={(e) => setFormData(prev => ({ ...prev, reservation_link: e.target.value }))}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="input-field"
                    />
                  </div>
                </div>

                {imagePreview && (
                  <div>
                    <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg" />
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button type="submit" disabled={loading} className="btn-primary flex-1">
                    {loading ? 'Saving...' : editingVenueId ? 'Update Venue' : 'Create Venue'}
                  </button>
                  <button
                    type="button"
                    onClick={resetVenueForm}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Venues List */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {loading && !showVenueForm ? (
                <div className="p-8 text-center text-gray-600">Loading venues...</div>
              ) : venues.length === 0 ? (
                <div className="p-8 text-center text-gray-600">No venues yet</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-6 py-3 font-semibold text-gray-900">Name</th>
                          <th className="text-left px-6 py-3 font-semibold text-gray-900">Category</th>
                          <th className="text-left px-6 py-3 font-semibold text-gray-900">Status</th>
                          <th className="text-right px-6 py-3 font-semibold text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {venues.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map(venue => (
                          <tr key={venue.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 font-medium text-gray-900">{venue.name}</td>
                            <td className="px-6 py-4 text-gray-600">{getSubcategoryName(venue.subcategory_id) || venue.category}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                venue.status === 'published'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                {venue.status === 'published' ? 'Published' : 'Draft'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handlePublishVenue(venue.id, venue.status || 'draft')}
                                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                  title={venue.status === 'published' ? 'Unpublish' : 'Publish'}
                                >
                                  <Eye size={16} className={venue.status === 'published' ? 'text-green-600' : 'text-gray-400'} />
                                </button>
                                <button
                                  onClick={() => handleDeleteVenue(venue.id)}
                                  className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {getTotalPagesForCurrentTab() > 1 && (
                    <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-200">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded border border-gray-200 disabled:opacity-50"
                      >
                        Prev
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {currentPage} of {getTotalPagesForCurrentTab()}
                      </span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(getTotalPagesForCurrentTab(), p + 1))}
                        disabled={currentPage === getTotalPagesForCurrentTab()}
                        className="px-3 py-1 rounded border border-gray-200 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
              <button
                onClick={() => setShowCategoryForm(!showCategoryForm)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={18} />
                <span>Add Category</span>
              </button>
            </div>

            {showCategoryForm && (
              <form onSubmit={handleSaveCategory} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
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
                <div className="flex gap-3">
                  <button type="submit" disabled={loading} className="btn-primary flex-1">
                    {loading ? 'Saving...' : 'Create Category'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCategoryForm(false)
                      setNewCategoryName('')
                      setEditingCategoryId(null)
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map(cat => (
                <div key={cat.id} className="card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-bold text-lg text-gray-900">{cat.name}</h3>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
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
              <h2 className="text-2xl font-bold text-gray-900">Subcategories</h2>
              <button
                onClick={() => setShowSubcategoryForm(!showSubcategoryForm)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={18} />
                <span>Add Subcategory</span>
              </button>
            </div>

            {showSubcategoryForm && (
              <form onSubmit={handleSaveSubcategory} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
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
                <div className="flex gap-3">
                  <button type="submit" disabled={loading} className="btn-primary flex-1">
                    {loading ? 'Saving...' : 'Create Subcategory'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSubcategoryForm(false)
                      setNewSubcategoryName('')
                      setSelectedCategoryForSubcat(null)
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3 font-semibold text-gray-900">Name</th>
                      <th className="text-left px-6 py-3 font-semibold text-gray-900">Category</th>
                      <th className="text-right px-6 py-3 font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(() => {
                      const allSubcats = categories.flatMap(c => c.subcategories.map(s => ({ ...s, categoryName: c.name })))
                      return allSubcats.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map(sub => (
                        <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900">{sub.name}</td>
                          <td className="px-6 py-4 text-gray-600">{(sub as any).categoryName}</td>
                          <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteSubcategory(sub.id)}
                            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                      ))
                    })()}
                  </tbody>
                </table>
              </div>

              {getTotalPagesForCurrentTab() > 1 && (
                <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-200">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded border border-gray-200 disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {getTotalPagesForCurrentTab()}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(getTotalPagesForCurrentTab(), p + 1))}
                    disabled={currentPage === getTotalPagesForCurrentTab()}
                    className="px-3 py-1 rounded border border-gray-200 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
