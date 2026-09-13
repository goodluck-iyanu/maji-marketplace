import Link from 'next/link'
import { Store, Package, Settings, CreditCard, LogOut, Home } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

import { Sidebar } from './components/sidebar'

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
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      <Sidebar storeName={store.name} storeSlug={store.slug} />

      {/* Main content */}
      <div className="flex-1 overflow-auto md:w-[calc(100%-16rem)]">
        <main className="p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

