import { createClient as createAdminClient } from '@supabase/supabase-js'
import { ShieldCheck, ArrowUpRight, Check, X } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function AdminPayoutsPage() {
  // 1. Fetch pending account change requests
  const { data: changeRequests } = await supabaseAdmin
    .from('payout_change_requests')
    .select('*, stores(name)')
    .eq('status', 'pending')
    .order('requested_at', { ascending: true })

  // 2. Fetch aggregate balances for all active stores
  const { data: transactions } = await supabaseAdmin
    .from('financial_transactions')
    .select('store_id, amount, transaction_type, stores(name, id)')

  const storeBalances: Record<string, { id: string, name: string, earned: number, paid: number, pending: number }> = {}

  if (transactions) {
    transactions.forEach(t => {
      const storeId = t.store_id
      if (!storeId || !t.stores) return
      
      if (!storeBalances[storeId]) {
                const storeData = t.stores as any
        storeBalances[storeId] = { id: storeId, name: storeData?.name || 'Unknown', earned: 0, paid: 0, pending: 0 }
      }

      if (t.transaction_type === 'product_sale') {
        storeBalances[storeId].earned += Number(t.amount)
      } else if (t.transaction_type === 'payout') {
        storeBalances[storeId].paid += Math.abs(Number(t.amount))
      }
    })
  }

  // Calculate pending balances
  Object.values(storeBalances).forEach(b => {
    b.pending = b.earned - b.paid
  })

  // Filter to stores that actually have a pending balance > 0
  const storesNeedingPayout = Object.values(storeBalances).filter(b => b.pending > 0).sort((a, b) => b.pending - a.pending)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Payouts Management</h1>
      </div>

      {/* Account Change Requests */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-amber-50">
          <h2 className="font-bold text-amber-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-600" /> Pending Account Changes
          </h2>
          <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-full">
            {changeRequests?.length || 0} Requests
          </span>
        </div>
        
        {(!changeRequests || changeRequests.length === 0) ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No pending payout account change requests.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Store</th>
                  <th className="px-6 py-4">New Bank</th>
                  <th className="px-6 py-4">New Account</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {changeRequests.map(req => (
                  <tr key={req.id}>
                    <td className="px-6 py-4 font-medium text-gray-900">{req.stores?.name}</td>
                    <td className="px-6 py-4 text-gray-600">{req.new_bank_code}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{req.new_account_name}</div>
                      <div className="text-sm text-gray-500">{req.new_account_number}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button className="bg-green-50 hover:bg-green-100 text-green-600 p-2 rounded-md transition-colors border border-green-200" title="Approve">
                            <Check className="h-4 w-4" />
                        </button>
                        <button className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-md transition-colors border border-red-200" title="Reject">
                            <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Balances */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-green-600" /> Seller Balances (Owed)
          </h2>
        </div>
        
        {storesNeedingPayout.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            All sellers have been paid. No pending balances.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-900 font-medium">
                <tr>
                  <th className="px-6 py-4">Store</th>
                  <th className="px-6 py-4 text-right">Total Earned</th>
                  <th className="px-6 py-4 text-right">Total Paid Out</th>
                  <th className="px-6 py-4 text-right">Pending Balance (Owed)</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {storesNeedingPayout.map(store => (
                  <tr key={store.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <Link href={`/hq/sellers/${store.id}`} className="hover:text-blue-600 hover:underline">
                        {store.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-500">â‚¦{store.earned.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-green-600">â‚¦{store.paid.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">â‚¦{store.pending.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                      <button className="bg-black text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-gray-800 transition-colors">
                        Mark Paid
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}

