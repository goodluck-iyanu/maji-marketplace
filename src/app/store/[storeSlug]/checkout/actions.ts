'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { initializeTransaction } from '@/lib/paystack'
import { v4 as uuidv4 } from 'uuid'
import { getDeliveryQuotes } from './delivery-actions'

interface CartItem {
  id: string
  qty: number
}

export async function processCheckout(formData: FormData) {
  const storeSlug = String(formData.get('storeSlug') ?? '')
  const cartJson = String(formData.get('cart') ?? '')
  const customerEmail = String(formData.get('email') ?? '')
  const customerName = String(formData.get('name') ?? '')
  const customerPhone = String(formData.get('whatsapp') ?? '')
  const deliveryMethod = String(formData.get('deliveryMethod') ?? 'digital')

  if (!storeSlug || !cartJson || !customerEmail || !customerName || !customerPhone) {
    return { error: 'Complete your contact information before checkout.' }
  }

  let cartItems: CartItem[]
  try {
    const parsed: unknown = JSON.parse(cartJson)
    if (!Array.isArray(parsed) || parsed.length === 0) return { error: 'Cart is empty.' }
    cartItems = parsed as CartItem[]
  } catch {
    return { error: 'Invalid cart data.' }
  }

  const supabase = await createClient()
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('id, product_type')
    .eq('slug', storeSlug)
    .single()

  if (storeError || !store) return { error: 'Store not found.' }
  const storeId = store.id
  const productIds = [...new Set(cartItems.map(item => item.id))]

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, price, discount_percent, is_digital')
    .eq('store_id', storeId)
    .eq('is_published', true)
    .in('id', productIds)

  const { data: variants, error: variantsError } = await supabase
    .from('product_variants')
    .select('id, price, product_id, products!inner(is_published, discount_percent, store_id)')
    .in('id', productIds)
    .eq('is_active', true)

  if (productsError || variantsError) {
    console.error('Checkout product lookup failed:', productsError ?? variantsError)
    return { error: 'Unable to validate the products in your cart.' }
  }

  let itemTotal = 0
  const orderItemsData: {
    product_id: string
    variant_id?: string
    quantity: number
    price_at_purchase: number
  }[] = []

  for (const item of cartItems) {
    if (!item || typeof item.id !== 'string' || !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 100) {
      return { error: 'Cart contains an invalid item quantity.' }
    }
    const product = products?.find(candidate => candidate.id === item.id)
    if (product && !product.is_digital) {
      const discount = Number(product.discount_percent ?? 0)
      const price = Number(product.price) * (1 - discount / 100)
      itemTotal += price * item.qty
      orderItemsData.push({
        product_id: product.id,
        quantity: item.qty,
        price_at_purchase: price,
      })
      continue
    }

    const variant = variants?.find(candidate => candidate.id === item.id)
    if (variant) {
      const parent = Array.isArray(variant.products) ? variant.products[0] : variant.products
      if (!parent?.is_published || parent.store_id !== storeId) {
        return { error: 'A product in your cart is no longer available.' }
      }
      const price = Number(variant.price) * (1 - Number(parent.discount_percent ?? 0) / 100)
      itemTotal += price * item.qty
      orderItemsData.push({
        product_id: variant.product_id,
        variant_id: variant.id,
        quantity: item.qty,
        price_at_purchase: price,
      })
      continue
    }
    return { error: 'A product in your cart is no longer available.' }
  }

  if (itemTotal <= 0 || orderItemsData.length !== cartItems.length) {
    return { error: 'Order total must be greater than zero and all products must be available.' }
  }

  let deliveryFee = 0
  let finalDeliveryAddress: Record<string, unknown> | null = null
  let savedQuote: Record<string, unknown> | null = null

  if (store.product_type === 'physical' && deliveryMethod === 'delivery') {
    const dropoff = {
      firstName: String(formData.get('deliveryFirstName') ?? ''),
      lastName: String(formData.get('deliveryLastName') ?? ''),
      phone: String(formData.get('deliveryPhone') ?? ''),
      state: String(formData.get('deliveryState') ?? ''),
      city: String(formData.get('deliveryCity') ?? ''),
      line1: String(formData.get('deliveryAddress') ?? ''),
      houseNumber: String(formData.get('deliveryHouseNumber') ?? ''),
      area: String(formData.get('deliveryArea') ?? ''),
      lga: String(formData.get('deliveryLga') ?? ''),
      country: String(formData.get('deliveryCountry') ?? ''),
      lat: String(formData.get('deliveryLat') ?? ''),
      lng: String(formData.get('deliveryLng') ?? ''),
      zip: String(formData.get('deliveryZip') ?? ''),
      landmark: String(formData.get('deliveryLandmark') ?? ''),
      locationConfirmed: formData.get('deliveryLocationConfirmed') === 'true',
    }
    const liveQuote = await getDeliveryQuotes(storeId, dropoff as any, cartItems)
    if (liveQuote.error || !liveQuote.rates) {
      return { error: liveQuote.error || 'Unable to get a live delivery quote.' }
    }

    // We can't match exact quoteId because it's a new API call, so match by carrierId (which we passed in form)
    // Actually, in cart/page.tsx we appended deliveryQuoteId which is from the frontend. We can use the fresh quoteId from the backend instead.
    const selectedQuoteStr = formData.get('deliveryQuote')
    let selectedQuote = null
    try {
      if (selectedQuoteStr) selectedQuote = JSON.parse(String(selectedQuoteStr))
    } catch (e) {}

    const selectedCarrierId = selectedQuote?.carrierId || liveQuote.rates[0].carrierId

    const matchedRate = liveQuote.rates.find(rate => rate.carrierId === selectedCarrierId)
    if (!matchedRate) {
      return { error: 'Your chosen delivery option is no longer available. Please try again.' }
    }
    
    deliveryFee = matchedRate.fee
    savedQuote = matchedRate
    finalDeliveryAddress = {
      first_name: dropoff.firstName,
      last_name: dropoff.lastName,
      recipient_name: `${dropoff.firstName} ${dropoff.lastName}`.trim(),
      recipient_phone: dropoff.phone,
      address: dropoff.line1,
      house_number: dropoff.houseNumber,
      area: dropoff.area,
      lga: dropoff.lga,
      city: dropoff.city,
      state: dropoff.state,
      country: 'NG',
      lat: Number(dropoff.lat),
      lng: Number(dropoff.lng),
      zip: dropoff.zip,
      landmark: dropoff.landmark,
      is_residential: formData.get('deliveryIsResidentialVal') === 'true',
      carrier: matchedRate.carrier,
      eta: matchedRate.eta,
    }
    savedQuote = matchedRate
  } else if (store.product_type === 'physical' && deliveryMethod !== 'arrange') {
    return { error: 'Choose a valid delivery method.' }
  }

  const totalAmount = itemTotal + deliveryFee
  const { data: payoutAccount } = await supabase
    .from('payout_accounts')
    .select('subaccount_code')
    .eq('store_id', storeId)
    .eq('status', 'active')
    .maybeSingle()

  const reference = `ORD-${uuidv4()}`
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const orderId = uuidv4()
  const { error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      id: orderId,
      store_id: storeId,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      delivery_method: store.product_type === 'physical' ? deliveryMethod : 'digital',
      delivery_fee: deliveryFee,
      delivery_address: finalDeliveryAddress,
      delivery_quote: savedQuote,
      total_amount: totalAmount,
      payment_reference: reference,
      payment_status: 'pending',
    })

  if (orderError) {
    console.error('Order creation error:', orderError)
    return { error: 'Failed to create order.' }
  }

  const itemsToInsert = orderItemsData.map(item => ({ ...item, order_id: orderId }))
  const { error: orderItemsError } = await supabaseAdmin.from('order_items').insert(itemsToInsert)
  if (orderItemsError) {
    console.error('Order items creation error:', orderItemsError)
    return { error: 'Failed to save order items.' }
  }

  try {
    const isFakeSubaccount = payoutAccount?.subaccount_code?.startsWith('SUB_')
    const paystackData = await initializeTransaction({
      amount: totalAmount,
      email: customerEmail,
      reference,
      subaccount: isFakeSubaccount ? undefined : payoutAccount?.subaccount_code,
      metadata: { storeId, cart: cartItems },
    })

    if (paystackData.authorization_url) return { url: paystackData.authorization_url }
    return { error: 'Failed to get checkout URL from payment gateway.' }
  } catch (error) {
    console.error('Paystack initialization error:', error)
    return { error: error instanceof Error ? error.message : 'Payment gateway configuration error.' }
  }
}
