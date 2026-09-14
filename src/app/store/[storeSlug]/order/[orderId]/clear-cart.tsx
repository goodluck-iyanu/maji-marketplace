'use client'

import { useEffect, useRef } from 'react'
import { useCart } from '../../cart-context'

export function ClearCartListener({ storeSlug }: { storeSlug: string }) {
  const { clearCart } = useCart()
  const cleared = useRef(false)

  useEffect(() => {
    if (!cleared.current) {
      clearCart()
      localStorage.removeItem('maji_cart')
      localStorage.removeItem(`maji_cart_${storeSlug}`)
      cleared.current = true
    }
  }, [clearCart, storeSlug])

  return null
}
