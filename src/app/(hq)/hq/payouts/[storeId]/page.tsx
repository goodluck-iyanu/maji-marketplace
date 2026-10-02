import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Wallet, ArrowLeft, ArrowUpRight, ArrowDownRight, Clock, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { InitiatePayoutForm } from './initiate-payout-form'
import { CompletePayoutButton } from './complete-payout-button'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function SellerLedgerPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params

  // 1. Fetch Store Details
  const { data: store } = await supabaseAdmin
    .from('stores')
    .select('name, slug, profiles(email, full_name, phone)')
    .eq('id', storeId)
    .single()

  if (!store) notFound()

  // 2. Fetch Payout Account
  const { data: payoutAccount } = await supabaseAdmin
    .from('payout_accounts')
    .select('*')
    .eq('store_id', storeId)
    .single()

  // 3. Fetch Ledger
  const { data: transactions } = await supabaseAdmin
    .from('financial_transactions')
    .select('id, amount, transaction_type, status, created_at, description, order_id, orders(payment_reference)')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })

  let earned = 0
  let paid = 0
  let processing = 0

  if (transactions) {
    transactions.forEach(t => {
      if (t.transaction_type === 'product_sale') {
        earned += Number(t.amount)
      } else if (t.transaction_type === 'payout') {
        if (t.status === 'completed') {
          paid += Math.abs(Number(t.amount))
        } else if (t.status === 'pending') {
          processing += Math.abs(Number(t.amount))
        }
      }
    })
  }

  const pendingBalance = earned - paid - processing

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div>
        <Link href="/hq/payouts" className="text-blue-600 hover:underline text-sm font-semibold mb-4 inline-block">&larr; Back to Payouts</Link>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          {store.name} Ledger
        </h1>
        <p className="text-sm text-gray-500 mt-1">Detailed financial history and payout controls for {store.slug}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI CARDS */}
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <p className="text-sm font-semibold text-gray-500">Available to Payout</p>
            <p className="text-3xl font-black text-gray-900 mt-4">₦{pendingBalance.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <p className="text-sm font-semibold text-gray-500">Processing</p>
            <p className="text-2xl font-bold text-orange-600 mt-4">₦{processing.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <p className="text-sm font-semibold text-gray-500">Total Earned</p>
            <p className="text-xl font-bold text-gray-700 mt-4">₦{earned.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <p className="text-sm font-semibold text-gray-500">Total Paid Out</p>
            <p className="text-xl font-bold text-green-700 mt-4">₦{paid.toLocaleString()}</p>
          </div>
        </div>

        {/* BANK ACCOUNT & ACTION */}
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
            <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Active Bank Account
            </h3>
            {payoutAccount ? (
              <div className="text-sm space-y-1">
                <p className="font-semibold text-blue-900">{payoutAccount.account_name}</p>
                <p className="text-blue-800 font-mono">{payoutAccount.account_number}</p>
                <p className="text-blue-700">{payoutAccount.bank_code}</p>
              </div>
            ) : (
              <p className="text-sm text-red-600 font-semibold">No payout account configured.</p>
            )}
          </div>

          <InitiatePayoutForm storeId={storeId} maxAmount={pendingBalance} disabled={!payoutAccount || pendingBalance <= 0} />
        </div>
      </div>

      {/* LEDGER TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-8">
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Financial Ledger</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-100 font-medium text-gray-900">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Transaction</th>
                <th className="px-6 py-4">Reference</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(!transactions || transactions.length === 0) ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No transactions recorded.</td></tr>
              ) : (
                transactions.map((t: any) => {
                  const isCredit = t.transaction_type === 'product_sale'
                  const isPendingPayout = t.transaction_type === 'payout' && t.status === 'pending'
                  
                  return (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-xs font-medium text-gray-500">
                        {new Date(t.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 font-bold text-gray-900">
                          {isCredit ? <ArrowDownRight className="w-4 h-4 text-green-500" /> : <ArrowUpRight className="w-4 h-4 text-orange-500" />}
                          {t.transaction_type === 'product_sale' ? 'Sale Earning' : 'Payout'}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 font-mono truncate max-w-[200px]" title={t.id}>{t.id}</p>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {t.orders?.payment_reference ? (
                          <Link href={`/hq/orders?search=${t.orders.payment_reference}`} className="text-blue-600 hover:underline font-mono">
                            {t.orders.payment_reference}
                          </Link>
                        ) : (
                          <span className="text-gray-500 truncate max-w-[200px]" title={t.description}>{t.description || '-'}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {t.status === 'completed' && <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700">Completed</span>}
                        {t.status === 'pending' && (
                          <div className="flex items-center">
                            <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700">Pending</span>
                            {t.transaction_type === 'payout' && <CompletePayoutButton transactionId={t.id} />}
                          </div>
                        )}
                        {t.status === 'failed' && <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700">Failed</span>}
                      </td>
                      <td className={`px-6 py-4 text-right font-bold ${isCredit ? 'text-green-600' : isPendingPayout ? 'text-orange-600' : 'text-gray-900'}`}>
                        {isCredit ? '+' : '-'}₦{Math.abs(Number(t.amount)).toLocaleString()}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
