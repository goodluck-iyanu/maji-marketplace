import { createClient } from '@/lib/supabase/server'
import { FileText, ArrowUpRight, ArrowDownRight, CreditCard } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminLedgerPage() {
  const supabase = await createClient()

  const { data: transactions, error } = await supabase
    .from('financial_transactions')
    .select(`
      id,
      transaction_type,
      amount,
      status,
      description,
      created_at,
      orders (payment_reference),
      stores (name)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) console.error('Error fetching ledger:', error)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Financial Ledger</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-900 font-medium">
              <tr>
                <th className="px-6 py-4">Transaction</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Store</th>
                <th className="px-6 py-4">Reference</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions?.map((tx: any) => {
                const isCredit = ['platform_fee', 'delivery_fee'].includes(tx.transaction_type)
                return (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${isCredit ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                          {isCredit ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 capitalize">{tx.transaction_type.replace('_', ' ')}</p>
                          <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-gray-500">{tx.description || '-'}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">
                      {tx.stores?.name || '-'}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                      {tx.orders?.payment_reference || '-'}
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${isCredit ? 'text-green-600' : 'text-gray-900'}`}>
                      {isCredit ? '+' : ''}₦{Number(tx.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        tx.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {!transactions?.length && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
