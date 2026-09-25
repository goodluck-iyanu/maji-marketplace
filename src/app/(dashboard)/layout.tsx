import Link from 'next/link'
import { Store, Package, Settings, CreditCard, LogOut, Home } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

import { Sidebar } from './components/sidebar'
import { MajiAIAssistant } from './components/ai-assistant'

export const dynamic = 'force-dynamic'

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
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!store) {
    redirect('/onboarding')
  }

  // Fetch AI Assistant context data
  const { data: payoutAccount } = await supabase
    .from('payout_accounts')
    .select('id')
    .eq('store_id', store.id)
    .single()

  const { count: productCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', store.id)

  const { data: orders } = await supabase
    .from('orders')
    .select('total_amount, payment_status')
    .eq('store_id', store.id)
    .eq('payment_status', 'paid')

  const totalSales = (orders || []).reduce((sum, order) => sum + Number(order.total_amount), 0)

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      <Sidebar storeName={store.name} storeSlug={store.slug} productType={store.product_type} />

      {/* Main content */}
      <div className="flex-1 overflow-auto md:w-[calc(100%-16rem)]">
        <main className="p-4 md:p-8">
          {children}
        </main>
      </div>

      <MajiAIAssistant
        storeName={store.name}
        storeSlug={store.slug}
        hasBank={!!payoutAccount}
        hasProduct={(productCount || 0) > 0}
        productCount={productCount || 0}
        totalSales={totalSales}
      />
    </div>
  )
}

