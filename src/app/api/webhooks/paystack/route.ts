import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { processOrderFulfillment } from '@/lib/order-fulfillment'

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
        .select('id, payment_status, total_amount, confirmation_email_sent')
        .eq('payment_reference', reference)
        .single()

      if (!order) {
        return NextResponse.json({ status: 'ignored', message: 'Order not found' })
      }

      // Idempotency check: Abort ONLY if the email is already sent
      if (order.confirmation_email_sent === true) {
        return NextResponse.json({ status: 'success', message: 'Order already fully processed' })
      }

      // 2. Validate amount. Paystack amount is in kobo.
      const paidAmount = event.data.amount / 100
      if (paidAmount < order.total_amount) {
        await supabaseAdmin
          .from('orders')
          .update({ payment_status: 'failed', fulfillment_status: 'cancelled' })
          .eq('id', order.id)

        return NextResponse.json({ status: 'success', message: 'Invalid amount paid' })
      }

      const isSplitPayment = !!event.data.subaccount
      const actualPaystackFee = (event.data.fees || 0) / 100

      // 3. Complete order fulfillment
      await processOrderFulfillment({
        reference,
        actualPaystackFee,
        isSplitPayment,
      })
    }

    return NextResponse.json({ status: 'success' })
  } catch (err: any) {
    console.error('Paystack webhook error:', err)
    return NextResponse.json({ status: 'success' })
  }
}
