'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

export type CartItem = {
  id: string
  name: string
  price: number
  image?: string
  qty: number
}

type CartContextType = {
  items: CartItem[]
  addToCart: (product: any, qty: number) => void
  removeFromCart: (id: string) => void
  updateQty: (id: string, qty: number) => void
  clearCart: () => void
  isCartOpen: boolean
  setIsCartOpen: (open: boolean) => void
  totalAmount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
export function CartProvider({ children, storeSlug }: { children: ReactNode, storeSlug?: string }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  const cartKey = storeSlug ? `maji_cart_${storeSlug}` : 'maji_cart'

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('maji_cart')
    const saved = localStorage.getItem(cartKey)
    if (saved) {
      try {
        setItems(JSON.parse(saved))
      } catch (e) {}
    }
  }, [])
    setIsLoaded(true)
  }, [cartKey])

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('maji_cart', JSON.stringify(items))
  }, [items])
    if (isLoaded) {
      localStorage.setItem(cartKey, JSON.stringify(items))
    }
  }, [items, isLoaded, cartKey])

  const addToCart = (product: any, qty: number) => {
    setItems(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + qty } : item)
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.product_images?.[0]?.image_url || '',
        qty
      }]
    })
    
    // Show toast
    setToast(`Added ${qty} ${product.name} to cart`)
    setTimeout(() => setToast(null), 3000)
  }

  const removeFromCart = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const updateQty = (id: string, qty: number) => {
    if (qty < 1) return
    setItems(prev => prev.map(item => item.id === id ? { ...item, qty } : item))
  }

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const totalAmount = items.reduce((total, item) => total + (item.price * item.qty), 0)

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQty, clearCart, isCartOpen, setIsCartOpen, totalAmount }}>
      {children}
      
      {/* Global Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg font-medium animate-in slide-in-from-top fade-in duration-300">
          {toast}
        </div>
      )}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

