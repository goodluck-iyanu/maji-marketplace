import { createClient as createAdminClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Store, Package, ShoppingCart, DollarSign, MapPin, Power, Calendar } from 'lucide-react'
import { toggleStoreStatus } from './actions'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function AdminSellerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // 1. Fetch Store and Owner
  const { data: store } = await supabaseAdmin
    .from('stores')
    .select(`
      *,
      profiles (id, full_name, email, created_at)
    `)
    .eq('id', id)
    .single()

  if (!store) notFound()

  // 2. Fetch basic counts and sums
  const [{ count: productCount }, { count: orderCount }, { data: transactions }] = await Promise.all([
    supabaseAdmin.from('products').select('*', { count: 'exact', head: true }).eq('store_id', id),
    supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }).eq('store_id', id),
    supabaseAdmin.from('financial_transactions').select('amount, transaction_type').eq('store_id', id)
  ])

  // Calculate earnings vs payouts
  const totalEarnings = transactions?.filter(t => t.transaction_type === 'product_sale').reduce((sum, t) => sum + Number(t.amount), 0) || 0
  const totalPaidOut = transactions?.filter(t => t.transaction_type === 'payout').reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0
  const pendingBalance = totalEarnings - totalPaidOut

  // 3. Fetch recent products
  const { data: recentProducts } = await supabaseAdmin
    .from('products')
    .select('id, name, price, is_published, created_at')
    .eq('store_id', id)
    .order('created_at', { ascending: false })
    .limit(5)

  // 4. Fetch recent orders
  const { data: recentOrders } = await supabaseAdmin
    .from('orders')
    .select('id, payment_reference, total_amount, payment_status, created_at')
    .eq('store_id', id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/hq/sellers" className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Store Profile</h1>
        </div>
        
        {/* Toggle Status Action */}
        <form action={toggleStoreStatus}>
          <input type="hidden" name="storeId" value={store.id} />
          <input type="hidden" name="currentStatus" value={store.is_active ? 'true' : 'false'} />
          <button 
            type="submit"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
              store.is_active 
                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
                : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
            }`}
          >
            <Power className="w-4 h-4" />
            {store.is_active ? 'Suspend Store' : 'Activate Store'}
          </button>
        </form>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Products</p>
            <p className="text-2xl font-bold text-gray-900">{productCount || 0}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center shrink-0">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Orders</p>
            <p className="text-2xl font-bold text-gray-900">{orderCount || 0}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Earnings</p>
            <p className="text-2xl font-bold text-gray-900">₦{totalEarnings.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Pending Balance</p>
            <p className="text-2xl font-bold text-gray-900">₦{pendingBalance.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Store Details */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
                <Store className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{store.name}</h2>
              <p className="text-sm text-gray-500 font-mono mt-1">{store.slug}</p>
              
              <div className="flex gap-2 mt-4">
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  store.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {store.is_active ? 'Active' : 'Suspended'}
                </span>
                <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                  {store.product_type}
                </span>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase mb-1">Owner</p>
                <Link href={`/hq/users/${store.profiles.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                  {store.profiles.full_name || 'No Name'} ({store.profiles.email})
                </Link>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase mb-1">Category</p>
                <p className="text-sm font-medium text-gray-900">{store.store_category || 'Uncategorized'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase mb-1">Joined</p>
                <p className="text-sm font-medium text-gray-900">{new Date(store.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {store.product_type === 'physical' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <h3 className="font-bold text-gray-900 text-sm">Pickup Details</h3>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="text-sm font-medium text-gray-900">
                    {[store.pickup_house_number, store.pickup_address, store.pickup_area, store.pickup_city, store.pickup_state, store.pickup_zip].filter(Boolean).join(', ') || 'Not provided'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{store.pickup_phone || 'Not provided'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Tables */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Recent Orders */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-purple-600" /> Recent Orders
              </h3>
              <Link href={`/hq/orders?q=${store.name}`} className="text-xs font-bold text-blue-600 uppercase tracking-wider hover:underline">
                View All
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-900 font-medium">
                  <tr>
                    <th className="px-5 py-3">Order Ref</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrders?.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <Link href={`/hq/orders/${order.id}`} className="font-mono text-blue-600 hover:underline">
                          {order.payment_reference}
                        </Link>
                      </td>
                      <td className="px-5 py-3 font-medium text-gray-900">
                        ₦{Number(order.total_amount).toLocaleString()}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-xs">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {(!recentOrders || recentOrders.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-gray-500">No orders yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Products */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" /> Recent Products
              </h3>
              <Link href={`/hq/products?q=${store.name}`} className="text-xs font-bold text-blue-600 uppercase tracking-wider hover:underline">
                View All
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-900 font-medium">
                  <tr>
                    <th className="px-5 py-3">Product</th>
                    <th className="px-5 py-3">Price</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentProducts?.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-900">
                        <Link href={`/hq/products/${product.id}`} className="hover:text-blue-600 hover:underline">
                          {product.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3">₦{Number(product.price).toLocaleString()}</td>
                      <td className="px-5 py-3">
                        {product.is_published ? (
                          <span className="text-green-600 font-medium text-xs">Published</span>
                        ) : (
                          <span className="text-gray-500 font-medium text-xs">Draft</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!recentProducts || recentProducts.length === 0) && (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-gray-500">No products found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
