import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { Category } from '../types'

interface FilterBarProps {
  categories: Category[]
  selectedCategory: string
  selectedRadius: { min: number | null; max: number | null }
  selectedCity: string
  cities: string[]
  onCategoryChange: (categorySlug: string) => void
  onRadiusChange: (radius: { min: number | null; max: number | null }) => void
  onCityChange: (city: string) => void
  showDropdownsDirectly?: boolean
}

const RADIUS_OPTIONS = [
  { label: 'None', min: null, max: null },
  { label: '0 - 1 km', min: 0, max: 1 },
  { label: '1 - 5 km', min: 1, max: 5 },
  { label: '5 - 10 km', min: 5, max: 10 },
  { label: '10 - 20 km', min: 10, max: 20 },
  { label: '20 - 50 km', min: 20, max: 50 },
  { label: '50 - 100 km', min: 50, max: 100 }
]

export default function FilterBar({
  categories,
  selectedCategory,
  selectedRadius,
  selectedCity,
  cities,
  onCategoryChange,
  onRadiusChange,
  onCityChange,
  showDropdownsDirectly = false
}: FilterBarProps) {
  const [filtersVisible, setFiltersVisible] = useState(false)

  return (
    <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
      {/* Filter Toggle Button - only show when not showDropdownsDirectly */}
      {!showDropdownsDirectly && (
        <div className="px-4 py-2.5">
          <button
            onClick={() => setFiltersVisible(!filtersVisible)}
            className="w-full px-4 py-2.5 text-white font-medium rounded-lg flex items-center justify-between gap-2 transition-colors hover:opacity-90"
            style={{ backgroundColor: '#6f8f6a' }}
          >
            <span>Filters</span>
            {filtersVisible ? (
              <ChevronUp size={20} />
            ) : (
              <ChevronDown size={20} />
            )}
          </button>
        </div>
      )}

      {/* Filters Container - show based on visibility or if showDropdownsDirectly */}
      <div className={`${showDropdownsDirectly || filtersVisible ? 'block' : 'hidden'} px-4 py-4`}>
        <div className="rounded-lg p-4 space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {/* Dropdowns for all devices */}
          <div className="space-y-3">
            {/* City Dropdown */}
            {cities.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ink)' }}>City</label>
                <select
                  value={selectedCity}
                  onChange={(e) => onCityChange(e.target.value)}
                  className="w-full appearance-none rounded-lg px-3 py-2 text-sm focus:outline-none cursor-pointer"
                  style={{ background: 'var(--canvas)', border: '1px solid var(--border)', color: 'var(--ink)' }}
                >
                  <option value="">All Cities</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Venue Dropdown */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ink)' }}>Venue</label>
              <select
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="w-full appearance-none rounded-lg px-3 py-2 text-sm focus:outline-none cursor-pointer"
                style={{ background: 'var(--canvas)', border: '1px solid var(--border)', color: 'var(--ink)' }}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Radius Dropdown */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ink)' }}>Radius</label>
              <select
                value={selectedRadius.min === null ? 'null-null' : `${selectedRadius.min}-${selectedRadius.max}`}
                onChange={(e) => {
                  if (e.target.value === 'null-null') {
                    onRadiusChange({ min: null, max: null })
                  } else {
                    const [min, max] = e.target.value.split('-').map(Number)
                    onRadiusChange({ min, max })
                  }
                }}
                className="w-full appearance-none rounded-lg px-3 py-2 text-sm focus:outline-none cursor-pointer"
                style={{ background: 'var(--canvas)', border: '1px solid var(--border)', color: 'var(--ink)' }}
              >
                {RADIUS_OPTIONS.map(option => (
                  <option
                    key={`${option.min}-${option.max}`}
                    value={option.min === null ? 'null-null' : `${option.min}-${option.max}`}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
