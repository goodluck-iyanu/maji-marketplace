import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { sendOrderConfirmationEmail } from '@/lib/email'

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

      // Idempotency check: Abort ONLY if the email is already sent 
      // (which proves the ENTIRE webhook successfully completed previously)
      if (order.confirmation_email_sent === true) {
        return NextResponse.json({ status: 'success', message: 'Order already fully processed' })
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

      const isSplitPayment = !!event.data.subaccount;
      const actualPaystackFee = (event.data.fees || 0) / 100;

      // 3. Mark as paid & save paystack fee
      await supabaseAdmin
        .from('orders')
        .update({ 
          payment_status: 'paid',
          fulfillment_status: 'processing', // Starts processing once paid
          paystack_fee: actualPaystackFee
        })
        .eq('id', order.id)

      // 4. Record financial transactions
      const transactions = []
      // Seller's product payout portion
      transactions.push({
          store_id: order.store_id,
          order_id: order.id,
          transaction_type: 'product_sale',
          amount: order.product_subtotal || 0,
          status: isSplitPayment ? 'cleared' : 'pending_payout',
          description: `Sale for order ${order.id}`
      })
      // Maji Platform Fee
      if (order.platform_fee && Number(order.platform_fee) > 0) {
        transactions.push({
            store_id: order.store_id,
            order_id: order.id,
            transaction_type: 'platform_fee',
            amount: order.platform_fee,
            status: 'cleared',
            description: `Platform fee for order ${order.id}`
        })
      }
      // Paystack Processing Fee (Negative/Expense for Maji)
      if (actualPaystackFee > 0) {
        transactions.push({
            store_id: order.store_id,
            order_id: order.id,
            transaction_type: 'paystack_fee',
            amount: -actualPaystackFee,
            status: 'cleared',
            description: `Paystack processing fee for order ${order.id}`
        })
      }
      // Payment Processing Fee Recovery (Income for Maji)
      if (order.processing_fee && Number(order.processing_fee) > 0) {
        transactions.push({
            store_id: order.store_id,
            order_id: order.id,
            transaction_type: 'processing_fee_recovery',
            amount: order.processing_fee,
            status: 'cleared',
            description: `Processing fee recovered from customer for order ${order.id}`
        })
      }
      // Delivery Fee
      if (order.delivery_fee && Number(order.delivery_fee) > 0) {
        transactions.push({
            store_id: order.store_id,
            order_id: order.id,
            transaction_type: 'delivery_fee',
            amount: order.delivery_fee,
            status: 'delivery_funds_held',
            description: `Delivery fee for order ${order.id}`
        })
      }

      const { error: txError } = await supabaseAdmin.from('financial_transactions').insert(transactions)
      if (txError) {
        console.error('Failed to write financial transactions:', txError)
      }

      // 5. Create Notification for the Seller
      await supabaseAdmin
        .from('notifications')
        .insert({
          store_id: order.store_id,
          title: 'New Order Paid! 🎉',
          message: `Customer ${order.customer_name} paid for an order. ₦${Number(order.product_subtotal || 0).toLocaleString()} will automatically settle to your bank account by tomorrow morning (T+1).`,
          type: 'order',
          link: '/dashboard'
        })

      // 6. Send Maji Order Confirmation Email (idempotent)
      if (!order.confirmation_email_sent) {
        try {
          // Fetch store name
          const { data: store } = await supabaseAdmin
            .from('stores')
            .select('name')
            .eq('id', order.store_id)
            .single()

          // Fetch order items with product details
          const { data: orderItems } = await supabaseAdmin
            .from('order_items')
            .select('*, products(name, description, is_digital, product_images(image_url, display_order))')
            .eq('order_id', order.id)
            .order('created_at', { ascending: true })

          const items = (orderItems || []).map((item: any) => {
            const product = item.products
            const images = product?.product_images || []
            const sortedImages = [...images].sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
            return {
              name: product?.name || 'Product',
              description: product?.description || '',
              quantity: item.quantity,
              priceAtPurchase: Number(item.price_at_purchase),
              imageUrl: sortedImages[0]?.image_url || undefined,
              isDigital: product?.is_digital || false,
            }
          })

          const emailResult = await sendOrderConfirmationEmail({
            orderId: order.id,
            paymentReference: order.payment_reference,
            customerName: order.customer_name || 'Customer',
            customerEmail: order.customer_email,
            storeName: store?.name || 'Maji Store',
            deliveryMethod: order.delivery_method || 'digital',
            deliveryAddress: order.delivery_address,
            deliveryFee: Number(order.delivery_fee || 0),
            platformFee: Number(order.platform_fee || 0),
            processingFee: Number(order.processing_fee || 0),
            productSubtotal: Number(order.product_subtotal || 0),
            totalAmount: Number(order.total_amount),
            orderDate: order.created_at,
            items,
          })

          if (emailResult.success) {
            // Mark email as sent (idempotency flag)
            await supabaseAdmin
              .from('orders')
              .update({ confirmation_email_sent: true })
              .eq('id', order.id)
            console.log(`[Maji] Order confirmation email sent for ${order.payment_reference}`)
          } else {
            // Email failed but order/payment is still valid
            console.error(`[Maji] Email failed for ${order.payment_reference}:`, emailResult.error)
          }
        } catch (emailErr) {
          // Email failure must NOT affect order status
          console.error('[Maji] Email send exception:', emailErr)
        }
      }
    }

    return NextResponse.json({ status: 'success' })
  } catch (err: any) {
    console.error('Paystack webhook error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

