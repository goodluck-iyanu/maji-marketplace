'use server'

import { createClient } from '@/lib/supabase/server'
import { initializeTransaction } from '@/lib/paystack'
import { redirect } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'

export async function processCheckout(formData: FormData) {
  const storeSlug = formData.get('storeSlug') as string
  const cartJson = formData.get('cart') as string
  const customerEmail = formData.get('email') as string
  const customerName = formData.get('name') as string
  const customerWhatsapp = formData.get('whatsapp') as string
  
  const deliveryMethod = formData.get('deliveryMethod') as string || 'digital'
  
  const deliveryState = formData.get('deliveryState') as string
  const deliveryCity = formData.get('deliveryCity') as string
  const deliveryAddress = formData.get('deliveryAddress') as string
  const deliveryLat = formData.get('deliveryLat') ? parseFloat(formData.get('deliveryLat') as string) : null
  const deliveryLng = formData.get('deliveryLng') ? parseFloat(formData.get('deliveryLng') as string) : null
  const deliveryZip = formData.get('deliveryZip') as string
  const deliveryLandmark = formData.get('deliveryLandmark') as string
  const deliveryFirstName = formData.get('deliveryFirstName') as string
  const deliveryLastName = formData.get('deliveryLastName') as string
  const deliveryPhone = formData.get('deliveryPhone') as string
  const deliveryIsResidential = formData.get('deliveryIsResidentialVal') === 'true'
  
  if (!storeSlug || !cartJson || !customerEmail) {
    return { error: 'Missing required fields' }
  }

  let cartItems: { id: string, qty: number }[] = []
  try {
    cartItems = JSON.parse(cartJson)
    if (cartItems.length === 0) return { error: 'Cart is empty' }
  } catch (e) {
    return { error: 'Invalid cart data' }
  }

  const supabase = await createClient()

  // 1. Fetch store
  const { data: store } = await supabase
    .from('stores')
    .select('id, product_type')
    .eq('slug', storeSlug)
    .single()
    
  if (!store) return { error: 'Store not found' }
  const storeId = store.id

  // 2. Fetch products and variants to get secure prices
  const productIds = cartItems.map(item => item.id)
  
  const { data: products } = await supabase
    .from('products')
    .select('id, name, price, discount_percent')
    .in('id', productIds)
    .eq('is_published', true)

  const { data: variants } = await supabase
    .from('product_variants')
    .select('id, price, product_id, products(is_published, discount_percent)')
    .in('id', productIds)

  if ((!products || products.length === 0) && (!variants || variants.length === 0)) {
    return { error: 'Products not found or unavailable' }
  }

  // Calculate total amount securely
  let totalAmount = 0
  const orderItemsData = []
  
  for (const item of cartItems) {
    // Check if it's a base product
    const product = products?.find(p => p.id === item.id)
    if (product) {
      const discount = product.discount_percent || 0
      const finalPrice = discount > 0 ? product.price * (1 - discount / 100) : product.price
      totalAmount += (finalPrice * item.qty)
      orderItemsData.push({
        product_id: product.id,
        quantity: item.qty,
        price_at_purchase: finalPrice,
      })
      continue
    }

    // Check if it's a variant
    const variant = variants?.find(v => v.id === item.id)
    if (variant) {
      const parentProduct: any = Array.isArray(variant.products) ? variant.products[0] : variant.products;
      if (parentProduct && parentProduct.is_published) {
        const discount = parentProduct.discount_percent || 0
        const finalPrice = discount > 0 ? variant.price * (1 - discount / 100) : variant.price
        totalAmount += (finalPrice * item.qty)
        orderItemsData.push({
          product_id: variant.product_id, // Link to base product
          variant_id: variant.id,         // Link to variant (Size/Color)
          quantity: item.qty,
          price_at_purchase: finalPrice,
        })
      }
    }
  }

  if (totalAmount <= 0) {
    return { error: 'Order total must be greater than 0' }
  }

  // 3. Calculate delivery fee
  let deliveryFee = 0
  let finalDeliveryAddress = null

  if (store.product_type === 'physical') {
    if (deliveryMethod === 'delivery') {
      deliveryFee = parseFloat(formData.get('deliveryFee') as string) || 0;
      const carrier = formData.get('carrierName') as string || 'Standard Delivery';
      finalDeliveryAddress = { 
        state: deliveryState, 
        city: deliveryCity, 
        line1: deliveryAddress, 
        lat: deliveryLat, 
        lng: deliveryLng, 
        zip: deliveryZip,
        landmark: deliveryLandmark,
        first_name: deliveryFirstName,
        last_name: deliveryLastName,
        phone: deliveryPhone,
        is_residential: deliveryIsResidential,
        carrier 
      }
    }
  }
  
  totalAmount += deliveryFee

  // 4. Check if seller has a subaccount for split payment
  const { data: payoutAccount } = await supabase
    .from('payout_accounts')
    .select('subaccount_code')
    .eq('store_id', storeId)
    .eq('status', 'active')
    .maybeSingle()

  // 5. Create a unique reference
  const reference = `ORD-${uuidv4()}`

  // Use Admin client for order creation to bypass RLS for anonymous buyers
  const supabaseAdmin = require('@supabase/supabase-js').createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 6. Create pending order in DB
  const orderId = uuidv4()
  const { error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      id: orderId,
      store_id: storeId,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerWhatsapp,
      delivery_method: store.product_type === 'physical' ? deliveryMethod : 'digital',
      delivery_fee: deliveryFee,
      delivery_address: finalDeliveryAddress,
      total_amount: totalAmount,
      payment_reference: reference,
      payment_status: 'pending',
    })

  if (orderError) {
    console.error('Order creation error:', orderError)
    return { error: 'Failed to create order' }
  }

  // Insert order items
  const itemsToInsert = orderItemsData.map(item => ({
    ...item,
    order_id: orderId
  }))
  await supabaseAdmin.from('order_items').insert(itemsToInsert)

  // 6. Initialize Paystack
  try {
    const isFakeSubaccount = payoutAccount?.subaccount_code?.startsWith('SUB_')
    const subaccountCode = isFakeSubaccount ? undefined : payoutAccount?.subaccount_code

    const paystackData = await initializeTransaction({
      amount: totalAmount,
      email: customerEmail,
      reference,
      subaccount: subaccountCode,
      metadata: {
        storeId,
        cart: cartItems,
      }
    })

    if (paystackData.authorization_url) {
      // Return URL to client for redirect instead of using Next.js redirect
      return { url: paystackData.authorization_url }
    } else {
      return { error: 'Failed to get checkout URL from payment gateway' }
    }
  } catch (err: any) {
    console.error('Paystack initialization error:', err)
    return { error: err.message || 'Payment gateway configuration error' }
  }
}
