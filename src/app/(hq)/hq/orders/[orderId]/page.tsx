import { createClient as createAdminClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ShoppingCart, Truck, CreditCard, Store, User, Box, Clock, ShieldCheck, MapPin } from 'lucide-react'
import { dispatchDelivery } from './actions'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params

  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select('*, order_items(*, products(*)), stores(*)')
    .eq('id', orderId)
    .single()

  if (error || !order) notFound()

  // Fetch financial timeline
  const { data: timeline } = await supabaseAdmin
    .from('financial_transactions')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })

  const deliveryAddr = order.delivery_address as any
  const deliveryQuote = order.delivery_quote as any
  const store = order.stores as any

  // Delivery State logic
  const canDispatch = order.payment_status === 'paid' && (!order.logistics_status || order.logistics_status === 'awaiting_processing' || order.logistics_status === 'awaiting_authorization')

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/hq/orders" className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center mb-3">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Orders
          </Link>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-blue-600" />
            Order {order.payment_reference || order.id.slice(0, 8)}
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Placed on {new Date(order.created_at).toLocaleString()}</p>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <span className={`px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-wider ${order.payment_status === 'paid' ? 'bg-green-100 text-green-800 border-2 border-green-200' : 'bg-yellow-100 text-yellow-800 border-2 border-yellow-200'}`}>
            Payment: {order.payment_status}
          </span>
          <span className={`px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-wider ${order.fulfillment_status === 'processing' ? 'bg-blue-100 text-blue-800 border-2 border-blue-200' : 'bg-gray-100 text-gray-800 border-2 border-gray-200'}`}>
            Status: {order.fulfillment_status || 'Pending'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Order Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* ITEMS */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
              <Box className="w-5 h-5 text-gray-600" />
              <h3 className="font-bold text-gray-900 uppercase tracking-wide text-sm">Products</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {order.order_items.map((item: any) => (
                <div key={item.id} className="p-5 flex gap-4 items-start hover:bg-gray-50 transition-colors">
                  {item.products?.images?.[0] && (
  <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
    <img src={item.products.images[0]} alt={item.products.name} className="w-full h-full object-cover" />
  </div>
)}
<div className="flex-1">
  <p className="font-bold text-gray-900 text-lg">{item.products?.name || "Unknown Product"}</p>
  <p className="text-gray-500 text-sm mt-1">{item.products?.is_digital ? "?? Digital Product" : "?? Physical Product"}</p>
</div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-lg">₦{Number(item.price_at_purchase * item.quantity).toLocaleString()}</p>
                    <p className="text-gray-500 text-sm mt-1">{item.quantity} × ₦{Number(item.price_at_purchase).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DELIVERY */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
              <Truck className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-gray-900 uppercase tracking-wide text-sm">Delivery & Logistics</h3>
            </div>
            <div className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Method</p>
                  <p className="font-medium text-gray-900">{order.delivery_method}</p>
</div>
<div>
  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Total Est. Weight</p>
  <p className="font-medium text-gray-900">{order.order_items.reduce((acc: number, item: any) => acc + ((item.products?.weight_kg || 0) * item.quantity), 0)} kg</p>
</div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Logistics Status</p>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    (!order.logistics_status || order.logistics_status === 'awaiting_processing') ? 'bg-red-100 text-red-700' :
                    order.logistics_status === 'dispatched' ? 'bg-blue-100 text-blue-700' :
                    order.logistics_status === 'delivered' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.logistics_status || 'Awaiting Processing'}
                  </span>
                </div>
                {order.logistics_tracking_id && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Tracking Number</p>
                    <p className="font-mono text-gray-900">{order.logistics_tracking_id}</p>
                  </div>
                )}
              </div>

              {order.delivery_method === 'delivery' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pickup */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Store className="w-4 h-4 text-gray-500" /> Pickup Address (Seller)
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p className="font-medium text-gray-900">{store?.name}</p>
                      <p>{[store?.pickup_house_number, store?.pickup_address].filter(Boolean).join(', ')}</p>
                      <p>{[store?.pickup_area, store?.pickup_city, store?.pickup_state].filter(Boolean).join(', ')}</p>
                      <p>Phone: {store?.pickup_phone || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Dropoff */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-500" /> Drop-off Address (Buyer)
                    </h4>
                    {deliveryAddr ? (
                      <div className="text-sm text-gray-600 space-y-1">
                        <p className="font-medium text-gray-900">{order.customer_name}</p>
                        <p>{[deliveryAddr.house_number, deliveryAddr.address].filter(Boolean).join(', ')}</p>
                        <p>{[deliveryAddr.area, deliveryAddr.city, deliveryAddr.state].filter(Boolean).join(', ')}</p>
                        <p>Phone: {deliveryAddr.recipient_phone || order.customer_phone || 'N/A'}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-red-600 font-medium">Missing buyer delivery information.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Arrange Delivery Action */}
              {order.delivery_method === 'delivery' && (
                <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col items-start bg-indigo-50/50 p-4 rounded-lg border border-indigo-100">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-bold text-indigo-900">Theyutes Logistics Integration</h4>
                    {deliveryQuote && <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded font-mono">Quote: {deliveryQuote.quoteId || 'Attached'}</span>}
                  </div>
                  <p className="text-sm text-indigo-700 mb-4 max-w-2xl">
                    Delivery was quoted at ₦{Number(order.delivery_fee).toLocaleString()} for the customer. Click below to officially dispatch this order via Theyutes.
                  </p>
                  
                  {canDispatch ? (
                    <form action={dispatchDelivery}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <button 
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors shadow-sm"
                      >
                        Arrange Delivery
                      </button>
                    </form>
                  ) : (
                    <button 
                      disabled
                      className="bg-gray-300 text-gray-500 font-bold py-2.5 px-6 rounded-lg cursor-not-allowed"
                    >
                      {order.payment_status !== 'paid' ? 'Cannot Dispatch: Unpaid' : 'Delivery Already Dispatched'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Financials & People */}
        <div className="space-y-6">
          
          {/* FINANCIAL SUMMARY */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
              <CreditCard className="w-5 h-5 text-green-600" />
              <h3 className="font-bold text-gray-900 uppercase tracking-wide text-sm">Financials</h3>
            </div>
            <div className="p-5">
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Product Subtotal</span>
                  <span className="font-medium text-gray-900">₦{Number(order.product_subtotal || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600 border-b border-dashed border-gray-200 pb-3">
                  <span>Delivery Fee</span>
                  <span className="font-medium text-gray-900">₦{Number(order.delivery_fee || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center font-bold text-lg text-gray-900">
                  <span>Customer Paid Total</span>
                  <span>₦{Number(order.total_amount).toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-100 mb-4">
                <h4 className="text-xs font-bold text-green-800 uppercase tracking-wider mb-2">Internal Split</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center text-green-900">
                    <span>Seller Product Split</span>
                    <span className="font-bold">₦{Number(order.seller_amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-green-900">
                    <span>Maji Platform Fee</span>
                    <span className="font-bold">₦{Number(order.platform_fee || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-green-900">
                    <span>Customer Delivery Fee</span>
                    <span className="font-bold">₦{Number(order.delivery_fee || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {timeline && timeline.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Ledger Entries</h4>
                  <div className="space-y-3">
                    {timeline.map(tx => (
                      <div key={tx.id} className="flex justify-between text-xs">
                        <span className="text-gray-500 truncate" title={tx.description}>{tx.transaction_type}</span>
                        <span className={`font-mono ${Number(tx.amount) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {Number(tx.amount) > 0 ? '+' : ''}{Number(tx.amount).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* PEOPLE */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
              <User className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-gray-900 uppercase tracking-wide text-sm">People</h3>
            </div>
            <div className="p-5 space-y-6">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Customer</p>
                <p className="font-bold text-gray-900">{order.customer_name}</p>
                <p className="text-sm text-gray-600">{order.customer_email}</p>
                <p className="text-sm text-gray-600">{order.customer_phone}</p>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Seller Store</p>
                <p className="font-bold text-gray-900">{store?.name}</p>
                <Link href={`/hq/sellers/${store?.id}`} className="text-sm text-blue-600 hover:underline">View Store Details</Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}



