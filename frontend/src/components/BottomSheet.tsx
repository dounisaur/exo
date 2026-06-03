import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export default function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef(0)
  const currentYRef = useRef(0)

  useEffect(() => {
    if (!isOpen) return

    const handleTouchStart = (e: TouchEvent) => {
      startYRef.current = e.touches[0].clientY
      currentYRef.current = 0
    }

    const handleTouchMove = (e: TouchEvent) => {
      currentYRef.current = e.touches[0].clientY - startYRef.current
      if (sheetRef.current && currentYRef.current > 0) {
        sheetRef.current.style.transform = `translateY(${currentYRef.current}px)`
      }
    }

    const handleTouchEnd = () => {
      if (currentYRef.current > 100) {
        onClose()
      } else if (sheetRef.current) {
        sheetRef.current.style.transform = 'translateY(0)'
      }
    }

    const sheet = sheetRef.current
    if (sheet) {
      sheet.addEventListener('touchstart', handleTouchStart)
      sheet.addEventListener('touchmove', handleTouchMove)
      sheet.addEventListener('touchend', handleTouchEnd)

      return () => {
        sheet.removeEventListener('touchstart', handleTouchStart)
        sheet.removeEventListener('touchmove', handleTouchMove)
        sheet.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 max-h-[90vh] overflow-y-auto"
        style={{ maxHeight: '90vh' }}
      >
        {/* Handle */}
        <div className="flex justify-center py-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-4 pb-8">
          {children}
        </div>
      </div>
    </>
  )
}
