import { createClient as createAdminClient } from '@supabase/supabase-js'
import { FileText, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { Pagination } from '../components/pagination'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function AdminLedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; page?: string }>
}) {
  const params = await searchParams
  const typeFilter = params.type || 'all'
  const page = parseInt(params.page || '1', 10)
  const pageSize = 50
  const offset = (page - 1) * pageSize

  let query = supabaseAdmin
    .from('financial_transactions')
    .select(`
      id,
      amount,
      transaction_type,
      created_at,
      stores (id, name),
      orders (id, payment_reference)
    `, { count: 'exact' })
  
  if (typeFilter !== 'all') {
    query = query.eq('transaction_type', typeFilter)
  }

  const { data: transactions, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (error) {
    console.error('Error fetching ledger:', error)
  }

  const totalPages = count ? Math.ceil(count / pageSize) : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">General Ledger</h1>
        
        {/* Type Filter */}
        <div className="flex bg-white rounded-lg border border-gray-200 p-1">
          <Link href="?type=all" className={`px-3 py-1.5 text-xs font-semibold rounded-md ${typeFilter === 'all' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}>All</Link>
          <Link href="?type=platform_fee" className={`px-3 py-1.5 text-xs font-semibold rounded-md ${typeFilter === 'platform_fee' ? 'bg-green-50 text-green-700' : 'text-gray-500 hover:text-gray-900'}`}>Platform Fees</Link>
          <Link href="?type=product_sale" className={`px-3 py-1.5 text-xs font-semibold rounded-md ${typeFilter === 'product_sale' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-900'}`}>Seller Sales</Link>
          <Link href="?type=payout" className={`px-3 py-1.5 text-xs font-semibold rounded-md ${typeFilter === 'payout' ? 'bg-amber-50 text-amber-700' : 'text-gray-500 hover:text-gray-900'}`}>Payouts</Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-900 font-medium">
              <tr>
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Related Store</th>
                <th className="px-6 py-4">Related Order</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions?.map((tx: any) => {
                const isCredit = tx.transaction_type === 'platform_fee' || tx.transaction_type === 'delivery_fee'
                return (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{tx.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      {new Date(tx.created_at).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        tx.transaction_type === 'platform_fee' ? 'bg-green-100 text-green-700' : 
                        tx.transaction_type === 'product_sale' ? 'bg-blue-100 text-blue-700' :
                        tx.transaction_type === 'payout' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {tx.transaction_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {tx.stores ? (
                        <Link href={`/hq/sellers/${tx.stores.id}`} className="text-blue-600 hover:underline font-medium">
                          {tx.stores.name}
                        </Link>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {tx.orders ? (
                        <Link href={`/hq/orders/${tx.orders.id}`} className="text-blue-600 font-mono hover:underline text-xs">
                          {tx.orders.payment_reference}
                        </Link>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      <div className="flex items-center justify-end gap-1">
                        {isCredit ? (
                          <ArrowDownLeft className="w-3 h-3 text-green-500" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3 text-blue-500" />
                        )}
                        <span className={isCredit ? 'text-green-700' : 'text-gray-900'}>
                          ₦{Number(tx.amount).toLocaleString()}
                        </span>
                      </div>
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
        <Pagination totalPages={totalPages} currentPage={page} />
      </div>
    </div>
  )
}
