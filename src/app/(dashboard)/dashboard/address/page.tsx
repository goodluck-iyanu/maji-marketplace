import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AddressForm } from './address-form'

export const dynamic = 'force-dynamic'

export default async function AddressPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: store } = await supabase
    .from('stores')
    .select('id, pickup_address, pickup_phone, product_type')
    .eq('user_id', user.id)
    .single()

  if (!store || store.product_type !== 'physical') {
    redirect('/dashboard')
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-6">Pickup Address</h1>
      
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Current Address</h2>
        <p className="text-gray-900 font-medium text-lg mb-1">{store.pickup_address || 'No pickup address set'}</p>
        {store.pickup_phone && (
          <p className="text-sm text-gray-500 mt-2">Contact Phone: {store.pickup_phone}</p>
        )}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Change Pickup Address</h2>
        <AddressForm />
      </div>
    </div>
  )
}
