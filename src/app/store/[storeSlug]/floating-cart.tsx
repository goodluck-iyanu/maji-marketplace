'use client'

import { useCart } from './cart-context'
import { ShoppingBag } from 'lucide-react'
import Link from 'next/link'

export function FloatingCart({ primaryColor, secondaryColor, storeSlug }: { primaryColor?: string, secondaryColor?: string, storeSlug: string }) {
  const { items } = useCart()

  const totalItems = items.reduce((sum, item) => sum + item.qty, 0)
  
  if (totalItems === 0) return null

  return (
    <Link
      href={`/store/${storeSlug}/cart`}
      className="fixed bottom-6 right-6 z-40 p-4 rounded-full bg-[#111111] text-white hover:bg-[#F05A28] shadow-2xl shadow-black/25 hover:scale-105 transition-all duration-300 flex items-center justify-center animate-in fade-in zoom-in ring-2 ring-white"
      aria-label="Open Cart"
    >
      <ShoppingBag className="h-6 w-6" />
      <span 
        className="absolute -top-2 -right-2 min-w-6 h-6 px-1.5 rounded-full bg-[#F05A28] text-white text-xs font-extrabold flex items-center justify-center shadow-md ring-2 ring-white"
      >
        {totalItems}
      </span>
    </Link>
  )
}

