import { createClient as createAdminClient } from '@supabase/supabase-js'
import { ShieldCheck, Banknote, History, Wallet, AlertCircle, ArrowUpRight, Check, X, Building2, UserRoundCheck } from 'lucide-react'
import Link from 'next/link'
import { PayoutsClient } from './payouts-client'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function AdminPayoutsPage() {
  // 1. Fetch pending account change requests
  const { data: changeRequests } = await supabaseAdmin
    .from('payout_change_requests')
    .select('*, stores(name, slug)')
    .order('requested_at', { ascending: false })

  // 2. Fetch all financial transactions for ledger accounting
  const { data: transactions } = await supabaseAdmin
    .from('financial_transactions')
    .select('id, amount, transaction_type, status, created_at, description, order_id, store_id, stores(name, slug)')
    .order('created_at', { ascending: false })

  // 3. Process Financials
  const storeBalances: Record<string, { id: string, name: string, slug: string, earned: number, paid: number, pendingBalance: number, lastPayoutDate: string | null }> = {}
  
  let totalBalanceOwed = 0
  let totalPendingPayoutsAmount = 0
  let totalPaidOut = 0
  let payoutsThisMonth = 0
  let failedPayoutsCount = 0

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

  const payoutHistory: any[] = []

  if (transactions) {
    transactions.forEach(t => {
      const storeId = t.store_id
      if (!storeId || !t.stores) return
      
      const storeData = t.stores as any
      if (!storeBalances[storeId]) {
        storeBalances[storeId] = { 
          id: storeId, 
          name: storeData.name, 
          slug: storeData.slug, 
          earned: 0, 
          paid: 0, 
          pendingBalance: 0, 
          lastPayoutDate: null 
        }
      }

      if (t.transaction_type === 'product_sale') {
        storeBalances[storeId].earned += Number(t.amount)
      } 
      else if (t.transaction_type === 'payout') {
        payoutHistory.push(t)
        
        const payoutAmount = Math.abs(Number(t.amount))
        
        if (t.status === 'completed') {
          storeBalances[storeId].paid += payoutAmount
          totalPaidOut += payoutAmount
          
          if (new Date(t.created_at).getTime() >= thisMonthStart) {
            payoutsThisMonth += payoutAmount
          }
          
          if (!storeBalances[storeId].lastPayoutDate || new Date(t.created_at) > new Date(storeBalances[storeId].lastPayoutDate!)) {
            storeBalances[storeId].lastPayoutDate = t.created_at
          }
        } 
        else if (t.status === 'pending') {
          totalPendingPayoutsAmount += payoutAmount
        }
        else if (t.status === 'failed') {
          failedPayoutsCount++
        }
      }
    })
  }

  // Calculate pending balances per store
  let sellersAwaitingPayout = 0
  Object.values(storeBalances).forEach(b => {
    b.pendingBalance = b.earned - b.paid
    if (b.pendingBalance > 0) {
      totalBalanceOwed += b.pendingBalance
      sellersAwaitingPayout++
    }
  })

  // Format array for client sorting
  const sellerList = Object.values(storeBalances).sort((a, b) => b.pendingBalance - a.pendingBalance)
  const pendingRequests = changeRequests?.filter(r => r.status === 'pending') || []
  const resolvedRequests = changeRequests?.filter(r => r.status !== 'pending') || []

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Wallet className="w-6 h-6 text-blue-600" />
          Payouts Management
        </h1>
        <p className="text-sm text-gray-500 mt-1">Financial control center for seller balances and distributions</p>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <p className="text-sm font-semibold text-gray-500 flex items-center gap-2"><Building2 className="w-4 h-4" /> Total Balance Owed</p>
          <div className="mt-4">
            <p className="text-2xl font-black text-gray-900">₦{totalBalanceOwed.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">Across {sellersAwaitingPayout} sellers</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <p className="text-sm font-semibold text-gray-500 flex items-center gap-2"><Wallet className="w-4 h-4 text-orange-500" /> Processing Payouts</p>
          <div className="mt-4">
            <p className="text-2xl font-black text-gray-900">₦{totalPendingPayoutsAmount.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">Pending bank confirmation</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <p className="text-sm font-semibold text-gray-500 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-green-500" /> Total Paid Out</p>
          <div className="mt-4">
            <p className="text-2xl font-black text-gray-900">₦{totalPaidOut.toLocaleString()}</p>
            <p className="text-xs text-green-600 mt-1 font-medium">₦{payoutsThisMonth.toLocaleString()} this month</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <p className="text-sm font-semibold text-gray-500 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-red-500" /> Attention Needed</p>
          <div className="mt-4 flex flex-col gap-1">
            <p className="text-sm font-semibold text-gray-900">
              <span className="inline-flex items-center justify-center bg-red-100 text-red-700 w-5 h-5 rounded-full text-xs mr-2">{pendingRequests.length}</span> 
              Account changes
            </p>
            <p className="text-sm font-semibold text-gray-900">
              <span className="inline-flex items-center justify-center bg-red-100 text-red-700 w-5 h-5 rounded-full text-xs mr-2">{failedPayoutsCount}</span> 
              Failed payouts
            </p>
          </div>
        </div>
      </div>

      {/* CLIENT COMPONENT FOR TABS */}
      <PayoutsClient 
        sellers={sellerList} 
        payoutHistory={payoutHistory} 
        pendingRequests={pendingRequests}
        resolvedRequests={resolvedRequests}
      />
    </div>
  )
}
