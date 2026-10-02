import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Truck, CreditCard, Store, User, CheckCircle2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const supabase = await createClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      stores (id, name, slug, profiles(full_name, email)),
      order_items (
        id,
        quantity,
        price_at_purchase,
        products (name, is_digital)
      )
    `)
    .eq('id', orderId)
    .single()

  if (error || !order) {
    notFound()
  }

  const deliveryAddress = order.delivery_address as any

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/hq/orders" className="p-2 rounded-full hover:bg-gray-200 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-mono text-sm">{order.payment_reference}</h1>
          <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${
            order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {order.payment_status}
          </span>
          <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-blue-100 text-blue-700">
            {order.fulfillment_status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-bold text-gray-900">Customer</h2>
          </div>
          <div className="space-y-2 text-sm">
            <p><span className="text-gray-500 w-24 inline-block">Name:</span> <span className="font-medium">{order.customer_name}</span></p>
            <p><span className="text-gray-500 w-24 inline-block">Email:</span> <span>{order.customer_email || 'N/A'}</span></p>
          </div>
        </div>

        {/* Store Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Store className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-bold text-gray-900">Store</h2>
          </div>
          <div className="space-y-2 text-sm">
            <p><span className="text-gray-500 w-24 inline-block">Store Name:</span> <span className="font-medium">{order.stores?.name}</span></p>
            <p><span className="text-gray-500 w-24 inline-block">Owner:</span> <span>{order.stores?.profiles?.full_name}</span></p>
            <p><span className="text-gray-500 w-24 inline-block">Email:</span> <span>{order.stores?.profiles?.email}</span></p>
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-bold text-gray-900">Payment</h2>
          </div>
          <div className="space-y-2 text-sm">
            <p><span className="text-gray-500 w-32 inline-block">Subtotal:</span> <span className="font-medium">₦{Number(order.product_subtotal).toLocaleString()}</span></p>
            <p><span className="text-gray-500 w-32 inline-block">Maji Fee:</span> <span>₦{Number(order.platform_fee).toLocaleString()}</span></p>
            <p><span className="text-gray-500 w-32 inline-block">Delivery Fee:</span> <span>₦{Number(order.delivery_fee).toLocaleString()}</span></p>
            <p><span className="text-gray-500 w-32 inline-block">Processing Fee:</span> <span>₦{Number(order.processing_fee).toLocaleString()}</span></p>
            <div className="border-t border-gray-100 pt-2 mt-2">
              <p><span className="text-gray-900 font-bold w-32 inline-block">Total Paid:</span> <span className="font-bold text-lg text-gray-900">₦{Number(order.total_amount).toLocaleString()}</span></p>
            </div>
            <p className="text-xs text-gray-400 mt-2">Paystack Fee: ₦{Number(order.paystack_fee).toLocaleString()}</p>
            <p className="text-xs text-gray-400">Seller Earnings: ₦{Number(order.seller_amount).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Order Items</h2>
          <div className="space-y-4">
            {(order.order_items as any[]).map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{item.products?.name}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity} × ₦{Number(item.price_at_purchase).toLocaleString()}</p>
                </div>
                <p className="font-bold text-gray-900">₦{(item.quantity * item.price_at_purchase).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery / Logistics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-bold text-gray-900">Delivery Information</h2>
          </div>
          
          <div className="space-y-4 text-sm">
            <div>
              <span className="text-gray-500 font-medium">Method:</span>{' '}
              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">{order.delivery_method}</span>
            </div>

            {order.delivery_method === 'delivery' && deliveryAddress && (
              <>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="font-medium mb-1">Customer Delivery Address:</p>
                  <p className="text-gray-600">
                    {[deliveryAddress.house_number, deliveryAddress.address, deliveryAddress.area, deliveryAddress.city, deliveryAddress.state].filter(Boolean).join(', ')}
                  </p>
                  {deliveryAddress.recipient_name && <p className="text-gray-500 mt-1">Contact: {deliveryAddress.recipient_name} ({deliveryAddress.recipient_phone})</p>}
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-3">FEZ Logistics Integration</h3>
                  <div className="space-y-2 mb-4">
                    <p><span className="text-gray-500 w-32 inline-block">Provider:</span> <span>{order.logistics_provider || 'Not assigned'}</span></p>
                    <p><span className="text-gray-500 w-32 inline-block">Tracking ID:</span> <span>{order.logistics_tracking_id || 'N/A'}</span></p>
                    <p><span className="text-gray-500 w-32 inline-block">Logistics Status:</span> <span>{order.logistics_status || 'Pending'}</span></p>
                  </div>
                  
                  {order.payment_status === 'paid' && !order.logistics_provider ? (
                    <button className="w-full py-2.5 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Authorize Delivery
                    </button>
                  ) : order.logistics_provider ? (
                    <div className="p-3 bg-green-50 text-green-800 rounded-lg border border-green-100 text-center text-sm font-medium">
                      Delivery Authorized
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
