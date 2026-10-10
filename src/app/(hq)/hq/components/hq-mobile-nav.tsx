'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, LayoutDashboard, Users, Store, Package, ShoppingCart, Settings, LogOut, FileText, Bell, ShieldCheck } from 'lucide-react'
import { MajiLogo } from '@/components/brand/maji-brand'

export function HQMobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Prevent background scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const navItems = [
    { name: 'Dashboard', href: '/hq', icon: LayoutDashboard },
    { name: 'Users', href: '/hq/users', icon: Users },
    { name: 'Sellers', href: '/hq/sellers', icon: Store },
    { name: 'Products', href: '/hq/products', icon: Package },
    { name: 'Orders', href: '/hq/orders', icon: ShoppingCart },
    { name: 'Payouts', href: '/hq/payouts', icon: ShieldCheck },
    { name: 'Ledger', href: '/hq/ledger', icon: FileText },
    { name: 'Broadcasts', href: '/hq/notifications', icon: Bell },
    { name: 'Settings', href: '/hq/settings', icon: Settings },
  ]

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2 -mr-2 text-[#111111] focus:outline-none"
        aria-label="Open Menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-over menu */}
      <div 
        className={`fixed inset-y-0 right-0 w-64 bg-[#111111] shadow-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          <Link href="/hq" className="flex items-center gap-2">
            <MajiLogo variant="horizontal" colorway="ember-duotone-dark" size={26} />
            <span className="px-2 py-0.5 rounded-full bg-[#F05A28] text-white text-[10px] font-extrabold uppercase tracking-wider">
              HQ
            </span>
          </Link>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 -mr-2 text-gray-400 hover:text-white focus:outline-none"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== '/hq' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-semibold ${
                  isActive 
                    ? 'bg-[#F05A28] text-white shadow-sm' 
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#F05A28]'}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>
        
        <div className="p-4 border-t border-white/10">
          <form action="/auth/signout" method="post">
            <button className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-sm font-semibold">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
