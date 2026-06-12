import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { Category } from '../types'

interface FilterBarProps {
  categories: Category[]
  selectedCategory: string
  selectedRadius: { min: number; max: number }
  selectedCity: string
  cities: string[]
  onCategoryChange: (categorySlug: string) => void
  onRadiusChange: (radius: { min: number; max: number }) => void
  onCityChange: (city: string) => void
}

const RADIUS_OPTIONS = [
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
  onCityChange
}: FilterBarProps) {
  const [filtersVisible, setFiltersVisible] = useState(false)

  return (
    <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
      {/* Mobile Filter Toggle Button - only visible on mobile */}
      <div className="md:hidden p-4 flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">Filters</span>
        <button
          onClick={() => setFiltersVisible(!filtersVisible)}
          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          {filtersVisible ? (
            <>
              <span className="text-sm font-medium">Hide</span>
              <ChevronUp size={18} />
            </>
          ) : (
            <>
              <span className="text-sm font-medium">Show</span>
              <ChevronDown size={18} />
            </>
          )}
        </button>
      </div>

      {/* Filters Container - hidden on mobile by default, visible on desktop */}
      <div className={`${filtersVisible ? 'block' : 'hidden'} md:block p-4 space-y-3`}>
      {/* City Filters */}
      {cities.length > 0 && (
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">City:</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onCityChange('')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedCity === ''
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {cities.map(city => (
              <button
                key={city}
                onClick={() => onCityChange(city)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedCity === city
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onCategoryChange('')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === ''
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.slug)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat.slug
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Radius Filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Radius:</label>
        <div className="flex flex-wrap gap-2">
          {RADIUS_OPTIONS.map(option => (
            <button
              key={`${option.min}-${option.max}`}
              onClick={() => onRadiusChange({ min: option.min, max: option.max })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedRadius.min === option.min && selectedRadius.max === option.max
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      </div>
    </div>
  )
}
