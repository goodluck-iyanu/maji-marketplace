'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Package, Settings, CreditCard, LogOut, Home, Menu, X, MapPin, ExternalLink } from 'lucide-react'
import { NotificationBell } from './notification-bell'
import { StorefrontLink } from './storefront-link'
import { MajiLogo } from '@/components/brand/maji-brand'

export function Sidebar({
  storeId,
  storeName,
  storeSlug,
  productType,
}: {
  storeId: string
  storeName: string
  storeSlug: string
  productType?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const links = [
    { name: 'Overview', href: '/dashboard', icon: Home },
    { name: 'Products', href: '/dashboard/products', icon: Package },
    { name: 'Payments', href: '/dashboard/payments', icon: CreditCard },
  ]

  if (productType === 'physical') {
    links.push({ name: 'Pickup Address', href: '/dashboard/address', icon: MapPin })
  }

  links.push({ name: 'Settings', href: '/dashboard/settings', icon: Settings })

  return (
    <>
      {/* Mobile header (hamburger) */}
      <div className="md:hidden flex flex-col bg-white/95 backdrop-blur-md border-b border-[#111111]/[0.07] sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-xl bg-[#FAF8F5] border border-[#111111]/[0.07] flex items-center justify-center shrink-0">
              <MajiLogo variant="symbol-small" colorway="ember-duotone-light" size={20} />
            </div>
            <span className="font-bold text-base text-[#111111] truncate">{storeName}</span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell storeId={storeId} />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-[#111111] hover:bg-neutral-100 transition-colors"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <div className="px-4 pb-3">
          <StorefrontLink storeSlug={storeSlug} />
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-[#111111]/50 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-66 bg-white border-r border-[#111111]/[0.07] flex flex-col transform transition-transform duration-200 ease-in-out
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      >
        <div className="flex flex-col px-5 py-5 border-b border-neutral-100 hidden md:flex">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-[#FAF8F5] border border-[#111111]/[0.07] flex items-center justify-center shrink-0">
                <MajiLogo variant="symbol-small" colorway="ember-duotone-light" size={22} />
              </div>
              <div className="min-w-0 pr-2">
                <span className="block font-bold text-base text-[#111111] truncate">
                  {storeName}
                </span>
                <span className="block text-[11px] font-medium text-neutral-400 truncate">
                  Maji Seller Studio
                </span>
              </div>
            </div>
            <NotificationBell storeId={storeId} />
          </div>
          <StorefrontLink storeSlug={storeSlug} />
        </div>

        <nav className="flex-1 py-5 px-3.5 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon
            const isActive =
              pathname === link.href ||
              (link.href !== '/dashboard' && pathname.startsWith(link.href))
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center px-3.5 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#111111] text-white shadow-xs'
                    : 'text-neutral-600 hover:bg-[#FAF8F5] hover:text-[#111111]'
                }`}
              >
                <Icon
                  className={`mr-3 h-4.5 w-4.5 ${
                    isActive ? 'text-[#F05A28]' : 'text-neutral-400'
                  }`}
                />
                {link.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-neutral-100 space-y-3">
          <form
            action="/auth/signout"
            method="post"
            onSubmit={(e) => {
              if (!window.confirm('Are you sure you want to sign out?')) {
                e.preventDefault()
              }
            }}
          >
            <button className="flex items-center px-3.5 py-2.5 w-full text-sm font-semibold text-neutral-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors cursor-pointer">
              <LogOut className="mr-3 h-4.5 w-4.5 text-neutral-400" />
              Sign out
            </button>
          </form>

          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between px-2">
            <MajiLogo variant="horizontal" colorway="ember-duotone-light" size={20} />
            <Link
              href={`/store/${storeSlug}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#F05A28] hover:underline"
            >
              My Store <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
