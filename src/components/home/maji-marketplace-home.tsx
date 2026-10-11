'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  Flame,
  MapPin,
  Menu,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Store,
  Truck,
  X,
  Zap,
} from 'lucide-react'
import {
  MajiLogo,
  MajiSpinner,
  MajiStorefrontBadge,
} from '@/components/brand/maji-brand'

export interface MarketplaceStoreItem {
  id: string
  name: string
  slug: string
  store_category: string | null
  product_type: 'physical' | 'digital' | string | null
  logo_url: string | null
  banner_url: string | null
  about_text: string | null
  address: string | null
  productCount: number
  previewImages: string[]
}

export interface MarketplaceProductItem {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  discount_percent: number | null
  stock: number | null
  is_digital: boolean
  sub_category: string | null
  brand: string | null
  condition: string | null
  has_variants: boolean
  image_url: string | null
  store: {
    id: string
    name: string
    slug: string
    store_category: string | null
    product_type: string | null
    logo_url: string | null
  }
}

interface MajiMarketplaceHomeProps {
  stores: MarketplaceStoreItem[]
  products: MarketplaceProductItem[]
  isAuthenticated: boolean
}

const EDITORIAL_CATEGORIES = [
  {
    key: 'fashion',
    title: 'Fashion & Apparel',
    subtitle: 'Ready-to-wear clothing, kaftans, streetwear & tailored pieces',
    image:
      'https://images.unsplash.com/photo-1787779350771-a4253704dcad?auto=format&fit=crop&w=900&q=80',
    credit: 'Photo by Ben Iwara in Lagos, Nigeria (Unsplash License)',
    matchTerms: ['fashion', 'clothing', 'apparel', 'shirt', 'dress', 'wear'],
  },
  {
    key: 'electronics',
    title: 'Electronics & Gadgets',
    subtitle: 'E-readers, mobile devices, audio gear & everyday tech',
    image:
      'https://images.unsplash.com/photo-1761370980969-a803951cf104?auto=format&fit=crop&w=800&q=80',
    credit: 'Photo by Muhammad-Taha Ibrahim in Abuja, Nigeria (Unsplash License)',
    matchTerms: ['electronics', 'gadgets', 'e-readers', 'phone', 'tech', 'computer'],
  },
  {
    key: 'jewelry',
    title: 'Jewelry & Eyewear',
    subtitle: 'Statement jewelry, watches, eyewear & personal accessories',
    image:
      'https://images.unsplash.com/photo-1765146487752-cd00fe1aaf50?auto=format&fit=crop&w=800&q=80',
    credit: 'Photo by Ben Iwara in Lagos, Nigeria (Unsplash License)',
    matchTerms: ['jewelry', 'accessories', 'watch', 'eyewear', 'beauty'],
  },
  {
    key: 'footwear',
    title: 'Footwear & Bags',
    subtitle: 'Sneakers, leather shoes, handcrafted purses & travel bags',
    image:
      'https://images.unsplash.com/photo-1745572587597-dcf157492c48?auto=format&fit=crop&w=800&q=80',
    credit: 'Photo by Theresa Ude in Abuja, Nigeria (Unsplash License)',
    matchTerms: ['shoes', 'footwear', 'bag', 'bags', 'sneakers'],
  },
]

function formatNaira(amount: number): string {
  return `₦${Math.round(Number(amount) || 0).toLocaleString('en-NG')}`
}

