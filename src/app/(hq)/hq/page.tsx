import { createClient } from '@/lib/supabase/server'
import DashboardCharts from './components/dashboard-charts'
import { Users, Store, Package, ShoppingCart, TrendingUp, DollarSign } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Execute queries in parallel
  const [
    { count: usersCount },
    { count: storesCount },
    { count: productsCount },
    { count: ordersCount },
    { data: financialStats },
    { data: recentOrders }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('stores').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('product_subtotal, platform_fee').eq('payment_status', 'paid'),
    supabase.from('orders').select('id, payment_reference, customer_name, total_amount, created_at, payment_status').order('created_at', { ascending: false }).limit(5)
  ])

  const gmv = financialStats?.reduce((sum, order) => sum + (Number(order.product_subtotal) || 0), 0) || 0
  const majiRevenue = financialStats?.reduce((sum, order) => sum + (Number(order.platform_fee) || 0), 0) || 0

  // Mock chart data for now, ideally group financialStats by date
  const chartData = [
    { date: 'Mon', sales: 12000 },
    { date: 'Tue', sales: 19000 },
    { date: 'Wed', sales: 15000 },
    { date: 'Thu', sales: 22000 },
    { date: 'Fri', sales: 28000 },
    { date: 'Sat', sales: 34000 },
    { date: 'Sun', sales: 41000 },
  ]

  const stats = [
    { label: 'Total Users', value: usersCount || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Total Stores', value: storesCount || 0, icon: Store, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Total Products', value: productsCount || 0, icon: Package, color: 'text-orange-600', bg: 'bg-orange-100' },
    { label: 'Total Orders', value: ordersCount || 0, icon: ShoppingCart, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Total GMV', value: `₦${gmv.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Maji Revenue', value: `₦${majiRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <div className="text-sm text-gray-500">Live statistics</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
              <div className={`p-4 rounded-full ${stat.bg} ${stat.color} mr-4`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900">Sales Overview (Last 7 Days)</h2>
          <DashboardCharts data={chartData} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Orders</h2>
          <div className="space-y-4">
            {recentOrders?.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">{order.customer_name || 'Anonymous'}</p>
                  <p className="text-xs text-gray-500">{order.payment_reference}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">₦{Number(order.total_amount).toLocaleString()}</p>
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {order.payment_status}
                  </span>
                </div>
              </div>
            ))}
            {!recentOrders?.length && (
              <div className="text-center py-8 text-sm text-gray-500">No orders yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
