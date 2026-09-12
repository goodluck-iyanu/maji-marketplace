'use client'

import { useCart } from './cart-context'
import { ShoppingBag } from 'lucide-react'
import Link from 'next/link'

export function FloatingCart({ primaryColor, secondaryColor, storeSlug }: { primaryColor: string, secondaryColor: string, storeSlug: string }) {
  const { items } = useCart()

  const totalItems = items.reduce((sum, item) => sum + item.qty, 0)
  
  if (totalItems === 0) return null

  return (
    <Link
      href={`/store/${storeSlug}/cart`}
      style={{ backgroundColor: primaryColor, color: secondaryColor }}
      className="fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-2xl hover:scale-105 transition-transform duration-300 flex items-center justify-center animate-in fade-in zoom-in"
      aria-label="Open Cart"
    >
      <ShoppingBag className="h-6 w-6" />
      <span 
        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center animate-bounce shadow-md"
      >
        {totalItems}
      </span>
    </Link>
  )
}

