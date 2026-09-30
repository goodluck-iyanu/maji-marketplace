import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendOrderConfirmationEmail } from '@/lib/email'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const reference = searchParams.get('reference')
  
  if (!reference) {
    return NextResponse.json({ error: 'Missing reference parameter' }, { status: 400 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Fetch order
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('payment_reference', reference)
    .single()

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // 2. Fetch store name
  const { data: store } = await supabaseAdmin
    .from('stores')
    .select('name')
    .eq('id', order.store_id)
    .single()

  // 3. Fetch order items
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

  // 4. Force send email
  console.log('Testing email for:', order.payment_reference)
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
    return NextResponse.json({ 
      status: 'success', 
      message: 'Email successfully sent!', 
      recipient: order.customer_email 
    })
  } else {
    return NextResponse.json({ 
      status: 'failed', 
      error: emailResult.error,
      hint: 'If error says missing API key, Vercel environment variables are wrong. If error says domain unverified, check Resend dashboard.'
    }, { status: 500 })
  }
}
