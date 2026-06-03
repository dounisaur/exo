import { Home } from 'lucide-react'

interface BottomTabBarProps {
  currentPage: 'home' | 'login' | 'admin'
  onNavigate: (page: 'home' | 'login' | 'admin') => void
}

export default function BottomTabBar({ currentPage, onNavigate }: BottomTabBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-gray-200 z-40">
      <div className="flex items-center justify-around">
        <button
          onClick={() => onNavigate('home')}
          className={`flex-1 py-4 flex flex-col items-center justify-center gap-1 transition-colors ${
            currentPage === 'home'
              ? 'text-blue-600 border-t-2 border-blue-600'
              : 'text-gray-600 border-t-2 border-transparent'
          }`}
        >
          <Home size={24} />
          <span className="text-xs font-medium">Home</span>
        </button>
      </div>
    </div>
  )
}
