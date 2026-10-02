import { createClient as createAdminClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ShoppingCart, Truck, CreditCard, Store, User, Box, Clock, ShieldCheck, MapPin } from 'lucide-react'
import { authorizeDelivery } from './actions'

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
      profiles (id, full_name, email, phone),
      stores (id, name, slug, phone, pickup_address, pickup_city, pickup_state, pickup_phone),
      order_items (
        id, quantity, price_at_purchase,
        products (id, name, is_digital)
      )
    `)
    .eq('id', orderId)
    .single()

  if (!order) notFound()

  // Transactions
  const { data: transactions } = await supabaseAdmin
    .from('financial_transactions')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })

  const deliveryAddr = order.delivery_address as any
  const store = order.stores as any
  const profile = order.profiles as any

  // Calculate Seller Amount (Product Subtotal - Maji Platform Fee)
  const sellerAmount = (Number(order.product_subtotal) || 0) - (Number(order.platform_fee) || 0)
  
  // Delivery State logic
  const canAuthorize = order.payment_status === 'paid' && (!order.logistics_status || order.logistics_status === 'awaiting_authorization')
  
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/hq/orders" className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              Order {order.payment_reference}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Operational Command Center</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Main Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* PRODUCT */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
              <Box className="w-5 h-5 text-gray-600" />
              <h3 className="font-bold text-gray-900 uppercase tracking-wide text-sm">Product</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3 font-medium">Product</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Price</th>
                    <th className="px-5 py-3 font-medium text-center">Qty</th>
                    <th className="px-5 py-3 font-medium text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.order_items?.map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-900">
                        <Link href={`/hq/products/${(item.products as any)?.id}`} className="hover:text-blue-600 hover:underline">
                          {(item.products as any)?.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                          {(item.products as any)?.is_digital ? 'Digital' : 'Physical'}
                        </span>
                      </td>
                      <td className="px-5 py-3">₦{Number(item.price_at_purchase).toLocaleString()}</td>
                      <td className="px-5 py-3 text-center">{item.quantity}</td>
                      <td className="px-5 py-3 text-right font-bold text-gray-900">₦{(Number(item.price_at_purchase) * item.quantity).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FINANCIALS & PAYMENT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* FINANCIALS */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
                <CreditCard className="w-5 h-5 text-green-600" />
                <h3 className="font-bold text-gray-900 uppercase tracking-wide text-sm">Financials</h3>
              </div>
              <div className="p-5 space-y-3 text-sm">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Product Subtotal</span>
                  <span className="font-medium text-gray-900">₦{Number(order.product_subtotal || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Delivery Fee</span>
                  <span className="font-medium text-gray-900">₦{Number(order.delivery_fee || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600 border-b border-dashed border-gray-200 pb-3">
                  <span>Processing Fee</span>
                  <span className="font-medium text-gray-900">₦{Number(order.processing_fee || 0).toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center text-gray-600 pt-1">
                  <span>Maji Platform Fee</span>
                  <span className="font-medium text-green-600">₦{Number(order.platform_fee || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600 pb-3 border-b border-dashed border-gray-200">
                  <span>Seller Amount (Subtotal - Platform Fee)</span>
                  <span className="font-medium text-blue-600">₦{sellerAmount.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center font-bold text-lg pt-1 text-gray-900">
                  <span>Total Paid</span>
                  <span>₦{Number(order.total_amount).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* PAYMENT */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 uppercase tracking-wide text-sm">Payment</h3>
              </div>
              <div className="p-5 space-y-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Status</p>
                  <span className={`inline-flex px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                    order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {order.payment_status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Paystack Reference</p>
                  <p className="font-mono text-gray-900 bg-gray-50 p-1.5 rounded border border-gray-100">{order.payment_reference}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Payment Date</p>
                  <p className="text-gray-900 font-medium">{new Date(order.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* DELIVERY (The Core FEZ Placeholder) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
              <Truck className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-gray-900 uppercase tracking-wide text-sm">Delivery</h3>
            </div>
            <div className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Method</p>
                  <p className="font-medium text-gray-900">{order.delivery_method}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Delivery Status</p>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    (!order.logistics_status || order.logistics_status === 'awaiting_authorization') ? 'bg-red-100 text-red-700' :
                    order.logistics_status === 'shipment_requested' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {(!order.logistics_status || order.logistics_status === 'awaiting_authorization') ? 'Awaiting Auth' : order.logistics_status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Provider</p>
                  <p className="font-medium text-gray-900">{order.logistics_provider || 'Not Assigned'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Tracking ID</p>
                  <p className="font-mono text-gray-900">{order.logistics_tracking_id || 'N/A'}</p>
                </div>
              </div>

              {order.delivery_method === 'delivery' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pickup */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" /> Pickup Address (Seller)
                    </h4>
                    {store?.pickup_address ? (
                      <div className="text-sm text-gray-600 space-y-1">
                        <p className="font-medium text-gray-900">{store.name}</p>
                        <p>{store.pickup_address}</p>
                        <p>{store.pickup_city}, {store.pickup_state}</p>
                        <p>Phone: {store.pickup_phone || store.phone || 'N/A'}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-red-600 font-medium">Missing seller pickup information.</p>
                    )}
                  </div>

                  {/* Drop-off */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-500" /> Drop-off Address (Buyer)
                    </h4>
                    {deliveryAddr ? (
                      <div className="text-sm text-gray-600 space-y-1">
                        <p className="font-medium text-gray-900">{profile?.full_name}</p>
                        <p>{[deliveryAddr.house_number, deliveryAddr.address].filter(Boolean).join(', ')}</p>
                        <p>{[deliveryAddr.area, deliveryAddr.city, deliveryAddr.state].filter(Boolean).join(', ')}</p>
                        <p>Phone: {deliveryAddr.recipient_phone || profile?.phone || 'N/A'}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-red-600 font-medium">Missing buyer delivery information.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Authorize Delivery Action */}
              {order.delivery_method === 'delivery' && (
                <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col items-start bg-indigo-50/50 p-4 rounded-lg border border-indigo-100">
                  <h4 className="font-bold text-indigo-900 mb-1">FEZ Logistics Integration (Pending)</h4>
                  <p className="text-sm text-indigo-700 mb-4 max-w-2xl">
                    Once authorized, this order will be automatically dispatched to FEZ Logistics for pickup. 
                    Maji will automatically transmit the seller's pickup location and buyer's drop-off location.
                  </p>
                  
                  {canAuthorize ? (
                    <form action={authorizeDelivery}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <button 
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors shadow-sm"
                      >
                        Authorize Delivery
                      </button>
                    </form>
                  ) : (
                    <button 
                      disabled
                      className="bg-gray-300 text-gray-500 font-bold py-2.5 px-6 rounded-lg cursor-not-allowed"
                    >
                      {order.payment_status !== 'paid' ? 'Cannot Authorize: Unpaid' : 'Delivery Already Authorized'}
                    </button>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>

        {/* Right/Side Column */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* ORDER INFO */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
              <Clock className="w-5 h-5 text-gray-600" />
              <h3 className="font-bold text-gray-900 uppercase tracking-wide text-sm">Order</h3>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Internal Reference</p>
                <p className="font-mono text-gray-900">{order.id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Created At</p>
                <p className="font-medium text-gray-900">{new Date(order.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Updated At</p>
                <p className="font-medium text-gray-900">{new Date(order.updated_at || order.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Fulfillment Status</p>
                <p className="font-medium text-gray-900 capitalize">{(order.fulfillment_status || 'pending').replace(/_/g, ' ')}</p>
              </div>
            </div>
          </div>

          {/* CUSTOMER */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
              <User className="w-5 h-5 text-gray-600" />
              <h3 className="font-bold text-gray-900 uppercase tracking-wide text-sm">Customer</h3>
            </div>
            <div className="p-5 space-y-3 text-sm">
              {profile ? (
                <>
                  <p className="font-bold text-gray-900 text-base">{profile.full_name || 'No Name'}</p>
                  <p className="text-gray-600">{profile.email}</p>
                  <p className="text-gray-600">{profile.phone || 'No phone provided'}</p>
                  <Link href={`/hq/users/${profile.id}`} className="inline-block mt-2 text-xs font-bold text-blue-600 uppercase tracking-wider hover:underline">
                    View Profile &rarr;
                  </Link>
                </>
              ) : (
                <p className="text-gray-500">Customer account deleted.</p>
              )}
            </div>
          </div>

          {/* SELLER */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
              <Store className="w-5 h-5 text-gray-600" />
              <h3 className="font-bold text-gray-900 uppercase tracking-wide text-sm">Seller</h3>
            </div>
            <div className="p-5 space-y-3 text-sm">
              {store ? (
                <>
                  <p className="font-bold text-gray-900 text-base">{store.name}</p>
                  <p className="font-mono text-gray-500">{store.slug}</p>
                  <p className="text-gray-600">{store.phone || 'No phone provided'}</p>
                  <Link href={`/hq/sellers/${store.id}`} className="inline-block mt-2 text-xs font-bold text-blue-600 uppercase tracking-wider hover:underline">
                    View Store &rarr;
                  </Link>
                </>
              ) : (
                <p className="text-gray-500">Store deleted.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
