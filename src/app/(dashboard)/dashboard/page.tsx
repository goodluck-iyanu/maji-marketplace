import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Package, ShoppingCart, DollarSign, Plus } from 'lucide-react'
import { OnboardingBanner } from '../components/onboarding-banner'
import { MajiLogo } from '@/components/brand/maji-brand'

export const dynamic = 'force-dynamic'

export default async function DashboardOverview() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: store } = await supabase
    .from('stores')
    .select('id, name, slug')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!store) {
    redirect('/onboarding')
  }

  // Get quick stats
  const { count: productCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', store.id)

  const { data: payoutAccount } = await supabase
    .from('payout_accounts')
    .select('id')
    .eq('store_id', store.id)
    .single()

  const { data: allOrders } = await supabase
    .from('orders')
    .select('*, order_items(*, products(name))')
    .eq('store_id', store!.id)
    .eq('payment_status', 'paid')
    .order('created_at', { ascending: false })

  const orders = allOrders || []

  // Calculate revenue from paid orders only (using product_subtotal to exclude delivery/platform fees, falling back to total_amount for old orders)
  const totalRevenue = orders.reduce(
    (sum, order) =>
      sum +
      (order.product_subtotal !== null && order.product_subtotal > 0
        ? Number(order.product_subtotal)
        : Number(order.total_amount)),
    0
  )

  // Get total unique paid orders for count
  const paidOrderCount = orders.length

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <OnboardingBanner
        hasBank={!!payoutAccount}
        hasProduct={(productCount || 0) > 0}
        storeSlug={store.slug}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
            Welcome back, {store!.name}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Here is what’s happening across your Maji storefront today.
          </p>
        </div>
        <Link
          href="/dashboard/products/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#111111] text-white text-sm font-semibold hover:bg-[#F05A28] transition-colors self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-[#111111]/[0.07] shadow-2xs flex items-center transition-all hover:border-[#F05A28]/35">
          <div className="h-12 w-12 bg-[#FAF8F5] border border-[#111111]/[0.06] text-[#111111] rounded-2xl flex items-center justify-center mr-4 shrink-0">
            <Package className="h-5 w-5 text-[#F05A28]" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Products
            </p>
            <p className="text-2xl font-bold text-[#111111] mt-0.5">{productCount || 0}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#111111]/[0.07] shadow-2xs flex items-center transition-all hover:border-[#F05A28]/35">
          <div className="h-12 w-12 bg-[#FAF8F5] border border-[#111111]/[0.06] text-[#111111] rounded-2xl flex items-center justify-center mr-4 shrink-0">
            <ShoppingCart className="h-5 w-5 text-[#F05A28]" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Paid Orders
            </p>
            <p className="text-2xl font-bold text-[#111111] mt-0.5">{paidOrderCount}</p>
          </div>
        </div>

        <div className="bg-[#111111] text-white p-6 rounded-3xl border border-[#111111] shadow-sm flex items-center">
          <div className="h-12 w-12 bg-[#F05A28] text-white rounded-2xl flex items-center justify-center mr-4 shrink-0">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Total Revenue
            </p>
            <p className="text-2xl font-bold text-white mt-0.5">
              ₦{totalRevenue.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#111111]/[0.07] shadow-2xs overflow-hidden mt-8">
        <div className="px-6 py-4.5 border-b border-neutral-100 flex justify-between items-center">
          <h2 className="text-base font-bold text-[#111111]">Recent Orders</h2>
          <span className="text-xs font-medium text-neutral-400">
            {paidOrderCount} paid {paidOrderCount === 1 ? 'order' : 'orders'}
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16 px-4 text-neutral-500 flex flex-col items-center">
            <div className="h-16 w-16 rounded-2xl bg-[#FAF8F5] border border-[#111111]/[0.06] flex items-center justify-center mb-4">
              <MajiLogo
                variant="symbol"
                colorway="ember-duotone-light"
                size={38}
                animation="rocker"
              />
            </div>
            <p className="text-base font-bold text-[#111111]">No orders yet</p>
            <p className="text-sm text-neutral-500 mt-1 max-w-xs">
              When customers buy from your Maji storefront, their orders will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-neutral-500 uppercase bg-[#FAF8F5] border-b border-neutral-100">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Customer</th>
                  <th className="px-6 py-3.5 font-semibold">Items</th>
                  <th className="px-6 py-3.5 font-semibold">Amount</th>
                  <th className="px-6 py-3.5 font-semibold">Date &amp; Time</th>
                  <th className="px-6 py-3.5 font-semibold">Status</th>
                  <th className="px-6 py-3.5 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {orders.map((order: any) => (
                  <tr
                    key={order.id}
                    className="hover:bg-[#FAF8F5]/70 transition-colors group relative"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-[#111111] group-hover:text-[#F05A28] transition-colors">
                        {order.customer_name}
                      </p>
                      <p className="text-xs text-neutral-500">{order.customer_email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <ul className="list-disc list-inside text-neutral-600 space-y-1">
                        {order.order_items?.map((item: any) => (
                          <li key={item.id} className="truncate max-w-[200px]">
                            <span className="font-semibold text-[#111111]">
                              {item.quantity}x
                            </span>{' '}
                            {item.products?.name}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-6 py-4 font-bold text-[#111111]">
                      ₦
                      {(order.product_subtotal !== null && order.product_subtotal > 0
                        ? Number(order.product_subtotal)
                        : Number(order.total_amount)
                      ).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-neutral-600">
                      <p>{new Date(order.created_at).toLocaleDateString()}</p>
                      <p className="text-xs text-neutral-400">
                        {new Date(order.created_at).toLocaleTimeString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {order.payment_status === 'paid' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="inline-flex items-center px-3.5 py-1.5 border border-neutral-200 text-xs font-semibold rounded-xl text-[#111111] bg-white hover:bg-[#111111] hover:text-white hover:border-[#111111] transition-colors"
                      >
                        View
                      </Link>
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
