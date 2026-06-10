import type { Category } from '../types'

interface FilterBarProps {
  categories: Category[]
  selectedCategory: string
  selectedRadius: number
  onCategoryChange: (categorySlug: string) => void
  onRadiusChange: (radiusKm: number) => void
}

const RADIUS_OPTIONS = [
  { label: '0 - 1 km', value: 1 },
  { label: '1 - 5 km', value: 5 },
  { label: '5 - 10 km', value: 10 },
  { label: '10 - 20 km', value: 20 },
  { label: '20 - 50 km', value: 50 },
  { label: '50 - 100 km', value: 100 }
]

export default function FilterBar({
  categories,
  selectedCategory,
  selectedRadius,
  onCategoryChange,
  onRadiusChange
}: FilterBarProps) {
  return (
    <div className="bg-white border-b border-gray-200 p-4 sticky top-16 z-10 space-y-3">
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
              key={option.value}
              onClick={() => onRadiusChange(option.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedRadius === option.value
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
  )
}
