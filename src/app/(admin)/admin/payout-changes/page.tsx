import { createClient } from '@/lib/supabase/server'
import { Check, X } from 'lucide-react'

export default async function AdminPayoutChanges() {
  const supabase = await createClient()

  const { data: requests } = await supabase
    .from('payout_change_requests')
    .select('*, stores(name)')
    .eq('status', 'pending')
    .order('requested_at', { ascending: true })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Pending Payout Changes</h1>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        {(!requests || requests.length === 0) ? (
          <div className="p-8 text-center text-gray-400">
            No pending payout change requests.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-900">
                <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Store</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase">New Bank</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase">New Account</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {requests.map(req => (
                <tr key={req.id}>
                  <td className="px-6 py-4 font-medium">{req.stores?.name}</td>
                  <td className="px-6 py-4">{req.new_bank_code}</td>
                  <td className="px-6 py-4">
                    <div>{req.new_account_name}</div>
                    <div className="text-sm text-gray-400">{req.new_account_number}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                       {/* Approve/Reject actions go here (Server Actions in a real app) */}
                       <button className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-md transition-colors" title="Approve">
                          <Check className="h-4 w-4" />
                       </button>
                       <button className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-md transition-colors" title="Reject">
                          <X className="h-4 w-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

