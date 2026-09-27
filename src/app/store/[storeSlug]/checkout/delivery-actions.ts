'use server'

import { createClient } from '@/lib/supabase/server'

interface DeliveryAddressInfo {
  firstName: string
  lastName: string
  phone: string
  email?: string
  state: string
  city: string
  line1: string
  houseNumber?: string
  area?: string
  lga?: string
  zip?: string
  lat: string
  lng: string
  isResidential?: boolean
  landmark?: string
}

export async function getDeliveryQuotes(
  storeId: string,
  deliveryAddressInfo: DeliveryAddressInfo,
  cartItems: { id: string; qty: number }[]
) {
  try {
    const supabase = await createClient()

    // 1. Fetch store pickup location
    const { data: store } = await supabase
      .from('stores')
      .select('pickup_address, pickup_state, pickup_city, pickup_lat, pickup_lng, pickup_house_number, pickup_area, pickup_lga, pickup_landmark, pickup_contact_name, pickup_phone')
      .eq('id', storeId)
      .single()

    if (!store) {
      return { error: 'Store not found.' }
    }

    if (!store.pickup_lat || !store.pickup_lng) {
      return { error: 'Seller has not set up a confirmed pickup location yet.' }
    }

    // 2. Validate buyer has lat/lng
    if (!deliveryAddressInfo.lat || !deliveryAddressInfo.lng) {
      return { error: 'Please select your exact delivery location from the map.' }
    }

    // 3. Fetch actual product weights and values from cart items
    const productIds = cartItems.map(item => item.id)

    // Try to match as base products first
    const { data: products } = await supabase
      .from('products')
      .select('id, name, price, weight_kg, length_cm, width_cm, height_cm, fragile, delivery_category, discount_percent')
      .in('id', productIds)
      .eq('is_published', true)

    // Also try as variants
    const { data: variants } = await supabase
      .from('product_variants')
      .select('id, price, product_id, products(name, price, weight_kg, length_cm, width_cm, height_cm, fragile, delivery_category, discount_percent, is_published)')
      .in('id', productIds)

    // 4. Build parcels array with real data
    let totalValueKobo = 0
    let totalWeightKg = 0
    let anyFragile = false
    let productDescription = ''
    let category = 'general'

    for (const item of cartItems) {
      const product = products?.find(p => p.id === item.id)
      if (product) {
        const discount = product.discount_percent || 0
        const finalPrice = discount > 0 ? product.price * (1 - discount / 100) : product.price
        totalValueKobo += Math.round(finalPrice * 100) * item.qty
        totalWeightKg += (product.weight_kg || 0.5) * item.qty
        if (product.fragile) anyFragile = true
        if (product.delivery_category) category = product.delivery_category
        productDescription += (productDescription ? ', ' : '') + (product.name || 'Product')
        continue
      }

      const variant = variants?.find(v => v.id === item.id)
      if (variant) {
        const parentProduct: any = Array.isArray(variant.products) ? variant.products[0] : variant.products
        if (parentProduct && parentProduct.is_published) {
          const discount = parentProduct.discount_percent || 0
          const finalPrice = discount > 0 ? variant.price * (1 - discount / 100) : variant.price
          totalValueKobo += Math.round(finalPrice * 100) * item.qty
          totalWeightKg += (parentProduct.weight_kg || 0.5) * item.qty
          if (parentProduct.fragile) anyFragile = true
          if (parentProduct.delivery_category) category = parentProduct.delivery_category
          productDescription += (productDescription ? ', ' : '') + (parentProduct.name || 'Product')
        }
      }
    }

    // Ensure minimum weight
    if (totalWeightKg <= 0) totalWeightKg = 0.5
    if (totalValueKobo <= 0) totalValueKobo = 100000 // fallback ₦1,000

    // 5. Build Theyutes quote request
    const pickupAddress = [store.pickup_house_number, store.pickup_address, store.pickup_area, store.pickup_lga, store.pickup_city, store.pickup_state]
      .filter(Boolean)
      .join(', ')

    const dropoffAddress = [deliveryAddressInfo.houseNumber, deliveryAddressInfo.line1, deliveryAddressInfo.area, deliveryAddressInfo.lga, deliveryAddressInfo.city, deliveryAddressInfo.state]
      .filter(Boolean)
      .join(', ')

    const payload = {
      pickup: {
        lat: parseFloat(String(store.pickup_lat)),
        lng: parseFloat(String(store.pickup_lng)),
        address: pickupAddress || store.pickup_address || 'Lagos, Nigeria',
      },
      dropoff: {
        lat: parseFloat(deliveryAddressInfo.lat),
        lng: parseFloat(deliveryAddressInfo.lng),
        address: dropoffAddress || deliveryAddressInfo.line1 || 'Lagos, Nigeria',
      },
      parcels: [
        {
          weightKg: Math.round(totalWeightKg * 100) / 100,
          valueKobo: totalValueKobo,
          category: category,
        }
      ]
    }

    // 6. Call Theyutes Quote API
    const apiKey = process.env.THEYUTES_API_KEY
    const baseUrl = process.env.THEYUTES_API_BASE_URL || 'https://api.theyutes.com'

    if (!apiKey) {
      console.error('THEYUTES_API_KEY is not set')
      return { error: 'Delivery service is not configured. Please contact support.' }
    }

    const res = await fetch(`${baseUrl}/api/v1/logistics/quote`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Theyutes API Error:', data)
      return { error: data.message || data.error || 'Failed to calculate delivery fee.' }
    }

    // 7. Parse Theyutes response
    const quotes = data?.data?.quotes
    if (!quotes || quotes.length === 0) {
      return { error: 'No delivery carriers available for this route.' }
    }

    // Sort by price ascending
    const sorted = [...quotes].sort((a: any, b: any) => a.priceKobo - b.priceKobo)

    return {
      fee: Math.round(sorted[0].priceKobo / 100), // Convert kobo to Naira
      carrier: sorted[0].carrierName,
      eta: `${sorted[0].etaMinutes} min`,
      quoteId: sorted[0].quoteId,
      rates: sorted.map((q: any) => ({
        fee: Math.round(q.priceKobo / 100),
        carrier: q.carrierName,
        carrierId: q.carrier,
        eta: `${q.etaMinutes} min`,
        quoteId: q.quoteId,
      }))
    }

  } catch (error) {
    console.error('Delivery quote error:', error)
    return { error: 'An error occurred calculating delivery fee.' }
  }
}
