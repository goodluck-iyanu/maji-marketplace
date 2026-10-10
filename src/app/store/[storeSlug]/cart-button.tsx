'use client'

import { useCart } from './cart-context'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ShoppingBag } from 'lucide-react'

export function CartButton({ primaryColor, secondaryColor }: { primaryColor?: string, secondaryColor?: string }) {
  const { items } = useCart()
  const params = useParams()
  const storeSlug = params.storeSlug as string

  const totalQty = items.reduce((sum, item) => sum + item.qty, 0)

  return (
    <Link
      href={`/store/${storeSlug}/cart`}
      className="px-4 py-2 rounded-full bg-[#111111] text-white text-sm font-bold flex items-center gap-2 hover:bg-[#F05A28] transition-all shadow-sm"
    >
      <ShoppingBag className="h-4 w-4 text-[#F05A28] group-hover:text-white" />
      <span>Cart</span>
      <span className="inline-flex items-center justify-center min-w-[1.35rem] h-5 px-1.5 rounded-full bg-[#F05A28] text-white text-xs font-extrabold">
        {totalQty}
      </span>
    </Link>
  )
}
