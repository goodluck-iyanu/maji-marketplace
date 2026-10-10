import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MajiLogo, MajiStorefrontBadge } from '@/components/brand/maji-brand'

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
  const isPaid = order.payment_status === 'paid'
  const logStatus = order.logistics_status || 'READY_FOR_DISPATCH'

  const orderStatuses = [
    { key: 'order_confirmed', label: 'Order Confirmed', description: 'Your order has been confirmed and the seller has been notified.' },
    { key: 'preparing', label: 'Preparing Order', description: 'The seller is preparing your order for dispatch.' },
    { key: 'ready_for_dispatch', label: 'Ready for Dispatch', description: 'Your order is ready and awaiting handover to our logistics partner.' },
    { key: 'picked_up', label: 'Picked Up', description: 'Our logistics partner has collected your order.' },
    { key: 'in_transit', label: 'In Transit', description: 'Your order is on the way to the delivery location.' },
    { key: 'out_for_delivery', label: 'Out for Delivery', description: 'Your order is out for delivery.' },
    { key: 'delivered', label: 'Delivered', description: 'Your order has been successfully delivered.' },
  ]

  const statusMap: Record<string, number> = {
    'READY_FOR_DISPATCH': 2,
    'awaiting_processing': 2,
    'awaiting_authorization': 2,
    'dispatched': 3,
    'PICKED_UP': 3,
    'IN_TRANSIT': 4,
    'OUT_FOR_DELIVERY': 5,
    'DELIVERED': 6
  }

  const currentIdx = statusMap[logStatus] || 2

  for (let i = 0; i < orderStatuses.length; i++) {
    const completed = isPaid && (i < currentIdx || (i === 6 && currentIdx === 6))
    const current = isPaid && i === currentIdx
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
      logistics_status, logistics_estimated_delivery, logistics_metadata, store_id,
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
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-sm border border-gray-200/80 p-8 text-center">
          <div className="w-16 h-16 bg-[#FAF8F5] border border-[#F05A28]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MajiLogo variant="symbol" colorway="ember-duotone-light" size={38} animation="pulse" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#111111] mb-2">Payment Pending</h1>
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
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Header */}
      <header className="bg-[#111111] text-white border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <MajiLogo variant="horizontal" colorway="ember-duotone-dark" size={32} />
          </Link>
          <span className="text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-white/10 text-gray-300">
            Order Tracking
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Order Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-gray-500">Order Reference</p>
              <p className="text-lg font-extrabold font-mono text-[#111111]">{order.payment_reference}</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Paid</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500">Date</p>
              <p className="text-sm font-semibold text-[#111111]">{new Date(order.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Store</p>
              <p className="text-sm font-semibold text-[#111111]">{store?.name || 'Maji Store'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-sm font-extrabold text-[#111111]">₦{Number(order.total_amount).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <p className="text-sm font-semibold text-[#F05A28] capitalize">{(order.fulfillment_status || 'processing').replace(/_/g, ' ')}</p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6 mb-6">
          <h2 className="text-lg font-extrabold text-[#111111] mb-4">Items Ordered</h2>
          <div className="space-y-4">
            {(order.order_items as any[]).map((item: any) => (
              <div key={item.id} className="flex justify-between items-start py-3 border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-bold text-[#111111]">{item.products?.name || 'Product'}</p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="font-extrabold text-[#111111]">₦{(item.price_at_purchase * item.quantity).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline — only for physical delivery */}
        {order.delivery_method === 'delivery' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6 mb-6">
            <h2 className="text-lg font-extrabold text-[#111111] mb-6">Order Status</h2>
            <div className="relative">
              {timeline.map((step, i) => (
                <div key={i} className="flex gap-4 mb-8 last:mb-0">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      step.completed ? 'bg-emerald-500 text-white' : step.current ? 'bg-[#F05A28] text-white animate-pulse shadow-md shadow-[#F05A28]/25' : 'bg-gray-200 text-gray-400'
                    }`}>
                      {step.completed ? '✓' : i + 1}
                    </div>
                    {i < timeline.length - 1 && (
                      <div className={`w-0.5 flex-1 mt-2 ${step.completed ? 'bg-emerald-300' : 'bg-gray-200'}`} />
                    )}
                  </div>
                  <div className="pt-1">
                    <p className={`font-bold ${step.completed || step.current ? 'text-[#111111]' : 'text-gray-400'}`}>{step.label}</p>
                    <p className={`text-sm mt-1 ${step.completed || step.current ? 'text-gray-600' : 'text-gray-400'}`}>{step.description}</p>
                    {step.timestamp && <p className="text-xs text-gray-400 mt-1">{new Date(step.timestamp).toLocaleString('en-NG')}</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* Logistics Section */}
            {order.logistics_status === 'dispatched' || order.logistics_metadata?.tracking_added_at ? (
              <div className="mt-6 p-4 bg-[#FAF8F5] rounded-xl border border-[#F05A28]/20">
                <h3 className="font-bold text-[#111111] mb-2">📦 Tracking Information</h3>
                <p className="text-sm text-gray-700 mb-3">Your order has been booked for delivery.</p>
                <div className="text-sm space-y-1">
                  <p><span className="text-gray-500 font-medium">Delivery Partner:</span> <span className="font-semibold text-[#111111]">{order.logistics_provider || 'Theyutes'}</span></p>
                  <p><span className="text-gray-500 font-medium">Tracking ID:</span> <span className="font-mono font-bold text-[#111111]">{order.logistics_tracking_id || order.logistics_metadata?.theyutes_shipment_id || 'N/A'}</span></p>
                  {order.logistics_estimated_delivery && <p><span className="text-gray-500 font-medium">ETA:</span> <span className="font-semibold text-[#111111]">{order.logistics_estimated_delivery}</span></p>}
                </div>
                {order.logistics_metadata?.theyutes_tracking_url && (
                  <div className="mt-4">
                    <a href={order.logistics_metadata.theyutes_tracking_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-[#F05A28] hover:underline">
                      View External Tracking →
                    </a>
                  </div>
                )}
                <p className="text-[10px] text-gray-400 mt-4 text-right">Tracking provided by {order.logistics_provider || 'Theyutes'}</p>
              </div>
            ) : (
              <div className="mt-6 p-4 bg-[#FAF8F5] rounded-xl border border-gray-200/80">
                <p className="text-sm text-[#111111]">
                  <span className="font-bold">📦 READY FOR DISPATCH</span>
                </p>
                <p className="text-sm text-gray-500 mt-2">Your order is ready for delivery and will be handed over to our logistics partner soon.</p>
              </div>
            )}
            {hasLogistics ? (
              <div className="mt-6 p-4 bg-[#FAF8F5] rounded-xl border border-[#F05A28]/20">
                <h3 className="font-bold text-[#111111] mb-2">📦 Logistics Tracking</h3>
                <div className="text-sm space-y-1">
                  <p><span className="text-gray-500 font-medium">Provider:</span> <span className="font-semibold text-[#111111]">{order.logistics_provider}</span></p>
                  <p><span className="text-gray-500 font-medium">Tracking ID:</span> <span className="font-mono font-bold text-[#111111]">{order.logistics_tracking_id}</span></p>
                  {order.logistics_status && <p><span className="text-gray-500 font-medium">Status:</span> <span className="font-semibold text-[#111111]">{order.logistics_status}</span></p>}
                </div>
              </div>
            ) : (
              <div className="mt-6 p-4 bg-[#FAF8F5] rounded-xl border border-gray-200/80">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">📦 Delivery tracking will become available once your order is handed over to our logistics partner.</span>
                </p>
                <p className="text-xs text-gray-400 mt-2">Real-time shipment tracking, courier details, and estimated delivery will appear here when logistics fulfillment begins.</p>
              </div>
            )}
          </div>
        )}

        {/* Delivery Address */}
        {addressStr && order.delivery_method === 'delivery' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6 mb-6">
            <h2 className="text-lg font-extrabold text-[#111111] mb-3">Delivery Address</h2>
            <p className="text-gray-700">{addressStr}</p>
            {deliveryAddr?.landmark && <p className="text-sm text-gray-500 mt-1">Landmark: {deliveryAddr.landmark}</p>}
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-8 flex flex-col items-center gap-3">
          <Link href="/" className="inline-block hover:opacity-85 transition-opacity">
            <MajiStorefrontBadge height={34} />
          </Link>
          <p className="text-sm text-gray-500">Need help? Contact <a href="mailto:support.hoberg@gmail.com" className="text-[#111111] font-bold hover:text-[#F05A28] transition-colors">support.hoberg@gmail.com</a></p>
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} Maji Marketplace</p>
        </div>
      </main>
    </div>
  )
}



