import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Users, Store, TrendingUp, DollarSign } from 'lucide-react'
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
    { data: transactions }
  ] = await Promise.all([
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('stores').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabaseAdmin.from('financial_transactions').select('amount, transaction_type, created_at')
  ])

  // Calculate financials
  let gmv = 0
  let platformRevenue = 0

  const dailyData: Record<string, { date: string; revenue: number; gmv: number }> = {}

  if (transactions) {
    transactions.forEach(t => {
      const amount = Number(t.amount)
      if (t.transaction_type === 'product_sale') {
        gmv += amount
      } else if (t.transaction_type === 'platform_fee') {
        platformRevenue += amount
      }

      // Aggregate for charts (last 30 days roughly, just group by date string)
      const dateStr = new Date(t.created_at).toISOString().split('T')[0]
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = { date: dateStr, revenue: 0, gmv: 0 }
      }
      
      if (t.transaction_type === 'product_sale') dailyData[dateStr].gmv += amount
      if (t.transaction_type === 'platform_fee') dailyData[dateStr].revenue += amount
    })
  }

  // Sort chart data chronologically
  const chartData = Object.values(dailyData).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-30)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maji HQ</h1>
          <p className="text-gray-500 mt-1">Operational Command Center</p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total Users</p>
            <p className="text-3xl font-bold text-gray-900">{totalUsers?.toLocaleString() || 0}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Active Stores</p>
            <p className="text-3xl font-bold text-gray-900">{activeSellers?.toLocaleString() || 0}</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Store className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total GMV</p>
            <p className="text-3xl font-bold text-gray-900">₦{(gmv / 1000).toFixed(1)}k</p>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Platform Revenue</p>
            <p className="text-3xl font-bold text-gray-900">₦{(platformRevenue / 1000).toFixed(1)}k</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <DashboardCharts data={chartData} />
      </div>
    </div>
  )
}
