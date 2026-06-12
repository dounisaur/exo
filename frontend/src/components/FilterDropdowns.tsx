import { ChevronDown } from 'lucide-react'
import type { Category } from '../types'

interface FilterDropdownsProps {
  categories: Category[]
  selectedCategory: string
  selectedRadius: { min: number | null; max: number | null }
  selectedCity: string
  cities: string[]
  onCategoryChange: (categorySlug: string) => void
  onRadiusChange: (radius: { min: number | null; max: number | null }) => void
  onCityChange: (city: string) => void
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

export default function FilterDropdowns({
  categories,
  selectedCategory,
  selectedRadius,
  selectedCity,
  cities,
  onCategoryChange,
  onRadiusChange,
  onCityChange
}: FilterDropdownsProps) {
  return (
    <div className="bg-white border-b border-gray-200 p-4 sticky top-16 z-10 space-y-3">
      {/* City Dropdown */}
      {cities.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">City</label>
          <div className="relative">
            <select
              value={selectedCity}
              onChange={(e) => onCityChange(e.target.value)}
              className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer"
            >
              <option value="">All Cities</option>
              {cities.map(city => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500"
            />
          </div>
        </div>
      )}
      {/* Category Dropdown */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Venue Type</label>
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500"
          />
        </div>
      </div>

      {/* Radius Dropdown */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Search Radius</label>
        <div className="relative">
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
            className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent cursor-pointer"
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
          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500"
          />
        </div>
      </div>
    </div>
  )
}
