import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-theyutes-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }

    const secret = process.env.THEYUTES_WEBHOOK_SECRET
    if (!secret) {
      console.error('THEYUTES_WEBHOOK_SECRET is missing')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    // Verify signature
    const hash = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(rawBody)
    const { event: eventType, data } = event

    if (eventType === 'shipment.status_updated') {
      const trackingNumber = data.tracking_number || data.id
      const status = data.status // E.g., 'in_transit', 'delivered', 'failed'

      // Map Theyutes status to Maji status
      let internalStatus = 'dispatched'
      if (status === 'assigned') internalStatus = 'assigned'
      else if (status === 'picked_up') internalStatus = 'picked_up'
      else if (status === 'in_transit') internalStatus = 'in_transit'
      else if (status === 'out_for_delivery') internalStatus = 'out_for_delivery'
      else if (status === 'delivered') internalStatus = 'delivered'
      else if (status === 'failed' || status === 'cancelled' || status === 'returned') internalStatus = status

      // Update the order by tracking number
      if (trackingNumber) {
        await supabaseAdmin
          .from('orders')
          .update({ logistics_status: internalStatus })
          .eq('logistics_tracking_id', trackingNumber)
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Theyutes webhook error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
