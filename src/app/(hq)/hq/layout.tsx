import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { LayoutDashboard, Users, Store, Package, ShoppingCart, Settings, LogOut, FileText, Bell, ShieldCheck } from 'lucide-react'
import { HQMobileNav } from './components/hq-mobile-nav'
import { MajiLogo } from '@/components/brand/maji-brand'

export const metadata = {
  title: 'Maji HQ',
  description: 'Maji HQ Control Center',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin?next=/hq')
  }

  const { data: adminRole } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!adminRole) {
    redirect('/')
  }

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
    <div className="flex h-[100dvh] bg-[#FAF8F5] overflow-hidden text-[#111111]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#111111] text-white flex-shrink-0 flex flex-col border-r border-white/10 hidden md:flex">
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/10">
          <Link href="/hq" className="flex items-center gap-2.5">
            <MajiLogo variant="horizontal" colorway="ember-duotone-dark" size={28} />
            <span className="px-2 py-0.5 rounded-full bg-[#F05A28] text-white text-[10px] font-extrabold uppercase tracking-wider">
              HQ
            </span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-sm font-semibold"
              >
                <Icon className="w-4 h-4 text-[#F05A28]" />
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
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:hidden">
          <Link href="/hq" className="flex items-center gap-2">
            <MajiLogo variant="horizontal" colorway="ember-duotone-light" size={28} />
            <span className="px-2 py-0.5 rounded-full bg-[#F05A28] text-white text-[10px] font-extrabold uppercase tracking-wider">
              HQ
            </span>
          </Link>
          <HQMobileNav />
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
