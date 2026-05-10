import { useState } from 'react'

interface MobileNavProps {
  activeTab: 'venues' | 'categories' | 'subcategories'
  onTabChange: (tab: 'venues' | 'categories' | 'subcategories') => void
}

export default function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleTabClick = (tab: 'venues' | 'categories' | 'subcategories') => {
    onTabChange(tab)
    setMobileMenuOpen(false)
  }

  return (
    <>
      {/* Mobile Hamburger Button - shown when menu is closed */}
      {!mobileMenuOpen && (
        <button
          className="admin-hamburger"
          onClick={() => setMobileMenuOpen(true)}
          style={{
            position: 'fixed',
            left: '1.5rem',
            zIndex: 999,
            background: 'linear-gradient(135deg, #2a5298 0%, #3a6db5 100%)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            padding: '0.6rem 0.8rem',
            cursor: 'pointer',
            fontSize: '1.5rem',
            boxShadow: '0 4px 12px rgba(42, 82, 152, 0.2)'
          }}
        >
          ☰
        </button>
      )}

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="admin-menu-overlay"
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 997
          }}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        {mobileMenuOpen && (
          <button
            className="admin-sidebar-close"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'linear-gradient(135deg, #2a5298 0%, #3a6db5 100%)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              padding: '0.6rem 0.8rem',
              cursor: 'pointer',
              fontSize: '1.5rem',
              zIndex: 1000,
              boxShadow: '0 4px 12px rgba(42, 82, 152, 0.2)'
            }}
          >
            ✕
          </button>
        )}
        <nav className="admin-nav">
          <button
            className={`admin-nav-item ${activeTab === 'venues' ? 'active' : ''}`}
            onClick={() => handleTabClick('venues')}
          >
            <span className="nav-icon">📍</span>
            <span>Venues</span>
          </button>
          <button
            className={`admin-nav-item ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => handleTabClick('categories')}
          >
            <span className="nav-icon">🏷️</span>
            <span>Category Management</span>
          </button>
          <button
            className={`admin-nav-item ${activeTab === 'subcategories' ? 'active' : ''}`}
            onClick={() => handleTabClick('subcategories')}
          >
            <span className="nav-icon">✨</span>
            <span>Sub Category Management</span>
          </button>
        </nav>
      </aside>
    </>
  )
}
