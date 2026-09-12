import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

// We use the admin client (service_role) because webhooks come from outside 
// and need to bypass RLS to update orders.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-paystack-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }

    // Verify signature
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
      .update(rawBody)
      .digest('hex')

    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(rawBody)

    // Handle successful payment
    if (event.event === 'charge.success') {
      const reference = event.data.reference

      // 1. Get the pending order
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('payment_reference', reference)
        .single()

      if (!order) {
        // Order not found, ignore
        return NextResponse.json({ status: 'ignored', message: 'Order not found' })
      }

      // Idempotency check
      if (order.payment_status === 'paid') {
        return NextResponse.json({ status: 'success', message: 'Order already paid' })
      }

      // 2. Validate amount. Paystack amount is in kobo.
      const paidAmount = event.data.amount / 100
      if (paidAmount < order.total_amount) {
         // Paid less than required
         await supabaseAdmin
           .from('orders')
           .update({ payment_status: 'failed', fulfillment_status: 'cancelled' })
           .eq('id', order.id)
           
         return NextResponse.json({ status: 'success', message: 'Invalid amount paid' })
      }

      // 3. Mark as paid
      await supabaseAdmin
        .from('orders')
        .update({ 
          payment_status: 'paid',
          fulfillment_status: 'processing' // Starts processing once paid
        })
        .eq('id', order.id)

      // 4. (Optional) For digital products, we would generate a download token here.
      // But we can also just verify `payment_status = 'paid'` when they request the file.

    }

    return NextResponse.json({ status: 'success' })
  } catch (err: any) {
    console.error('Paystack webhook error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

