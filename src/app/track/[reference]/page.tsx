import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface TimelineStep {
  label: string
  description: string
  completed: boolean
  current: boolean
  timestamp?: string
}

function getOrderTimeline(order: any): TimelineStep[] {
  const steps: TimelineStep[] = []
  const status = order.fulfillment_status || 'pending'
  const isPaid = order.payment_status === 'paid'

  // Maji order statuses (NOT logistics statuses)
  const orderStatuses = [
    { key: 'payment_received', label: 'Payment Received', description: 'Your payment has been successfully processed.' },
    { key: 'order_confirmed', label: 'Order Confirmed', description: 'Your order has been confirmed and the seller has been notified.' },
    { key: 'preparing', label: 'Preparing Order', description: 'The seller is preparing your order for dispatch.' },
    { key: 'awaiting_handover', label: 'Awaiting Delivery Handover', description: 'Your order is ready and awaiting handover to our logistics partner.' },
  ]

  // Map fulfillment_status to completed steps
  const statusOrder = ['pending', 'processing', 'preparing', 'ready_for_pickup', 'shipped', 'delivered']
  const currentIdx = statusOrder.indexOf(status)

  for (let i = 0; i < orderStatuses.length; i++) {
    const completed = isPaid && (
      (i === 0) || // payment_received
      (i === 1 && currentIdx >= 1) || // order_confirmed = processing+
      (i === 2 && currentIdx >= 2) || // preparing
      (i === 3 && currentIdx >= 3) // awaiting_handover = ready_for_pickup+
    )
    const current = isPaid && (
      (i === 0 && currentIdx === 0) ||
      (i === 1 && currentIdx === 1) ||
      (i === 2 && currentIdx === 2) ||
      (i === 3 && currentIdx >= 3)
    )
    steps.push({
      ...orderStatuses[i],
      completed: completed || false,
      current: current || false,
      timestamp: (i === 0 && isPaid) ? order.created_at : undefined,
    })
  }

  return steps
}

export default async function TrackOrderPage({
  params,
}: {
  params: Promise<{ reference: string }>
}) {
  const { reference } = await params

  // Validate reference format - must start with ORD-
  if (!reference || !reference.startsWith('ORD-')) {
    notFound()
  }

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      payment_reference,
      customer_name,
      payment_status,
      fulfillment_status,
      delivery_method,
      delivery_address,
      delivery_fee,
      total_amount,
      product_subtotal,
      platform_fee,
      processing_fee,
      created_at,
      confirmation_email_sent,
      logistics_provider,
      logistics_tracking_id,
      logistics_status,
      store_id,
      order_items(
        id,
        quantity,
        price_at_purchase,
        products(name, description, is_digital)
      )
    `)
    .eq('payment_reference', reference)
    .single()

  if (!order) notFound()

  // Only show tracking for paid orders
  if (order.payment_status !== 'paid') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm border p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⏳</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Payment Pending</h1>
          <p className="text-gray-500">This order has not been paid yet. Tracking will be available once payment is confirmed.</p>
          <p className="text-sm text-gray-400 mt-4 font-mono">{reference}</p>
        </div>
      </div>
    )
  }

  // Fetch store name
  const { data: store } = await supabaseAdmin
    .from('stores')
    .select('name, slug')
    .eq('id', order.store_id)
    .single()

  const timeline = getOrderTimeline(order)
  const deliveryAddr = order.delivery_address as any
  const addressStr = deliveryAddr
    ? [deliveryAddr.house_number, deliveryAddr.address, deliveryAddr.area, deliveryAddr.lga, deliveryAddr.city, deliveryAddr.state].filter(Boolean).join(', ')
    : null

  const hasLogistics = !!(order.logistics_provider && order.logistics_tracking_id)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black text-white">
        <div className="max-w-3xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="text-2xl font-extrabold tracking-tight">maji</Link>
          <span className="text-sm text-gray-400">Order Tracking</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Order Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-gray-500">Order Reference</p>
              <p className="text-lg font-bold font-mono text-gray-900">{order.payment_reference}</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Paid</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t">
            <div>
              <p className="text-xs text-gray-500">Date</p>
              <p className="text-sm font-medium">{new Date(order.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Store</p>
              <p className="text-sm font-medium">{store?.name || 'Maji Store'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-sm font-bold">₦{Number(order.total_amount).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <p className="text-sm font-medium capitalize">{(order.fulfillment_status || 'processing').replace(/_/g, ' ')}</p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Items Ordered</h2>
          <div className="space-y-4">
            {(order.order_items as any[]).map((item: any) => (
              <div key={item.id} className="flex justify-between items-start py-3 border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-semibold text-gray-900">{item.products?.name || 'Product'}</p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="font-bold text-gray-900">₦{(item.price_at_purchase * item.quantity).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline — only for physical delivery */}
        {order.delivery_method === 'delivery' && (
          <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-bold mb-6">Order Status</h2>
            <div className="relative">
              {timeline.map((step, i) => (
                <div key={i} className="flex gap-4 mb-8 last:mb-0">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      step.completed ? 'bg-green-500 text-white' : step.current ? 'bg-blue-500 text-white animate-pulse' : 'bg-gray-200 text-gray-400'
                    }`}>
                      {step.completed ? '✓' : i + 1}
                    </div>
                    {i < timeline.length - 1 && (
                      <div className={`w-0.5 flex-1 mt-2 ${step.completed ? 'bg-green-300' : 'bg-gray-200'}`} />
                    )}
                  </div>
                  <div className="pt-1">
                    <p className={`font-semibold ${step.completed || step.current ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                    <p className={`text-sm mt-1 ${step.completed || step.current ? 'text-gray-600' : 'text-gray-400'}`}>{step.description}</p>
                    {step.timestamp && <p className="text-xs text-gray-400 mt-1">{new Date(step.timestamp).toLocaleString('en-NG')}</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* Logistics Section — placeholder for Theyutes integration */}
            {hasLogistics ? (
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <h3 className="font-semibold text-blue-900 mb-2">📦 Logistics Tracking</h3>
                <div className="text-sm space-y-1">
                  <p><span className="text-blue-700">Provider:</span> {order.logistics_provider}</p>
                  <p><span className="text-blue-700">Tracking ID:</span> <span className="font-mono">{order.logistics_tracking_id}</span></p>
                  {order.logistics_status && <p><span className="text-blue-700">Status:</span> {order.logistics_status}</p>}
                </div>
              </div>
            ) : (
              <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">📦 Delivery tracking will become available once your order is handed over to our logistics partner.</span>
                </p>
                <p className="text-xs text-gray-400 mt-2">Real-time shipment tracking, courier details, and estimated delivery will appear here when logistics fulfillment begins.</p>
              </div>
            )}
          </div>
        )}

        {/* Delivery Address */}
        {addressStr && order.delivery_method === 'delivery' && (
          <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-bold mb-3">Delivery Address</h2>
            <p className="text-gray-700">{addressStr}</p>
            {deliveryAddr?.landmark && <p className="text-sm text-gray-500 mt-1">Landmark: {deliveryAddr.landmark}</p>}
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">Need help? Contact <a href="mailto:support.hoberg@gmail.com" className="text-black font-medium hover:underline">support.hoberg@gmail.com</a></p>
          <p className="text-xs text-gray-400 mt-2">© {new Date().getFullYear()} Maji Marketplace</p>
        </div>
      </main>
    </div>
  )
}
