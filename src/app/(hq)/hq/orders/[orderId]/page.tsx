import { createClient as createAdminClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ShoppingCart, Truck, CreditCard, Store, User, Box, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select(`
      *,
      profiles (id, full_name, email),
      stores (id, name, slug),
      order_items (
        id, quantity, price_at_purchase,
        products (id, name, is_digital)
      )
    `)
    .eq('id', orderId)
    .single()

  if (!order) notFound()

  // Fetch related financial transactions
  const { data: transactions } = await supabaseAdmin
    .from('financial_transactions')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })

  const deliveryAddr = order.delivery_address as any

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/hq/orders" className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              Order {order.payment_reference}
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {order.payment_status}
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">Placed on {new Date(order.created_at).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center gap-2">
              <Box className="w-5 h-5 text-gray-500" />
              <h3 className="font-bold text-gray-900">Order Items</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-900 font-medium">
                  <tr>
                    <th className="px-5 py-3">Product</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Price</th>
                    <th className="px-5 py-3 text-center">Qty</th>
                    <th className="px-5 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.order_items?.map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-900">
                        <Link href={`/hq/products/${item.products.id}`} className="hover:text-blue-600 hover:underline">
                          {item.products.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                          {item.products.is_digital ? 'Digital' : 'Physical'}
                        </span>
                      </td>
                      <td className="px-5 py-3">₦{Number(item.price_at_purchase).toLocaleString()}</td>
                      <td className="px-5 py-3 text-center">{item.quantity}</td>
                      <td className="px-5 py-3 text-right font-medium">₦{(Number(item.price_at_purchase) * item.quantity).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-600" />
              <h3 className="font-bold text-gray-900">Financial Breakdown</h3>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Product Subtotal</span>
                  <span className="font-medium text-gray-900">₦{Number(order.product_subtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Delivery Fee</span>
                  <span className="font-medium text-gray-900">₦{Number(order.delivery_fee || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Processing Fee</span>
                  <span className="font-medium text-gray-900">₦{Number(order.processing_fee || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600 border-b border-dashed pb-3">
                  <span>Maji Platform Fee (Revenue)</span>
                  <span className="font-medium text-green-600">₦{Number(order.platform_fee || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center font-bold text-lg pt-1">
                  <span>Total Paid</span>
                  <span>₦{Number(order.total_amount).toLocaleString()}</span>
                </div>
              </div>

              {/* Transactions Ledger View */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Ledger Entries</h4>
                {(!transactions || transactions.length === 0) ? (
                  <p className="text-xs text-gray-400">No ledger entries created yet.</p>
                ) : (
                  <div className="space-y-2">
                    {transactions.map(t => (
                      <div key={t.id} className="flex justify-between items-center text-xs">
                        <span className="text-gray-600 uppercase">{t.transaction_type.replace(/_/g, ' ')}</span>
                        <span className="font-medium text-gray-900">₦{Number(t.amount).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Architecture Preparedness */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-gray-900">Fulfillment & Delivery</h3>
            </div>
            <div className="p-5">
              <div className="mb-4">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 uppercase tracking-wider">
                  Method: {order.delivery_method}
                </span>
                <span className="ml-2 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 uppercase tracking-wider">
                  Status: {(order.fulfillment_status || 'pending').replace(/_/g, ' ')}
                </span>
              </div>
              
              {order.delivery_method === 'delivery' && deliveryAddr && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="text-sm">
                    <p className="font-semibold text-gray-900 mb-1">Destination Address</p>
                    <p className="text-gray-600">
                      {[deliveryAddr.house_number, deliveryAddr.address, deliveryAddr.area, deliveryAddr.city, deliveryAddr.state].filter(Boolean).join(', ')}
                    </p>
                    {deliveryAddr.landmark && <p className="text-gray-500 mt-1 italic">Landmark: {deliveryAddr.landmark}</p>}
                  </div>
                  <div className="text-sm p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-semibold text-gray-900 mb-2">Logistics Integration (Ready)</p>
                    <p className="text-gray-600 mb-1"><span className="text-gray-400">Provider:</span> {order.logistics_provider || 'Pending'}</p>
                    <p className="text-gray-600 mb-1"><span className="text-gray-400">Tracking:</span> {order.logistics_tracking_id || 'Pending'}</p>
                    <p className="text-gray-600"><span className="text-gray-400">Status:</span> {order.logistics_status || 'Pending'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: People */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-gray-400" /> Customer
            </h3>
            {order.profiles ? (
              <div>
                <p className="font-medium text-gray-900">{order.profiles.full_name || 'No Name'}</p>
                <p className="text-sm text-gray-500 mb-3">{order.profiles.email}</p>
                <Link href={`/hq/users/${order.profiles.id}`} className="text-xs font-bold text-blue-600 hover:underline uppercase tracking-wider">
                  View Profile &rarr;
                </Link>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Customer account deleted.</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Store className="w-5 h-5 text-gray-400" /> Seller
            </h3>
            {order.stores ? (
              <div>
                <p className="font-medium text-gray-900">{order.stores.name}</p>
                <p className="text-sm text-gray-500 font-mono mb-3">{order.stores.slug}</p>
                <Link href={`/hq/sellers/${order.stores.id}`} className="text-xs font-bold text-blue-600 hover:underline uppercase tracking-wider">
                  View Store &rarr;
                </Link>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Store deleted.</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-gray-400" /> Timeline
            </h3>
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white bg-green-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10"></div>
                <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] p-3 rounded bg-white border border-gray-100 shadow-sm ml-4 md:ml-0 md:mr-4 md:group-odd:ml-4 md:group-odd:mr-0">
                  <p className="text-sm font-bold text-gray-900">Order Placed</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(order.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
