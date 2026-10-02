import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { LayoutDashboard, Users, Store, Package, ShoppingCart, Activity, Settings, LogOut, FileText, Bell } from 'lucide-react'

export const metadata = {
  title: 'HQ',
  description: 'HQ Dashboard',
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
    { name: 'Ledger', href: '/hq/ledger', icon: FileText },
    { name: 'Broadcasts', href: '/hq/notifications', icon: Bell },
    { name: 'Settings', href: '/hq/settings', icon: Settings },
  ]

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col border-r border-slate-800 hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Link href="/hq" className="font-bold text-xl tracking-tight text-white flex items-center gap-2">
            <span className="text-2xl">âš¡</span> HQ
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-sm font-medium"
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
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:hidden">
          <Link href="/hq" className="font-bold text-xl tracking-tight text-slate-900">
            âš¡ HQ
          </Link>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