export function MajiMarketplaceHome({
  stores,
  products,
  isAuthenticated,
}: MajiMarketplaceHomeProps) {
  const router = useRouter()

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [onlyDeals, setOnlyDeals] = useState(false)
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Order tracking bar state
  const [trackRefInput, setTrackRefInput] = useState('')
  const [trackError, setTrackError] = useState<string | null>(null)
  const [isTrackingLoading, setIsTrackingLoading] = useState(false)

  // Interactive Hero Storefront Preview & Claim Link state
  const [heroStoreSlug, setHeroStoreSlug] = useState<string>(
    () => stores.find((s) => s.productCount > 0)?.slug || stores[0]?.slug || ''
  )
  const [claimStoreHandle, setClaimStoreHandle] = useState('')

  // Derived real category pills from actual products & stores
  const availableCategories = useMemo(() => {
    const map = new Map<string, { label: string; count: number }>()
    products.forEach((p) => {
      const raw = (p.sub_category || p.store.store_category || '').trim()
      if (!raw) return
      const key = raw.toLowerCase()
      const existing = map.get(key)
      if (existing) {
        existing.count += 1
      } else {
        map.set(key, {
          label: raw.charAt(0).toUpperCase() + raw.slice(1),
          count: 1,
        })
      }
    })
    return Array.from(map.entries()).map(([key, val]) => ({
      key,
      label: val.label,
      count: val.count,
    }))
  }, [products])

  // Real discounted items count (only show deal filters/badges when real data has discounts)
  const discountedProductsCount = useMemo(
    () => products.filter((p) => Number(p.discount_percent) > 0).length,
    [products]
  )

  // Active store shown in the interactive Hero Storefront Showcase
  const activeHeroStore = useMemo(() => {
    if (!stores.length) return null
    return (
      stores.find((s) => s.slug === heroStoreSlug) ||
      stores.find((s) => s.productCount > 0) ||
      stores[0]
    )
  }, [stores, heroStoreSlug])

  // Real products displayed inside the Hero Storefront Showcase (prioritizing the selected store's products, falling back to live catalog items)
  const activeHeroProducts = useMemo(() => {
    if (!products.length) return []
    if (activeHeroStore) {
      const storeMatches = products.filter((p) => p.store.slug === activeHeroStore.slug)
      if (storeMatches.length >= 2) return storeMatches.slice(0, 2)
      if (storeMatches.length === 1) {
        const extra = products.find((p) => p.id !== storeMatches[0].id && Boolean(p.image_url))
        return extra ? [storeMatches[0], extra] : storeMatches
      }
    }
    const withImages = products.filter((p) => Boolean(p.image_url))
    return (withImages.length >= 2 ? withImages : products).slice(0, 2)
  }, [products, activeHeroStore])

  // Filtered & sorted products
  const filteredProducts = useMemo(() => {
    let list = [...products]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.sub_category && p.sub_category.toLowerCase().includes(q)) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          p.store.name.toLowerCase().includes(q) ||
          (p.store.store_category && p.store.store_category.toLowerCase().includes(q))
      )
    }

    if (selectedCategory !== 'all') {
      const catKey = selectedCategory.toLowerCase()
      const editorialMatch = EDITORIAL_CATEGORIES.find((c) => c.key === catKey)
      list = list.filter((p) => {
        const sub = (p.sub_category || '').toLowerCase()
        const storeCat = (p.store.store_category || '').toLowerCase()
        if (sub === catKey || storeCat === catKey) return true
        if (editorialMatch) {
          return editorialMatch.matchTerms.some(
            (term) => sub.includes(term) || storeCat.includes(term)
          )
        }
        return false
      })
    }

    if (onlyDeals) {
      list = list.filter((p) => Number(p.discount_percent) > 0)
    }

    if (sortBy === 'price-asc') {
      list.sort((a, b) => {
        const pa = a.discount_percent ? a.price * (1 - a.discount_percent / 100) : a.price
        const pb = b.discount_percent ? b.price * (1 - b.discount_percent / 100) : b.price
        return pa - pb
      })
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => {
        const pa = a.discount_percent ? a.price * (1 - a.discount_percent / 100) : a.price
        const pb = b.discount_percent ? b.price * (1 - b.discount_percent / 100) : b.price
        return pb - pa
      })
    }

    return list
  }, [products, searchQuery, selectedCategory, onlyDeals, sortBy])

  // Filtered stores when user types in search bar
  const filteredStores = useMemo(() => {
    if (!searchQuery.trim()) return stores
    const q = searchQuery.toLowerCase().trim()
    return stores.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.store_category && s.store_category.toLowerCase().includes(q)) ||
        (s.address && s.address.toLowerCase().includes(q))
    )
  }, [stores, searchQuery])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const el = document.getElementById('catalog')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleCategorySelect = (catKey: string) => {
    setSelectedCategory(catKey)
    const el = document.getElementById('catalog')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault()
    setTrackError(null)
    const ref = trackRefInput.trim().toUpperCase()
    if (!ref) {
      setTrackError('Enter your order reference (e.g. ORD-...)')
      return
    }
    if (!ref.startsWith('ORD-')) {
      setTrackError('Order references start with ORD-')
      return
    }
    setIsTrackingLoading(true)
    router.push(`/track/${encodeURIComponent(ref)}`)
  }

  const handleClaimStorefrontSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(isAuthenticated ? '/dashboard' : '/login?mode=signup')
  }

  const sanitizedClaimPreview = claimStoreHandle
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#111111] flex flex-col selection:bg-[#F05A28]/15">
      {/* 1. Top Deep Obsidian Marketplace Utility & Live Order Tracker Strip */}
      <div className="bg-[#111111] text-white border-b border-white/10 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar whitespace-nowrap">
            <span className="inline-flex items-center gap-1.5 font-bold text-[#FF8559]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#F05A28] shrink-0" />
              <span>Paystack Secured Checkout</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-neutral-300 font-medium">
              <Truck className="w-3.5 h-3.5 text-[#F05A28] shrink-0" />
              <span>Live Lagos Delivery Quotes &amp; Seller Pickup</span>
            </span>
            <span className="hidden lg:inline-flex items-center gap-1.5 text-neutral-300 font-medium">
              <Store className="w-3.5 h-3.5 text-[#F05A28] shrink-0" />
              <span className="tabular-nums">
                {stores.length} Active Nigerian {stores.length === 1 ? 'Storefront' : 'Storefronts'}
              </span>
            </span>
          </div>

          {/* Real Order Reference Lookup (/track/[reference]) */}
          <form onSubmit={handleTrackOrder} className="hidden md:flex items-center gap-1.5">
            <label htmlFor="top-order-track" className="text-[11px] font-semibold text-neutral-400 mr-1">
              Track Order:
            </label>
            <input
              id="top-order-track"
              type="text"
              value={trackRefInput}
              onChange={(e) => {
                setTrackRefInput(e.target.value)
                if (trackError) setTrackError(null)
              }}
              placeholder="ORD-..."
              className="w-36 px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-white placeholder:text-neutral-500 text-xs font-mono focus:outline-none focus:border-[#F05A28]"
            />
            <button
              type="submit"
              disabled={isTrackingLoading}
              className="px-2.5 py-1 rounded-lg bg-[#F05A28] hover:bg-[#d94d1e] text-white font-extrabold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
            >
              {isTrackingLoading ? <MajiSpinner size={12} color="white" /> : 'Track'}
            </button>
            {trackError && (
              <span className="text-[11px] text-[#FF8559] font-medium ml-1">{trackError}</span>
            )}
          </form>
        </div>
      </div>

      {/* 2. Sticky Marketplace Header & Search Experience */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#111111]/[0.08] shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-18 flex items-center justify-between gap-3 sm:gap-6">
            {/* Official Maji Horizontal Brand Lockup */}
            <Link href="/" className="flex items-center gap-2 shrink-0 group" aria-label="Maji Marketplace Home">
              <MajiLogo
                variant="horizontal"
                colorway="ember-duotone-light"
                size={36}
                className="transition-transform duration-200 group-hover:scale-[1.02]"
              />
            </Link>

            {/* Integrated Marketplace Search Bar (Desktop & Tablet) */}
            <form
              onSubmit={handleSearchSubmit}
              className="hidden md:flex flex-1 max-w-xl items-center bg-[#FAF8F5] border-2 border-[#111111]/12 focus-within:border-[#F05A28] focus-within:bg-white rounded-2xl overflow-hidden transition-all"
              role="search"
            >
              <select
                aria-label="Filter by category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent pl-3.5 pr-2 py-2.5 text-xs font-bold text-[#111111] border-r border-[#111111]/10 focus:outline-none cursor-pointer max-w-[130px] truncate"
              >
                <option value="all">All Categories</option>
                {availableCategories.map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {cat.label} ({cat.count})
                  </option>
                ))}
              </select>

              <div className="relative flex-1 flex items-center">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
                <input
                  type="search"
                  aria-label="Search products, brands, or Nigerian stores"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, stores, clothing, gadgets..."
                  className="w-full pl-9 pr-8 py-2.5 bg-transparent text-sm text-[#111111] placeholder:text-neutral-400 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search query"
                    className="absolute right-2 p-1 text-neutral-400 hover:text-[#111111]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-[#F05A28] hover:bg-[#d94d1e] text-white font-extrabold text-xs sm:text-sm transition-colors shrink-0 cursor-pointer"
              >
                Search
              </button>
            </form>

            {/* Quick Navigation & Seller Actions */}
            <div className="hidden lg:flex items-center gap-5 text-sm font-bold text-neutral-700 shrink-0">
              <a href="#catalog" className="hover:text-[#F05A28] transition-colors">
                Shop
              </a>
              <a href="#stores" className="hover:text-[#F05A28] transition-colors">
                Stores
              </a>
              <a href="#categories" className="hover:text-[#F05A28] transition-colors">
                Categories
              </a>
              <a href="#sell-on-maji" className="hover:text-[#F05A28] transition-colors">
                Sell on Maji
              </a>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-[#F05A28] hover:bg-[#d94d1e] text-white text-xs sm:text-sm font-extrabold shadow-sm shadow-[#F05A28]/25 transition-all"
                >
                  <Store className="w-4 h-4" />
                  <span>Open Storefront</span>
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="hidden sm:inline-flex px-3.5 py-2 rounded-xl text-sm font-bold text-[#111111] hover:bg-[#111111]/[0.05] transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/login?mode=signup"
                    className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl bg-[#F05A28] hover:bg-[#d94d1e] text-white text-xs sm:text-sm font-extrabold shadow-sm shadow-[#F05A28]/25 transition-all"
                  >
                    <Store className="w-4 h-4" />
                    <span>Open Storefront</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </>
              )}

              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                className="md:hidden p-2 rounded-xl border border-[#111111]/10 text-[#111111] hover:bg-[#FAF8F5]"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar (Always visible on mobile for immediate shopping) */}
          <form onSubmit={handleSearchSubmit} className="md:hidden pb-3" role="search">
            <div className="flex items-center bg-[#FAF8F5] border border-[#111111]/15 focus-within:border-[#F05A28] rounded-xl overflow-hidden">
              <Search className="w-4 h-4 text-neutral-400 ml-3 shrink-0" />
              <input
                type="search"
                aria-label="Search products or stores"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, stores, or categories..."
                className="w-full px-2.5 py-2 bg-transparent text-sm text-[#111111] placeholder:text-neutral-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="p-1.5 text-neutral-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-2 bg-[#F05A28] text-white text-xs font-extrabold shrink-0"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-[#111111]/10 px-4 py-4 space-y-4">
            <nav className="grid grid-cols-2 gap-2 text-sm font-bold">
              <a
                href="#catalog"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-xl bg-[#FAF8F5] text-[#111111] flex items-center justify-between"
              >
                <span>Shop Catalog</span>
                <ArrowRight className="w-4 h-4 text-[#F05A28]" />
              </a>
              <a
                href="#stores"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-xl bg-[#FAF8F5] text-[#111111] flex items-center justify-between"
              >
                <span>Verified Stores</span>
                <ArrowRight className="w-4 h-4 text-[#F05A28]" />
              </a>
              <a
                href="#categories"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-xl bg-[#FAF8F5] text-[#111111] flex items-center justify-between"
              >
                <span>Categories</span>
                <ArrowRight className="w-4 h-4 text-[#F05A28]" />
              </a>
              <a
                href="#sell-on-maji"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-xl bg-[#FAF8F5] text-[#111111] flex items-center justify-between"
              >
                <span>Sell on Maji</span>
                <ArrowRight className="w-4 h-4 text-[#F05A28]" />
              </a>
            </nav>

            <form onSubmit={handleTrackOrder} className="pt-3 border-t border-neutral-100">
              <label htmlFor="mobile-order-track" className="block text-xs font-bold text-neutral-600 mb-1.5">
                Track Existing Order Reference
              </label>
              <div className="flex gap-2">
                <input
                  id="mobile-order-track"
                  type="text"
                  value={trackRefInput}
                  onChange={(e) => setTrackRefInput(e.target.value)}
                  placeholder="Enter ORD-..."
                  className="flex-1 px-3 py-2 rounded-xl bg-[#FAF8F5] border border-neutral-200 text-xs font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#111111] text-white text-xs font-extrabold"
                >
                  Track
                </button>
              </div>
              {trackError && <p className="text-xs text-[#F05A28] mt-1 font-semibold">{trackError}</p>}
            </form>

            {!isAuthenticated && (
              <div className="pt-2 flex gap-2">
                <Link
                  href="/login"
                  className="flex-1 py-2.5 text-center rounded-xl border border-[#111111]/15 font-bold text-sm text-[#111111]"
                >
                  Sign In
                </Link>
                <Link
                  href="/login?mode=signup"
                  className="flex-1 py-2.5 text-center rounded-xl bg-[#F05A28] font-extrabold text-sm text-white"
                >
                  Open Storefront
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* 3. Flagship Storefront-First & Nigerian Marketplace Hero Section */}
        <section className="relative overflow-hidden pt-7 pb-14 sm:pt-12 sm:pb-20 border-b border-[#111111]/[0.08]">
          {/* Subtle Warm Editorial Background Glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-36 right-1/4 w-[540px] h-[540px] rounded-full bg-[#F05A28]/[0.06] blur-3xl"
          />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
              {/* Left Column: Storefront-First Hero Pitch + URL Claim Bar + Marketplace Shopping Access */}
              <div className="lg:col-span-6 space-y-5 sm:space-y-6">
                {/* Top Identity & Dual-Role Badge */}
                <div className="inline-flex flex-wrap items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#111111]/12 shadow-2xs">
                  <MajiLogo variant="symbol" colorway="ember-orange" size={18} animation="bounce" />
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.11em] text-[#111111]">
                    Nigeria&apos;s Storefront Builder &amp; Marketplace
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#F05A28]/10 text-[#F05A28] text-[10px] font-extrabold">
                    Physical &amp; Digital
                  </span>
                </div>

                {/* Primary Storefront-First Headline */}
                <div className="space-y-3">
                  <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight text-[#111111] leading-[1.03]">
                    Launch your{' '}
                    <span className="text-[#F05A28]">Nigerian storefront.</span>{' '}
                    Sell everywhere.
                  </h1>

                  <p className="text-base sm:text-lg text-neutral-700 leading-relaxed max-w-xl">
                    Open a custom online storefront for your physical or digital products in minutes — with automated{' '}
                    <strong className="font-extrabold text-[#111111]">Paystack T+1 bank payouts</strong>, live{' '}
                    <strong className="font-extrabold text-[#111111]">courier delivery quotes</strong>, and{' '}
                    <strong className="font-extrabold text-[#111111]">Hoberg AI</strong>. Or{' '}
                    <a
                      href="#catalog"
                      className="font-extrabold text-[#F05A28] underline decoration-[#F05A28]/40 underline-offset-4 hover:decoration-[#F05A28]"
                    >
                      buy directly from independent Nigerian stores
                    </a>{' '}
                    below.
                  </p>
                </div>

                {/* Interactive "Claim Your Storefront Link" Builder Bar */}
                <form
                  onSubmit={handleClaimStorefrontSubmit}
                  className="p-2 rounded-2xl bg-white border-2 border-[#111111]/12 focus-within:border-[#F05A28] shadow-md transition-all"
                >
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex items-center flex-1 px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#111111]/[0.07] min-w-0">
                      <Store className="w-4 h-4 text-[#F05A28] shrink-0 mr-2" />
                      <span className="text-xs font-mono font-bold text-neutral-400 shrink-0 select-none">
                        maji.hoberg.com.ng/store/
                      </span>
                      <input
                        type="text"
                        aria-label="Preview your custom Maji storefront link"
                        value={claimStoreHandle}
                        onChange={(e) => setClaimStoreHandle(e.target.value)}
                        placeholder="your-store-name"
                        className="w-full bg-transparent text-xs sm:text-sm font-mono font-extrabold text-[#111111] placeholder:text-neutral-400 focus:outline-none min-w-[90px]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-6 py-3.5 rounded-xl bg-[#F05A28] hover:bg-[#d94d1e] active:scale-[0.99] text-white font-extrabold text-sm shadow-md shadow-[#F05A28]/25 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                    >
                      <span>Open Storefront</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  {sanitizedClaimPreview && (
                    <div className="px-3 pt-2 pb-0.5 flex items-center justify-between text-[11px]">
                      <span className="text-neutral-500">
                        Your live storefront link:{' '}
                        <strong className="font-mono text-[#111111]">
                          maji.hoberg.com.ng/store/{sanitizedClaimPreview}
                        </strong>
                      </span>
                      <span className="text-[#F05A28] font-extrabold">Ready to claim</span>
                    </div>
                  )}
                </form>

                {/* Primary Storefront CTA + Secondary "Buy Directly from Independent Nigerian Stores" CTA */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Link
                    href={isAuthenticated ? '/dashboard' : '/login?mode=signup'}
                    className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#F05A28] hover:bg-[#d94d1e] text-white font-extrabold text-sm sm:text-base shadow-lg shadow-[#F05A28]/25 transition-all hover:-translate-y-0.5"
                  >
                    <Store className="w-4 h-4" />
                    <span>{isAuthenticated ? 'Open Storefront Studio' : 'Open Storefront — Free'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <a
                    href="#catalog"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#111111] hover:bg-neutral-800 text-white font-extrabold text-sm sm:text-base transition-all"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#F05A28]" />
                    <span>Buy from Nigerian Stores ({products.length})</span>
                  </a>
                </div>

                {/* Everything Included in Your Storefront (4-Card Bento Matrix) */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div className="p-3 rounded-2xl bg-white border border-[#111111]/[0.08] flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#F05A28]/10 text-[#F05A28] flex items-center justify-center shrink-0 mt-0.5">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-[#111111]">100% Seller Payout (T+1)</p>
                      <p className="text-[11px] text-neutral-500 leading-snug mt-0.5">
                        Direct Paystack bank subaccount · <span className="tabular-nums font-semibold">4% + ₦50</span> paid by buyer
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white border border-[#111111]/[0.08] flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#F05A28]/10 text-[#F05A28] flex items-center justify-center shrink-0 mt-0.5">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-[#111111]">Live Delivery Quotes</p>
                      <p className="text-[11px] text-neutral-500 leading-snug mt-0.5">
                        Courier rates at checkout or seller pickup + <span className="font-mono">ORD-...</span> tracking
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white border border-[#111111]/[0.08] flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#F05A28]/10 text-[#F05A28] flex items-center justify-center shrink-0 mt-0.5">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-[#111111]">30 Store Categories</p>
                      <p className="text-[11px] text-neutral-500 leading-snug mt-0.5">
                        18 physical &amp; 12 digital product builders + Hoberg AI Assistant
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white border border-[#111111]/[0.08] flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#F05A28]/10 text-[#F05A28] flex items-center justify-center shrink-0 mt-0.5">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-[#111111]">Buy Directly from Stores</p>
                      <p className="text-[11px] text-neutral-500 leading-snug mt-0.5">
                        Shop <span className="tabular-nums font-semibold">{stores.length}</span> active storefronts &amp;{' '}
                        <span className="tabular-nums font-semibold">{products.length}</span> listings
                      </p>
                    </div>
                  </div>
                </div>

                {/* Direct Shopper Strip: "Buy Directly from Independent Nigerian Stores" Category Pills */}
                {availableCategories.length > 0 && (
                  <div className="pt-3 border-t border-[#111111]/10">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-neutral-500">
                        Or buy directly from independent Nigerian stores:
                      </p>
                      <a
                        href="#stores"
                        className="text-[11px] font-extrabold text-[#F05A28] hover:underline"
                      >
                        View all {stores.length} stores →
                      </a>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCategorySelect('all')}
                        className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                          selectedCategory === 'all'
                            ? 'bg-[#111111] text-white'
                            : 'bg-white border border-[#111111]/12 text-[#111111] hover:border-[#F05A28]'
                        }`}
                      >
                        All Listings ({products.length})
                      </button>
                      {availableCategories.map((cat) => (
                        <button
                          key={cat.key}
                          type="button"
                          onClick={() => handleCategorySelect(cat.key)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            selectedCategory === cat.key
                              ? 'bg-[#F05A28] text-white'
                              : 'bg-white border border-[#111111]/12 text-[#111111] hover:border-[#F05A28]'
                          }`}
                        >
                          {cat.label} ({cat.count})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Interactive Live Maji Storefront Showcase & Merchant Command Preview */}
              <div className="lg:col-span-6">
                <div className="rounded-3xl bg-[#111111] text-white border border-[#111111] shadow-2xl overflow-hidden">
                  {/* Top Storefront Browser Chrome + Interactive Store Switcher */}
                  <div className="px-4 py-3 bg-[#18181b] border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#F05A28]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FF8559]/70" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                      </div>
                      <div className="ml-1 px-3 py-1 rounded-lg bg-black/60 border border-white/10 text-[11px] font-mono text-neutral-300 truncate">
                        maji.hoberg.com.ng/store/
                        <span className="text-[#FF8559] font-bold">
                          {activeHeroStore?.slug || 'your-store'}
                        </span>
                      </div>
                    </div>

                    {activeHeroStore && (
                      <Link
                        href={`/store/${activeHeroStore.slug}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F05A28] hover:bg-[#d94d1e] text-white text-[11px] font-extrabold transition-colors shrink-0"
                      >
                        <span>Visit Storefront</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>

                  {/* Interactive Storefront Switcher Bar (Preview Real Active Nigerian Stores on Maji) */}
                  {stores.length > 0 && (
                    <div className="px-4 py-2.5 bg-white/[0.03] border-b border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 shrink-0">
                        Live Stores:
                      </span>
                      {stores.slice(0, 5).map((st) => {
                        const isSelected = activeHeroStore?.id === st.id
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => setHeroStoreSlug(st.slug)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                              isSelected
                                ? 'bg-[#F05A28] text-white shadow-xs'
                                : 'bg-white/10 text-neutral-300 hover:bg-white/15 hover:text-white'
                            }`}
                          >
                            <Store className="w-3 h-3" />
                            <span>{st.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* Inside the Live Storefront Preview */}
                  <div className="p-4 sm:p-5 space-y-4 bg-[#FAF8F5] text-[#111111]">
                    {/* Storefront Editorial Banner & Verified Merchant Header */}
                    <div className="relative rounded-2xl overflow-hidden bg-[#111111] text-white p-4 sm:p-5 min-h-[155px] flex flex-col justify-between border border-[#111111]/10">
                      <img
                        src={
                          activeHeroStore?.banner_url ||
                          'https://images.unsplash.com/photo-1787779350771-a4253704dcad?auto=format&fit=crop&w=900&q=80'
                        }
                        alt="Nigerian storefront showcase banner — Photo by Ben Iwara in Lagos"
                        width={720}
                        height={360}
                        fetchPriority="high"
                        decoding="async"
                        className="absolute inset-0 w-full h-full object-cover opacity-55"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/30" />

                      <div className="relative z-10 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-xs border border-white/15 text-[10px] font-extrabold uppercase tracking-wider text-[#FF8559]">
                          <BadgeCheck className="w-3.5 h-3.5 text-[#F05A28]" />
                          <span>Verified Maji Storefront</span>
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-[#F05A28] text-white text-[10px] font-extrabold uppercase tracking-wider">
                          {activeHeroStore?.product_type || 'physical'} store
                        </span>
                      </div>

                      <div className="relative z-10 flex items-end justify-between gap-3 pt-4">
                        <div className="flex items-center gap-3 min-w-0">
                          {activeHeroStore?.logo_url ? (
                            <img
                              src={activeHeroStore.logo_url}
                              alt={activeHeroStore.name}
                              width={48}
                              height={48}
                              className="w-12 h-12 rounded-2xl object-cover bg-white border-2 border-white shadow-md shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F05A28] to-[#FF8559] text-white font-black text-lg flex items-center justify-center border-2 border-white shadow-md shrink-0">
                              {(activeHeroStore?.name || 'M').trim().charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h2 className="text-lg sm:text-xl font-extrabold text-white truncate">
                              {activeHeroStore?.name || 'Your Nigerian Storefront'}
                            </h2>
                            <p className="text-xs text-neutral-300 truncate">
                              {activeHeroStore?.store_category
                                ? `${activeHeroStore.store_category} · Paystack Direct Checkout`
                                : 'Custom Storefront · Paystack Direct Checkout'}
                            </p>
                          </div>
                        </div>

                        {activeHeroStore && (
                          <Link
                            href={`/store/${activeHeroStore.slug}`}
                            className="hidden sm:inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-white text-[#111111] hover:bg-[#F05A28] hover:text-white text-xs font-extrabold transition-colors shrink-0"
                          >
                            <span>Shop Store</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Live Storefront Products Shelf Inside Hero Preview */}
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500">
                          Live Storefront Products (Buy Directly)
                        </span>
                        <a
                          href="#catalog"
                          className="text-[11px] font-extrabold text-[#F05A28] hover:underline"
                        >
                          Browse all {products.length} products →
                        </a>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {activeHeroProducts.map((item) => {
                          const hasDiscount = Boolean(
                            item.discount_percent && item.discount_percent > 0
                          )
                          const finalPrice = hasDiscount
                            ? item.price * (1 - (item.discount_percent || 0) / 100)
                            : item.price

                          return (
                            <div
                              key={item.id}
                              className="group rounded-2xl bg-white border border-[#111111]/10 overflow-hidden flex flex-col justify-between hover:border-[#F05A28]/50 transition-all shadow-2xs"
                            >
                              <Link
                                href={`/store/${item.store.slug}/product/${item.slug}`}
                                className="relative aspect-[4/3] bg-[#FAF8F5] overflow-hidden block"
                              >
                                {item.image_url ? (
                                  <img
                                    src={item.image_url}
                                    alt={item.name}
                                    width={280}
                                    height={210}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-[#FAF8F5]">
                                    <MajiLogo
                                      variant="symbol-small"
                                      colorway="ember-duotone-light"
                                      size={28}
                                    />
                                  </div>
                                )}
                                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/75 text-white text-[10px] font-bold truncate max-w-[85%]">
                                  {item.store.name}
                                </span>
                              </Link>

                              <div className="p-3 flex flex-col flex-1 justify-between">
                                <div>
                                  <Link
                                    href={`/store/${item.store.slug}/product/${item.slug}`}
                                    className="block"
                                  >
                                    <h3 className="text-xs font-extrabold text-[#111111] truncate group-hover:text-[#F05A28] transition-colors">
                                      {item.name}
                                    </h3>
                                  </Link>
                                  <p className="text-sm font-black text-[#F05A28] tabular-nums mt-0.5">
                                    {formatNaira(finalPrice)}
                                  </p>
                                </div>

                                <Link
                                  href={`/store/${item.store.slug}/product/${item.slug}`}
                                  className="mt-2.5 w-full py-2 px-2.5 rounded-xl bg-[#F05A28] hover:bg-[#d94d1e] text-white text-[11px] font-extrabold flex items-center justify-center gap-1 transition-colors"
                                >
                                  <ShoppingCart className="w-3 h-3" />
                                  <span>Buy Now</span>
                                </Link>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Merchant + Buyer Ecosystem Bar at Bottom of Storefront Showcase */}
                    <div className="p-3.5 rounded-2xl bg-[#111111] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <MajiLogo
                          variant="symbol"
                          colorway="ember-duotone-dark"
                          size={26}
                          animation="rocker"
                        />
                        <div>
                          <p className="text-xs font-extrabold text-white">
                            Want a storefront like this for your business?
                          </p>
                          <p className="text-[11px] text-neutral-400">
                            Share your link on WhatsApp, Instagram &amp; TikTok with instant Paystack checkout.
                          </p>
                        </div>
                      </div>

                      <Link
                        href={isAuthenticated ? '/dashboard' : '/login?mode=signup'}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#F05A28] hover:bg-[#d94d1e] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shrink-0 transition-colors"
                      >
                        <span>Open Storefront</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Live Product Discovery & Marketplace Catalog Section (#catalog) */}
        <section id="catalog" className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.14em] text-[#F05A28] mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Live Marketplace Catalog</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111111]">
                Shop Published Products from Active Stores
              </h2>
            </div>

            {/* Filter & Sort Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              {discountedProductsCount > 0 && (
                <button
                  type="button"
                  onClick={() => setOnlyDeals(!onlyDeals)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                    onlyDeals
                      ? 'bg-[#F05A28] text-white shadow-sm shadow-[#F05A28]/25'
                      : 'bg-white border border-[#F05A28]/30 text-[#F05A28] hover:bg-[#F05A28]/10'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  <span>Deals ({discountedProductsCount})</span>
                </button>
              )}

              <div className="flex items-center gap-2 bg-white border border-[#111111]/12 rounded-xl px-3 py-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#F05A28]" />
                <label htmlFor="catalog-sort" className="text-xs font-bold text-neutral-500">
                  Sort:
                </label>
                <select
                  id="catalog-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-xs font-extrabold text-[#111111] focus:outline-none cursor-pointer"
                >
                  <option value="newest">Newest Arrivals</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filter Status Bar */}
          {(searchQuery || selectedCategory !== 'all' || onlyDeals) && (
            <div className="mb-6 p-3.5 rounded-2xl bg-white border border-[#111111]/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#111111]">
                <span>
                  Showing <strong className="text-[#F05A28] tabular-nums">{filteredProducts.length}</strong>{' '}
                  {filteredProducts.length === 1 ? 'product' : 'products'}
                </span>
                {searchQuery && (
                  <span className="px-2.5 py-1 rounded-full bg-[#FAF8F5] border border-neutral-200">
                    Search: &ldquo;{searchQuery}&rdquo;
                  </span>
                )}
                {selectedCategory !== 'all' && (
                  <span className="px-2.5 py-1 rounded-full bg-[#F05A28]/10 text-[#F05A28] capitalize">
                    Category: {selectedCategory}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                  setOnlyDeals(false)
                }}
                className="text-xs font-extrabold text-[#F05A28] hover:underline cursor-pointer"
              >
                Reset all filters
              </button>
            </div>
          )}

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#111111]/10 p-12 text-center max-w-lg mx-auto my-4">
              <div className="w-16 h-16 rounded-2xl bg-[#FAF8F5] border border-[#F05A28]/20 flex items-center justify-center mx-auto mb-4">
                <MajiLogo variant="symbol" colorway="ember-duotone-light" size={36} animation="bounce" />
              </div>
              <h3 className="text-lg font-extrabold text-[#111111] mb-1">
                No matching products found
              </h3>
              <p className="text-sm text-neutral-500 mb-5">
                Try clearing your current search or switching product categories.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                  setOnlyDeals(false)
                }}
                className="px-6 py-2.5 rounded-xl bg-[#F05A28] hover:bg-[#d94d1e] text-white text-xs font-extrabold transition-colors cursor-pointer"
              >
                Show All {products.length} Products
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {filteredProducts.map((product) => {
                const hasDiscount = Boolean(
                  product.discount_percent && product.discount_percent > 0
                )
                const finalPrice = hasDiscount
                  ? product.price * (1 - (product.discount_percent || 0) / 100)
                  : product.price

                return (
                  <article
                    key={product.id}
                    className="group bg-white rounded-2xl border border-[#111111]/[0.08] overflow-hidden flex flex-col hover:border-[#F05A28]/45 hover:shadow-xl transition-all duration-200"
                  >
                    {/* Product Image Link */}
                    <Link
                      href={`/store/${product.store.slug}/product/${product.slug}`}
                      className="relative aspect-square bg-[#FAF8F5] overflow-hidden block"
                    >
                      {hasDiscount && (
                        <span className="absolute top-0 left-0 z-10 bg-gradient-to-r from-[#F05A28] to-[#FF8559] text-white font-extrabold text-[11px] px-2.5 py-1 rounded-br-xl flex items-center gap-0.5">
                          <Zap className="w-3 h-3 fill-white" />
                          <span>-{product.discount_percent}%</span>
                        </span>
                      )}

                      {product.condition && (
                        <span className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full bg-black/75 text-white text-[10px] font-bold">
                          {product.condition}
                        </span>
                      )}

                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          width={400}
                          height={400}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#FAF8F5] to-neutral-100">
                          <MajiLogo
                            variant="symbol-small"
                            colorway="ember-duotone-light"
                            size={36}
                          />
                          <span className="mt-2 text-[11px] font-bold text-neutral-500">
                            {product.store.name}
                          </span>
                        </div>
                      )}
                    </Link>

                    {/* Card Body */}
                    <div className="p-3 sm:p-4 flex flex-col flex-1">
                      {/* Store Attribution Pill */}
                      <div className="flex items-center justify-between gap-1.5 mb-1.5">
                        <Link
                          href={`/store/${product.store.slug}`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-500 hover:text-[#F05A28] transition-colors truncate"
                        >
                          <Store className="w-3 h-3 text-[#F05A28] shrink-0" />
                          <span className="truncate">{product.store.name}</span>
                        </Link>
                        {product.sub_category && (
                          <span className="text-[10px] font-semibold text-neutral-400 capitalize truncate">
                            {product.sub_category}
                          </span>
                        )}
                      </div>

                      <Link
                        href={`/store/${product.store.slug}/product/${product.slug}`}
                        className="block flex-1"
                      >
                        <h3 className="text-xs sm:text-sm font-bold text-[#111111] group-hover:text-[#F05A28] transition-colors line-clamp-2 leading-snug mb-2">
                          {product.name}
                        </h3>

                        <div className="flex items-baseline gap-1.5 flex-wrap mb-3">
                          <span className="text-base sm:text-lg font-black text-[#F05A28] tabular-nums leading-none">
                            {formatNaira(finalPrice)}
                          </span>
                          {hasDiscount && (
                            <span className="text-xs text-neutral-400 line-through tabular-nums">
                              {formatNaira(product.price)}
                            </span>
                          )}
                        </div>
                      </Link>

                      <Link
                        href={`/store/${product.store.slug}/product/${product.slug}`}
                        className="mt-auto w-full py-2.5 px-3 rounded-xl bg-[#F05A28] hover:bg-[#d94d1e] active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 shadow-xs shadow-[#F05A28]/25"
                      >
                        <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                        <span>Shop Product</span>
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        {/* 5. Active Nigerian Stores Directory (#stores) */}
        <section id="stores" className="py-14 sm:py-18 bg-white border-y border-[#111111]/[0.08]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <span className="inline-block text-xs font-extrabold uppercase tracking-[0.14em] text-[#F05A28] mb-1.5">
                  Verified Merchant Storefronts
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111111]">
                  Explore Active Nigerian Stores on Maji
                </h2>
              </div>
              <Link
                href="/login?mode=signup"
                className="inline-flex items-center gap-1.5 text-sm font-extrabold text-[#F05A28] hover:underline"
              >
                <span>Open your own storefront</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredStores.map((store) => (
                <div
                  key={store.id}
                  className="rounded-3xl bg-[#FAF8F5] border border-[#111111]/[0.08] p-5 flex flex-col justify-between hover:border-[#F05A28]/45 hover:shadow-md transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {store.logo_url ? (
                          <img
                            src={store.logo_url}
                            alt={`${store.name} logo`}
                            width={56}
                            height={56}
                            loading="lazy"
                            decoding="async"
                            className="w-14 h-14 rounded-2xl object-cover bg-white border border-[#111111]/10 shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F05A28] to-[#FF8559] text-white font-black text-xl flex items-center justify-center shrink-0 shadow-xs">
                            {store.name.trim().charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-base sm:text-lg font-extrabold text-[#111111] truncate">
                              {store.name}
                            </h3>
                            <BadgeCheck className="w-4 h-4 text-[#F05A28] shrink-0" />
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {store.store_category && (
                              <span className="px-2 py-0.5 rounded-full bg-white border border-[#111111]/10 text-[11px] font-bold text-neutral-700 capitalize">
                                {store.store_category}
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-full bg-[#F05A28]/10 text-[#F05A28] text-[11px] font-extrabold capitalize">
                              {store.product_type || 'physical'} store
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {store.about_text ? (
                      <p className="text-xs text-neutral-600 line-clamp-2 mb-4 leading-relaxed">
                        {store.about_text}
                      </p>
                    ) : null}

                    {store.address ? (
                      <p className="flex items-center gap-1 text-xs text-neutral-500 mb-4">
                        <MapPin className="w-3.5 h-3.5 text-[#F05A28] shrink-0" />
                        <span className="truncate">{store.address}</span>
                      </p>
                    ) : null}

                    {/* Real Product Thumbnail Strip for this Store */}
                    {store.previewImages.length > 0 && (
                      <div className="flex items-center gap-2 mb-4">
                        {store.previewImages.slice(0, 3).map((imgUrl, idx) => (
                          <img
                            key={idx}
                            src={imgUrl}
                            alt={`${store.name} product preview ${idx + 1}`}
                            width={56}
                            height={56}
                            loading="lazy"
                            decoding="async"
                            className="w-13 h-13 rounded-xl object-cover bg-white border border-[#111111]/10"
                          />
                        ))}
                        {store.productCount > 0 && (
                          <span className="text-xs font-bold text-neutral-500 pl-1 tabular-nums">
                            {store.productCount} {store.productCount === 1 ? 'listing' : 'listings'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#111111]/[0.07] flex items-center justify-between gap-3">
                    <span className="text-xs font-mono text-neutral-500 truncate">
                      /store/{store.slug}
                    </span>
                    <Link
                      href={`/store/${store.slug}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F05A28] hover:bg-[#d94d1e] text-white text-xs font-extrabold transition-colors shrink-0 shadow-2xs"
                    >
                      <span>Visit Store</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Editorial Nigerian Category Discovery (#categories) */}
        <section id="categories" className="py-14 sm:py-18 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-8">
            <span className="inline-block text-xs font-extrabold uppercase tracking-[0.14em] text-[#F05A28] mb-1.5">
              Curated Nigerian Commerce
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111111]">
              Shop by Category
            </h2>
            <p className="mt-1.5 text-sm sm:text-base text-neutral-600">
              Select a category to filter active listings from Nigerian merchants on Maji.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {EDITORIAL_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => handleCategorySelect(cat.key)}
                className="group relative h-72 sm:h-80 rounded-3xl overflow-hidden bg-[#111111] text-left border border-[#111111]/10 flex flex-col justify-end p-5 cursor-pointer shadow-sm hover:shadow-xl transition-all"
              >
                <img
                  src={cat.image}
                  alt={`${cat.title} — ${cat.credit}`}
                  width={600}
                  height={750}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />

                <div className="relative z-10">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F05A28] text-white text-[10px] font-extrabold uppercase tracking-wider mb-2">
                    Explore Category
                  </span>
                  <h3 className="text-lg font-extrabold text-white">{cat.title}</h3>
                  <p className="text-xs text-neutral-300 mt-1 line-clamp-2 leading-relaxed">
                    {cat.subtitle}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* 7. Transparent Nigerian Commerce Architecture & Seller Callout (#sell-on-maji) */}
        <section id="sell-on-maji" className="py-16 sm:py-22 bg-[#111111] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15">
                  <MajiLogo
                    variant="symbol"
                    colorway="ember-orange"
                    size={18}
                    animation="pulse"
                  />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#FF8559]">
                    Built for Nigerian Merchants
                  </span>
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.06]">
                  Launch your Nigerian storefront with{' '}
                  <span className="text-[#F05A28]">automated Paystack payouts.</span>
                </h2>

                <p className="text-neutral-300 text-base leading-relaxed">
                  Whether you run a fashion boutique in Lagos, sell electronics and gadgets, or publish digital ebooks and courses, Maji gives your business a dedicated online storefront that settles directly to your Nigerian bank account.
                </p>

                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                    <CreditCard className="w-5 h-5 text-[#F05A28] shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-extrabold text-white">
                        Direct Paystack Bank Account Verification &amp; Split Settlement
                      </h3>
                      <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                        Connect your Nigerian bank account in Seller Studio. Buyers pay the{' '}
                        <span className="text-white font-bold tabular-nums">4% + ₦50</span> platform fee at checkout so you receive 100% of your product subtotal.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                    <Truck className="w-5 h-5 text-[#F05A28] shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-extrabold text-white">
                        Live Delivery Quotes or Direct Seller Arrangement
                      </h3>
                      <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                        Physical stores can offer live courier delivery rate calculation at checkout or let customers arrange pickup directly with the seller, backed by order reference tracking (<code className="text-[#FF8559]">/track/ORD-...</code>).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                    <Package className="w-5 h-5 text-[#F05A28] shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-extrabold text-white">
                        18 Physical &amp; 12 Digital Store Categories + Hoberg AI Assistant
                      </h3>
                      <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                        Dedicated product builders for clothing, shoes, gadgets, jewelry, food, ebooks, and templates — with an in-dashboard AI assistant to guide your setup.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Link
                    href={isAuthenticated ? '/dashboard' : '/login?mode=signup'}
                    className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-[#F05A28] hover:bg-[#d94d1e] text-white font-extrabold text-base shadow-lg shadow-[#F05A28]/25 transition-all"
                  >
                    <span>{isAuthenticated ? 'Go to Seller Studio' : 'Create Your Free Store'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-base border border-white/15 transition-all"
                  >
                    <span>Sign In to Existing Store</span>
                  </Link>
                </div>
              </div>

              {/* Right Column: How a Maji Order Works Step-by-Step */}
              <div className="lg:col-span-6">
                <div className="rounded-3xl bg-[#18181b] border border-white/10 p-6 sm:p-8 space-y-6">
                  <div className="flex items-center justify-between border-b border-white/10 pb-5">
                    <div>
                      <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#F05A28]">
                        Transparent Workflow
                      </span>
                      <h3 className="text-xl font-extrabold text-white mt-0.5">
                        How Buying &amp; Selling Works on Maji
                      </h3>
                    </div>
                    <MajiLogo
                      variant="symbol"
                      colorway="ember-duotone-dark"
                      size={36}
                      animation="bounce"
                    />
                  </div>

                  <div className="space-y-4">
                    {[
                      {
                        step: '01',
                        title: 'Merchant Publishes Storefront & Catalog',
                        desc: 'Sellers register, verify their Nigerian bank account or pickup address, and publish physical or digital products under their /store/slug URL.',
                      },
                      {
                        step: '02',
                        title: 'Buyer Adds to Cart & Selects Delivery',
                        desc: 'Shoppers browse the storefront, choose product variants, and either select a live delivery quote, arrange pickup with the seller, or checkout digital items.',
                      },
                      {
                        step: '03',
                        title: 'Paystack Checkout & Order Confirmation',
                        desc: 'Payment is processed via Paystack. Both buyer and seller receive instant email confirmation with the unique ORD-... tracking reference.',
                      },
                    ].map((item) => (
                      <div
                        key={item.step}
                        className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex gap-4"
                      >
                        <span className="h-8 w-8 rounded-xl bg-[#F05A28] text-white font-mono text-xs font-extrabold flex items-center justify-center shrink-0">
                          {item.step}
                        </span>
                        <div>
                          <h4 className="text-sm font-extrabold text-white">{item.title}</h4>
                          <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 text-xs text-neutral-400">
                    <span className="inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#F05A28]" />
                      <span>Verified by Hoberg Digital</span>
                    </span>
                    <MajiStorefrontBadge height={30} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 8. Official Deep Obsidian Footer */}
      <footer className="bg-[#0b0b0b] text-white border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-white/10">
            {/* Brand Column */}
            <div className="md:col-span-5 space-y-4">
              <MajiLogo variant="horizontal" colorway="ember-duotone-dark" size={34} />
              <p className="text-xs sm:text-sm text-neutral-400 max-w-sm leading-relaxed">
                Maji is a multi-vendor Nigerian commerce platform by Hoberg Digital — connecting shoppers with independent physical and digital storefronts across Nigeria.
              </p>
              <div className="pt-1">
                <MajiStorefrontBadge height={32} />
              </div>
            </div>

            {/* Active Stores Links */}
            <div className="md:col-span-3 space-y-2.5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#FF8559]">
                Active Storefronts
              </h3>
              <ul className="space-y-2 text-xs text-neutral-400">
                {stores.slice(0, 5).map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/store/${s.slug}`}
                      className="hover:text-white transition-colors inline-flex items-center gap-1"
                    >
                      <span>{s.name}</span>
                      <ArrowUpRight className="w-3 h-3 text-[#F05A28]" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Platform & Merchant Links */}
            <div className="md:col-span-4 space-y-2.5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#FF8559]">
                Marketplace &amp; Support
              </h3>
              <ul className="space-y-2 text-xs text-neutral-400">
                <li>
                  <a href="#catalog" className="hover:text-white transition-colors">
                    Browse Published Products ({products.length})
                  </a>
                </li>
                <li>
                  <Link href="/login?mode=signup" className="hover:text-white transition-colors">
                    Create a Seller Account
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Seller Studio Sign In
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:support.hoberg@gmail.com"
                    className="hover:text-white transition-colors"
                  >
                    Support: support.hoberg@gmail.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
            <p>© {new Date().getFullYear()} Maji Marketplace · Powered by Hoberg Digital.</p>
            <p className="text-[11px] text-neutral-500">
              Editorial photography from Lagos &amp; Abuja by Ben Iwara, Muhammad-Taha Ibrahim &amp; Theresa Ude via Unsplash License.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

