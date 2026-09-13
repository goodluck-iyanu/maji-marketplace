'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Store, Package, Settings, CreditCard, LogOut, Home, Menu, X } from 'lucide-react'

export function Sidebar({ storeName, storeSlug }: { storeName: string; storeSlug: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const links = [
    { name: 'Overview', href: '/dashboard', icon: Home },
    { name: 'Products', href: '/dashboard/products', icon: Package },
    { name: 'Payments', href: '/dashboard/payments', icon: CreditCard },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  return (
    <>
      {/* Mobile header (hamburger) */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-30">
        <div className="flex items-center">
          <Store className="h-5 w-5 mr-2" />
          <span className="font-semibold">{storeName}</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="text-gray-500 hover:text-black">
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-200 ease-in-out
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-16 hidden md:flex items-center px-6 border-b border-gray-100">
          <Store className="h-5 w-5 mr-2" />
          <span className="font-semibold truncate">{storeName}</span>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))
            return (
              <Link 
                key={link.name} 
                href={link.href} 
                onClick={() => setIsOpen(false)}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                {link.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
           <form action="/auth/signout" method="post">
              <button className="flex items-center px-3 py-2 w-full text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors">
                <LogOut className="mr-3 h-5 w-5 text-gray-400" />
                Sign out
              </button>
           </form>
           <div className="mt-4 px-3">
             <Link href={`/store/${storeSlug}`} target="_blank" className="text-xs text-blue-600 hover:underline">
               View public store ↗
             </Link>
           </div>
        </div>
      </div>
    </>
  )
}

