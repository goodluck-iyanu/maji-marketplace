'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, LayoutDashboard, Users, Store, Package, ShoppingCart, Activity, Settings, LogOut, FileText, Bell, ShieldCheck, Zap } from 'lucide-react'

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
    { name: 'Payouts', href: '/hq/payout-changes', icon: ShieldCheck },
    { name: 'Ledger', href: '/hq/ledger', icon: FileText },
    { name: 'Broadcasts', href: '/hq/notifications', icon: Bell },
    { name: 'Settings', href: '/hq/settings', icon: Settings },
  ]

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2 -mr-2 text-slate-900 focus:outline-none"
        aria-label="Open Menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-over menu */}
      <div 
        className={`fixed inset-y-0 right-0 w-64 bg-slate-900 shadow-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          <Link href="/hq" className="font-bold text-xl tracking-tight text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-400" fill="currentColor" /> HQ
          </Link>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 -mr-2 text-slate-400 hover:text-white focus:outline-none"
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                  isActive 
                    ? 'bg-slate-800 text-white' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <form action="/auth/signout" method="post">
            <button className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-medium">
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
