'use client'

import { useCart } from './cart-context'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export function CartButton({ primaryColor, secondaryColor }: { primaryColor: string, secondaryColor: string }) {
  const { items } = useCart()
  const params = useParams()
  const storeSlug = params.storeSlug as string

  const totalQty = items.reduce((sum, item) => sum + item.qty, 0)

  return (
    <Link
      href={`/store/${storeSlug}/cart`}
      style={{ backgroundColor: primaryColor, color: secondaryColor }}
      className="px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
    >
      Cart ({totalQty})
    </Link>
  )
}
