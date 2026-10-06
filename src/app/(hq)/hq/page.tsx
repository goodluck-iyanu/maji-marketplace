import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Users, Store, TrendingUp, DollarSign, Package, Truck, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react'
import { DashboardCharts } from './components/dashboard-charts'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function AdminDashboardPage() {
  const [
    { count: totalUsers },
    { count: activeSellers },
    { data: transactions },
    { data: orders },
    { data: payoutAccounts }
  ] = await Promise.all([
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('stores').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabaseAdmin.from('financial_transactions').select('amount, transaction_type, created_at, status'),
    supabaseAdmin.from('orders').select('id, created_at, payment_status, fulfillment_status, logistics_status, total_amount, platform_fee, delivery_fee'),
    supabaseAdmin.from('payout_accounts').select('id, status')
  ])

  // Financials
  let grossProductSales = 0
  let majiPlatformFees = 0
  let customerDeliveryFees = 0
  let actualDeliveryCosts = 0 // Not fully implemented in schema yet, but logic is here
  let sellerAmounts = 0
  let refundedAmount = 0
  let pendingRefunds = 0

  const dailyData: Record<string, { date: string; revenue: number; gmv: number }> = {}

  if (transactions) {
    transactions.forEach(t => {
      const amount = Number(t.amount) || 0
      const date = new Date(t.created_at).toISOString().split('T')[0]
      if (!dailyData[date]) {
        dailyData[date] = { date, revenue: 0, gmv: 0 }
      }

      if (t.transaction_type === 'product_sale') {
        grossProductSales += amount
        dailyData[date].gmv += amount
      } else if (t.transaction_type === 'platform_fee') {
        majiPlatformFees += amount
        dailyData[date].revenue += amount
      } else if (t.transaction_type === 'delivery_fee') {
        customerDeliveryFees += amount
      } else if (t.transaction_type === 'actual_delivery_expense') {
        actualDeliveryCosts += amount
      } else if (t.transaction_type === 'refund' && t.status === 'cleared') {
        refundedAmount += Math.abs(amount)
      } else if (t.transaction_type === 'refund' && t.status === 'pending') {
        pendingRefunds += Math.abs(amount)
      } else if (t.transaction_type === 'payout') {
        // Just payouts, tracked elsewhere
      }
    })
  }
  
  sellerAmounts = grossProductSales - majiPlatformFees
  const deliveryMargin = customerDeliveryFees - actualDeliveryCosts

  const chartData = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date)).slice(-30)

  // Orders
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterdayStart = todayStart - 86400000

  let todaysOrders = 0
  let yesterdaysOrders = 0
  let paidOrders = 0
  let awaitingDeliveryProcessing = 0
  let deliveriesInProgress = 0
  let deliveredOrders = 0
  let failedDeliveries = 0

  if (orders) {
    orders.forEach(o => {
      const createdAt = new Date(o.created_at).getTime()
      if (createdAt >= todayStart) todaysOrders++
      else if (createdAt >= yesterdayStart && createdAt < todayStart) yesterdaysOrders++

      if (o.payment_status === 'paid') paidOrders++

      if (o.payment_status === 'paid' && (!o.logistics_status || o.logistics_status === 'awaiting_processing')) {
        awaitingDeliveryProcessing++
      } else if (o.logistics_status === 'dispatched' || o.logistics_status === 'assigned' || o.logistics_status === 'picked_up' || o.logistics_status === 'in_transit' || o.logistics_status === 'out_for_delivery') {
        deliveriesInProgress++
      } else if (o.logistics_status === 'delivered') {
        deliveredOrders++
      } else if (o.logistics_status === 'failed' || o.logistics_status === 'returned' || o.logistics_status === 'cancelled') {
        failedDeliveries++
      }
    })
  }

  // Sellers
  let verifiedSellers = 0
  let pendingPayoutVerification = 0
  let rejectedPayoutAccounts = 0

  if (payoutAccounts) {
    payoutAccounts.forEach(p => {
      if (p.status === 'verified') verifiedSellers++
      else if (p.status === 'pending_verification') pendingPayoutVerification++
      else if (p.status === 'rejected') rejectedPayoutAccounts++
    })
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Platform Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Real-time metrics across all marketplace activities</p>
      </div>

      {/* Primary Financials */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center text-sm font-medium text-gray-500 mb-4">
            <TrendingUp className="mr-2 h-4 w-4 text-blue-500" /> Gross Product Sales
          </div>
          <div className="text-2xl font-black text-gray-900">₦{grossProductSales.toLocaleString()}</div>
          <p className="text-xs text-gray-500 mt-1">Total value of products sold</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center text-sm font-medium text-gray-500 mb-4">
            <DollarSign className="mr-2 h-4 w-4 text-green-500" /> Maji Platform Fees
          </div>
          <div className="text-2xl font-black text-gray-900">₦{majiPlatformFees.toLocaleString()}</div>
          <p className="text-xs text-gray-500 mt-1">Maji Revenue (excluding delivery)</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center text-sm font-medium text-gray-500 mb-4">
            <Users className="mr-2 h-4 w-4 text-purple-500" /> Total Users
          </div>
          <div className="text-2xl font-black text-gray-900">{totalUsers || 0}</div>
          <p className="text-xs text-gray-500 mt-1">Registered accounts</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center text-sm font-medium text-gray-500 mb-4">
            <Store className="mr-2 h-4 w-4 text-orange-500" /> Active Sellers
          </div>
          <div className="text-2xl font-black text-gray-900">{activeSellers || 0}</div>
          <p className="text-xs text-gray-500 mt-1">Stores with products</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-12">
        <div className="md:col-span-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Revenue & GMV (Last 30 Days)</h2>
          <DashboardCharts data={chartData} />
        </div>

        {/* Secondary Metrics */}
        <div className="md:col-span-4 space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-500" /> Delivery Metrics
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">Collected from Buyers</span>
                <span className="font-bold">₦{customerDeliveryFees.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">Actual Delivery Cost</span>
                <span className="font-bold">₦{actualDeliveryCosts.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-gray-500">Delivery Margin</span>
                <span className={`font-bold ${deliveryMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {deliveryMargin > 0 ? '+' : ''}₦{deliveryMargin.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-500" /> Order Volume
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase">Today</p>
                <p className="text-xl font-bold">{todaysOrders}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Yesterday</p>
                <p className="text-xl font-bold">{yesterdaysOrders}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Paid</p>
                <p className="text-xl font-bold text-green-600">{paidOrders}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Needs Dispatch</p>
                <p className="text-xl font-bold text-red-600">{awaitingDeliveryProcessing}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-500" /> Payout Verifications
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-green-50 rounded p-2">
                <p className="text-lg font-bold text-green-700">{verifiedSellers}</p>
                <p className="text-[10px] uppercase text-green-600 font-bold">Verified</p>
              </div>
              <div className="bg-yellow-50 rounded p-2">
                <p className="text-lg font-bold text-yellow-700">{pendingPayoutVerification}</p>
                <p className="text-[10px] uppercase text-yellow-600 font-bold">Pending</p>
              </div>
              <div className="bg-red-50 rounded p-2">
                <p className="text-lg font-bold text-red-700">{rejectedPayoutAccounts}</p>
                <p className="text-[10px] uppercase text-red-600 font-bold">Rejected</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
