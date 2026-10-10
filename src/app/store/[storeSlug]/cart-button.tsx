'use client'

import { useCart } from './cart-context'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ShoppingCart } from 'lucide-react'

export function CartButton({ primaryColor, secondaryColor }: { primaryColor?: string, secondaryColor?: string }) {
  const { items } = useCart()
  const params = useParams()
  const storeSlug = params.storeSlug as string

  const totalQty = items.reduce((sum, item) => sum + item.qty, 0)

  return (
    <Link
      href={`/store/${storeSlug}/cart`}
      className="px-4 py-2 rounded-full bg-[#F05A28] hover:bg-[#d94d1e] active:scale-[0.98] text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all shadow-sm shadow-[#F05A28]/25"
    >
      <ShoppingCart className="h-4 w-4 text-white shrink-0" />
      <span>Cart</span>
      <span className="inline-flex items-center justify-center min-w-[1.35rem] h-5 px-1.5 rounded-full bg-white text-[#F05A28] text-xs font-black">
        {totalQty}
      </span>
    </Link>
  )
}
