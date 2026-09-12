import Link from 'next/link'
import { Store, Package, Settings, CreditCard, LogOut, Home } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get store info
  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!store) {
    redirect('/onboarding')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <Store className="h-5 w-5 mr-2" />
          <span className="font-semibold">{store.name}</span>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-1">
          <Link href="/dashboard" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-gray-900">
            <Home className="mr-3 h-5 w-5 text-gray-400" />
            Overview
          </Link>
          <Link href="/dashboard/products" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-gray-900">
            <Package className="mr-3 h-5 w-5 text-gray-400" />
            Products
          </Link>
          <Link href="/dashboard/payments" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-gray-900">
            <CreditCard className="mr-3 h-5 w-5 text-gray-400" />
            Payments
          </Link>
          <Link href="/dashboard/settings" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-gray-900">
            <Settings className="mr-3 h-5 w-5 text-gray-400" />
            Settings
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-200">
           <form action="/auth/signout" method="post">
              <button className="flex items-center px-3 py-2 w-full text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-md">
                <LogOut className="mr-3 h-5 w-5 text-gray-400" />
                Sign out
              </button>
           </form>
           <div className="mt-4 px-3">
             <Link href={`/store/${store.slug}`} target="_blank" className="text-xs text-blue-600 hover:underline">
               View public store ↗
             </Link>
           </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

