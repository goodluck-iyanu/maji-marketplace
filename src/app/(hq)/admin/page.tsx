import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Get total stores (Note: admin can see all active/inactive stores due to RLS bypass in Postgres or here since they have admin role)
  // Wait, RLS for admin allows reading all stores: `is_admin()`
  const { count: storeCount } = await supabase
    .from('stores')
    .select('*', { count: 'exact', head: true })

  const { count: usersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  const { count: pendingPayouts } = await supabase
    .from('payout_change_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Admin Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <p className="text-sm text-gray-400 font-medium">Total Stores</p>
          <p className="text-3xl font-semibold text-white mt-2">{storeCount || 0}</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <p className="text-sm text-gray-400 font-medium">Total Users</p>
          <p className="text-3xl font-semibold text-white mt-2">{usersCount || 0}</p>
        </div>

        <div className="bg-red-900 p-6 rounded-xl border border-red-800">
          <p className="text-sm text-red-200 font-medium">Pending Payout Approvals</p>
          <p className="text-3xl font-semibold text-white mt-2">{pendingPayouts || 0}</p>
        </div>
      </div>
    </div>
  )
}

