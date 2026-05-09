import { useState } from 'react'

interface AdminPanelProps {
  onVenueAdded: () => void
}

export default function AdminPanel({ onVenueAdded }: AdminPanelProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'food',
    latitude: '',
    longitude: '',
    address: '',
    image_url: '',
    website_url: '',
    reservation_link: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelect>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/venues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude)
        })
      })

      if (!response.ok) throw new Error('Failed to add venue')

      setMessage('Venue added successfully!')
      setFormData({
        name: '',
        category: 'food',
        latitude: '',
        longitude: '',
        address: '',
        image_url: '',
        website_url: '',
        reservation_link: ''
      })

      setTimeout(() => onVenueAdded(), 1500)
    } catch (error) {
      setMessage('Error adding venue: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-panel">
      <h2>Add New Venue</h2>

      <form onSubmit={handleSubmit}>
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
            <option value="food">Food</option>
            <option value="bar">Bar</option>
            <option value="concert">Concert</option>
            <option value="cafe">Cafe</option>
          </select>
        </div>

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
          <label>Image URL</label>
          <input
            type="url"
            name="image_url"
            value={formData.image_url}
            onChange={handleChange}
          />
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

        <button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Venue'}
        </button>
      </form>

      {message && <p className={message.includes('Error') ? 'error' : 'success'}>{message}</p>}
    </div>
  )
}
