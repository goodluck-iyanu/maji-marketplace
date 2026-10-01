import { createClient } from '@supabase/supabase-js'
import { sendOrderConfirmationEmail, sendSellerNewOrderEmail } from './email'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface FulfillParams {
  reference: string
  actualPaystackFee?: number
  isSplitPayment?: boolean
}

export async function processOrderFulfillment({
  reference,
  actualPaystackFee = 0,
  isSplitPayment = false,
}: FulfillParams) {
  try {
    // 1. Fetch the order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('payment_reference', reference)
      .single()

    if (orderError || !order) {
      console.error('[Order Fulfillment] Order not found for reference:', reference)
      return { success: false, error: 'Order not found' }
    }

    // 2. Mark order as paid & processing (if not already marked)
    await supabaseAdmin
      .from('orders')
      .update({
        payment_status: 'paid',
        fulfillment_status: 'processing',
        paystack_fee: actualPaystackFee || order.paystack_fee || 0,
      })
      .eq('id', order.id)

    // 3. Record financial transactions (idempotent due to unique index)
    try {
      const transactions = []
      // Seller's product payout portion
      transactions.push({
        store_id: order.store_id,
        order_id: order.id,
        transaction_type: 'product_sale',
        amount: order.product_subtotal || 0,
        status: isSplitPayment ? 'cleared' : 'pending_payout',
        description: `Sale for order ${order.id}`,
      })

      // Maji Platform Fee
      if (order.platform_fee && Number(order.platform_fee) > 0) {
        transactions.push({
          store_id: order.store_id,
          order_id: order.id,
          transaction_type: 'platform_fee',
          amount: order.platform_fee,
          status: 'cleared',
          description: `Platform fee for order ${order.id}`,
        })
      }

      // Paystack Processing Fee
      if (actualPaystackFee > 0) {
        transactions.push({
          store_id: order.store_id,
          order_id: order.id,
          transaction_type: 'paystack_fee',
          amount: -actualPaystackFee,
          status: 'cleared',
          description: `Paystack processing fee for order ${order.id}`,
        })
      }

      // Processing Fee Recovery
      if (order.processing_fee && Number(order.processing_fee) > 0) {
        transactions.push({
          store_id: order.store_id,
          order_id: order.id,
          transaction_type: 'processing_fee_recovery',
          amount: order.processing_fee,
          status: 'cleared',
          description: `Processing fee recovered from customer for order ${order.id}`,
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
          description: `Delivery fee for order ${order.id}`,
        })
      }

      if (transactions.length > 0) {
        await supabaseAdmin.from('financial_transactions').insert(transactions)
      }
    } catch (txErr) {
      console.error('[Order Fulfillment] Tx insert error:', txErr)
    }

    // 4. Create Notification for Seller (only if not already paid previously)
    if (order.payment_status !== 'paid') {
      try {
        await supabaseAdmin.from('notifications').insert({
          store_id: order.store_id,
          title: 'New Order Paid! 🎉',
          message: `Customer ${order.customer_name} paid for an order. ₦${Number(order.product_subtotal || 0).toLocaleString()} will automatically settle to your bank account by tomorrow morning (T+1).`,
          type: 'order',
          link: '/dashboard/orders',
        })
      } catch (notifErr) {
        console.error('[Order Fulfillment] Notif insert error:', notifErr)
      }
    }

    // 5. Send Buyer and Seller Order Confirmation Emails (idempotent check)
    if (!order.confirmation_email_sent) {
      try {
        // Fetch store name, contact details and logo
        const { data: store } = await supabaseAdmin
          .from('stores')
          .select('name, pickup_phone, pickup_email, profiles(email, phone), store_settings(logo_url)')
          .eq('id', order.store_id)
          .single()

        const storeName = store?.name || 'Maji Store'
        const storePhone = store?.pickup_phone || (store?.profiles as any)?.phone
        const storeEmail = store?.pickup_email || (store?.profiles as any)?.email
        const storeLogo = (store?.store_settings as any)?.[0]?.logo_url || (store?.store_settings as any)?.logo_url

        // Fetch order items with product details
        const { data: orderItems } = await supabaseAdmin
          .from('order_items')
          .select('*, products(name, description, is_digital, product_images(image_url, display_order))')
          .eq('order_id', order.id)
          .order('created_at', { ascending: true })

        const items = (orderItems || []).map((item: any) => {
          const product = item.products
          const images = product?.product_images || []
          const sortedImages = [...images].sort(
            (a: any, b: any) => (a.display_order || 0) - (b.display_order || 0)
          )
          return {
            name: product?.name || 'Product',
            description: product?.description || '',
            quantity: item.quantity,
            priceAtPurchase: Number(item.price_at_purchase),
            imageUrl: sortedImages[0]?.image_url || undefined,
            isDigital: product?.is_digital || false,
          }
        })
        
        const customerPhone = order.customer_phone || order.delivery_address?.recipient_phone || undefined

        // Send Email to Buyer
        const buyerEmailResult = await sendOrderConfirmationEmail({
          orderId: order.id,
          paymentReference: order.payment_reference,
          customerName: order.customer_name || 'Customer',
          customerEmail: order.customer_email,
          storeName,
          storeEmail,
          storePhone,
          storeLogo,
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

        if (buyerEmailResult.success) {
          await supabaseAdmin
            .from('orders')
            .update({ confirmation_email_sent: true })
            .eq('id', order.id)
          console.log(`[Order Fulfillment] Buyer confirmation email sent for ${order.payment_reference}`)
        } else {
          console.error(`[Order Fulfillment] Buyer email failed for ${order.payment_reference}:`, buyerEmailResult.error)
        }
        
        // Send Email to Seller (if they have an email)
        if (storeEmail) {
          const sellerEmailResult = await sendSellerNewOrderEmail({
            orderId: order.id,
            paymentReference: order.payment_reference,
            customerName: order.customer_name || 'Customer',
            customerEmail: order.customer_email,
            customerPhone,
            storeName,
            storeEmail,
            deliveryMethod: order.delivery_method || 'digital',
            deliveryAddress: order.delivery_address,
            productSubtotal: Number(order.product_subtotal || 0),
            orderDate: order.created_at,
            items,
          })
          if (sellerEmailResult.success) {
             console.log(`[Order Fulfillment] Seller notification email sent for ${order.payment_reference}`)
          } else {
             console.error(`[Order Fulfillment] Seller email failed for ${order.payment_reference}:`, sellerEmailResult.error)
          }
        }

      } catch (emailErr) {
        console.error('[Order Fulfillment] Email exception:', emailErr)
      }
    }

    return { success: true }
  } catch (err: any) {
    console.error('[Order Fulfillment] Overall error:', err)
    return { success: false, error: err.message }
  }
}
