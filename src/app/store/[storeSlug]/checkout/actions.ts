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
    .select('id')
    .eq('slug', storeSlug)
    .single()
    
  if (!store) return { error: 'Store not found' }
  const storeId = store.id

  // 2. Fetch products to get secure prices
  const productIds = cartItems.map(item => item.id)
  const { data: products } = await supabase
    .from('products')
    .select('id, name, price')
    .in('id', productIds)
    .eq('is_published', true)

  if (!products || products.length === 0) return { error: 'Products not found or unavailable' }

  // Calculate total amount securely
  let totalAmount = 0
  const orderItemsData = []
  
  for (const item of cartItems) {
    const product = products.find(p => p.id === item.id)
    if (product) {
      totalAmount += (product.price * item.qty)
      orderItemsData.push({
        product_id: product.id,
        quantity: item.qty,
        price_at_purchase: product.price,
      })
    }
  }

  // 3. Check if seller has a subaccount for split payment
  const { data: payoutAccount } = await supabase
    .from('payout_accounts')
    .select('subaccount_code')
    .eq('store_id', storeId)
    .eq('status', 'active')
    .maybeSingle()

  // 4. Create a unique reference
  const reference = `ORD-${uuidv4()}`

  // Use Admin client for order creation to bypass RLS for anonymous buyers
  const supabaseAdmin = require('@supabase/supabase-js').createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 5. Create pending order in DB
  const orderId = uuidv4()
  const { error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      id: orderId,
      store_id: storeId,
      customer_name: customerName,
      customer_email: customerEmail,
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
