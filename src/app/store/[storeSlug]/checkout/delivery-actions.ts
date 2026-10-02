'use server'

import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

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
  cartItems: any[]
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

    if (!store.pickup_state) {
      return { error: 'Seller has not set up a pickup state yet. Delivery cannot be calculated.' }
    }

    // 2. Validate buyer has state
    if (!deliveryAddressInfo.state) {
      return { error: 'Please select a destination state.' }
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
    let totalWeightKg = 0

    for (const item of cartItems) {
      const product = products?.find(p => p.id === item.id)
      if (product) {
        totalWeightKg += (product.weight_kg || 0) * item.qty
        continue
      }

      const variant = variants?.find(v => v.id === item.id)
      if (variant) {
        const parentProduct: any = Array.isArray(variant.products) ? variant.products[0] : variant.products
        if (parentProduct && parentProduct.is_published) {
          totalWeightKg += (parentProduct.weight_kg || 0) * item.qty
        }
      }
    }

    // 5. Build FEZ quote request
    const dropoffAddress = [deliveryAddressInfo.houseNumber, deliveryAddressInfo.line1, deliveryAddressInfo.area, deliveryAddressInfo.lga, deliveryAddressInfo.city, deliveryAddressInfo.state]
      .filter(Boolean)
      .join(', ')

    // Unique IDs for deterministic request tracing
    const requestHash = crypto.createHash('sha256')
      .update(`${storeId}-${deliveryAddressInfo.state}-${totalWeightKg}`)
      .digest('hex')
      .substring(0, 16)
      
    const uniqueID = `MAJI-QT-${Date.now()}-${requestHash}`
    const BatchID = `MAJI-BATCH-${requestHash}`

    const payload: any = {
      state: deliveryAddressInfo.state,
      pickupState: store.pickup_state,
      locker: false,
      recipientAddress: dropoffAddress || deliveryAddressInfo.line1 || 'Nigeria',
      recipientState: deliveryAddressInfo.state,
      recipientName: `${deliveryAddressInfo.firstName} ${deliveryAddressInfo.lastName}`.trim() || 'Customer',
      recipientPhone: deliveryAddressInfo.phone || '00000000000',
      recipientEmail: deliveryAddressInfo.email || 'customer@hoberg.com.ng',
      uniqueID: uniqueID,
      BatchID: BatchID
    }

    // Add weight only if we have a real weight. FEZ defaults to 0-5kg if omitted.
    if (totalWeightKg > 0) {
      payload.weight = Math.ceil(totalWeightKg) // FEZ usually expects whole numbers, but send exact if it handles float. Let's send exact.
    } else {
      console.log(`[FEZ] No explicit product weight found. Omitting weight to use FEZ 0-5kg default tier.`)
    }

    // 6. Call FEZ Quote API
    const authHeader = process.env.FEZ_AUTHORIZATION
    const secretKey = process.env.FEZ_SECRET_KEY
    const baseUrl = (process.env.FEZ_API_BASE_URL || 'https://apisandbox.fezdelivery.co/v1').replace(/\/+$/, '')

    if (!authHeader || !secretKey) {
      console.error('FEZ API credentials are not set')
      return { error: 'Delivery service is not configured. Please contact support.' }
    }

    console.log(`[FEZ] Requesting quote: ${baseUrl}/order/cost`)
    console.log(`[FEZ] Payload:`, JSON.stringify(payload, null, 2))

    const res = await fetch(`${baseUrl}/order/cost`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'secret-key': secretKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const responseText = await res.text()
    console.log(`[FEZ] Response status: ${res.status}`)
    console.log(`[FEZ] Response body: ${responseText.substring(0, 500)}`)

    let data;
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      console.error('FEZ API returned non-JSON:', responseText.substring(0, 200))
      return { error: 'Delivery service returned an invalid response. Please try again.' }
    }

    if (!res.ok) {
      console.error('FEZ API Error:', data)
      return { error: data.message || data.description || data.error || 'Delivery fee could not be calculated right now. Please try again.' }
    }

    // 7. Parse FEZ response
    // FEZ returns cost information including: cost, vat, totalCost
    // Depending on if it's nested under data or direct
    const result = data?.data || data

    if (!result || typeof result.totalCost === 'undefined') {
      console.error('[FEZ] Missing totalCost in response:', data)
      return { error: 'Delivery service returned an incomplete quote. Please try again.' }
    }

    const totalCost = Number(result.totalCost)
    const baseCost = Number(result.cost || totalCost)
    const vat = result.vat?.vatAmount !== undefined ? Number(result.vat.vatAmount) : Number(result.vat || 0)

    if (isNaN(totalCost) || totalCost <= 0) {
      return { error: 'Delivery service returned an invalid amount. Please try again.' }
    }

    return {
      fee: totalCost,
      carrier: 'FEZ Delivery',
      eta: 'N/A',
      quoteId: uniqueID,
      delivery_fee_base: baseCost,
      delivery_fee_vat: vat,
      delivery_fee_total: totalCost,
      rates: [{
        fee: totalCost,
        carrier: 'FEZ Delivery',
        carrierId: 'fez',
        eta: 'N/A',
        quoteId: uniqueID,
      }]
    }

  } catch (error: any) {
    console.error('Delivery quote error:', error)
    const msg = error?.message || String(error)
    if (msg.includes('fetch failed') || msg.includes('ECONNREFUSED') || msg.includes('ETIMEDOUT')) {
      return { error: 'Could not reach the delivery service. Please try again in a moment.' }
    }
    return { error: 'Delivery fee could not be calculated right now. Please try again.' }
  }
}
