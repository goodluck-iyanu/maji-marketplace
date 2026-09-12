'use client'

import { useState, useRef, useEffect } from 'react'
import { MoreVertical, Edit2, Trash2, EyeOff, Package } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export function ProductActionsDropdown({ productId, isPublished }: { productId: string, isPublished: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this product?')) {
      setIsDeleting(true)
      const { deleteProductAction } = await import('./actions')
      const res = await deleteProductAction(productId)
      if (res?.success) {
        setIsOpen(false)
        router.refresh()
      } else {
        alert(res?.error || 'Failed to delete')
        setIsDeleting(false)
      }
    }
  }

  const handleTogglePublish = async () => {
    setIsToggling(true)
    const { togglePublishProductAction } = await import('./actions')
    const res = await togglePublishProductAction(productId, isPublished)
    if (res?.success) {
      setIsOpen(false)
      router.refresh()
    } else {
      alert(res?.error || 'Failed to update status')
      setIsToggling(false)
    }
  }

  const handleUpdateStock = async () => {
    const qtyStr = prompt('Enter new stock quantity:')
    if (qtyStr === null) return // Cancelled
    
    const qty = parseInt(qtyStr, 10)
    if (isNaN(qty) || qty < 0) {
      alert('Please enter a valid positive number.')
      return
    }

    const { updateStockAction } = await import('./actions')
    const res = await updateStockAction(productId, qty)
    if (res?.success) {
      setIsOpen(false)
      router.refresh()
      alert('Stock updated successfully!')
    } else {
      alert(res?.error || 'Failed to update stock')
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-400 hover:text-gray-900 p-2 rounded-md hover:bg-gray-100"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200 py-1">
          <Link href={`/dashboard/products/${productId}/edit`} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
            <Edit2 className="h-4 w-4 mr-2" /> Edit Product
          </Link>
          <button onClick={handleUpdateStock} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
            <Package className="h-4 w-4 mr-2" /> Update Stock
          </button>
          <button 
            onClick={handleTogglePublish}
            disabled={isToggling}
            className="w-full text-left px-4 py-2 text-sm text-amber-600 hover:bg-gray-100 flex items-center disabled:opacity-50"
          >
            <EyeOff className="h-4 w-4 mr-2" /> {isToggling ? 'Wait...' : (isPublished ? 'Unpublish' : 'Publish')}
          </button>
          <div className="border-t border-gray-100 my-1"></div>
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4 mr-2" /> {isDeleting ? 'Deleting...' : 'Delete Product'}
          </button>
        </div>
      )}
    </div>
  )
}

