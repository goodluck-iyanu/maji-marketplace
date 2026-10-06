'use server'

import { createClient } from '@/lib/supabase/server'
import { getTheyutesRates, TheyutesLocation, TheyutesParcel } from '@/lib/theyutes'

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

    const { data: products } = await supabase
      .from('products')
      .select('id, name, price, weight_kg, length_cm, width_cm, height_cm, fragile, delivery_category, discount_percent')
      .in('id', productIds)
      .eq('is_published', true)

    const { data: variants } = await supabase
      .from('product_variants')
      .select('id, price, product_id, products(name, price, weight_kg, length_cm, width_cm, height_cm, fragile, delivery_category, discount_percent, is_published)')
      .in('id', productIds)

    // 4. Build parcel
    let totalWeightKg = 0
    let totalValueKobo = 0
    let isFragile = false

    for (const item of cartItems) {
      const product = products?.find(p => p.id === item.id)
      if (product) {
        totalWeightKg += (product.weight_kg || 0) * item.qty
        const discount = Number(product.discount_percent || 0)
        totalValueKobo += (Number(product.price) * (1 - discount / 100)) * item.qty * 100
        if (product.fragile) isFragile = true
        continue
      }

      const variant = variants?.find(v => v.id === item.id)
      if (variant) {
        const parentProduct: any = Array.isArray(variant.products) ? variant.products[0] : variant.products
        if (parentProduct && parentProduct.is_published) {
          totalWeightKg += (parentProduct.weight_kg || 0) * item.qty
          const discount = Number(parentProduct.discount_percent || 0)
          totalValueKobo += (Number(variant.price) * (1 - discount / 100)) * item.qty * 100
          if (parentProduct.fragile) isFragile = true
        }
      }
    }

    if (totalWeightKg <= 0) totalWeightKg = 0.5
    if (totalValueKobo <= 0) totalValueKobo = 100000 // fallback ₦1,000

    const pickup: TheyutesLocation = {
      lat: Number(store.pickup_lat) || 0,
      lng: Number(store.pickup_lng) || 0,
      address: [store.pickup_house_number, store.pickup_address, store.pickup_area, store.pickup_lga].filter(Boolean).join(', ') || store.pickup_city || store.pickup_state,
      city: store.pickup_city || '',
      state: store.pickup_state || '',
      country: 'NG'
    }

    const dropoff: TheyutesLocation = {
      lat: Number(deliveryAddressInfo.lat) || 0,
      lng: Number(deliveryAddressInfo.lng) || 0,
      address: [deliveryAddressInfo.houseNumber, deliveryAddressInfo.line1, deliveryAddressInfo.area, deliveryAddressInfo.lga].filter(Boolean).join(', ') || deliveryAddressInfo.city || deliveryAddressInfo.state,
      city: deliveryAddressInfo.city || '',
      state: deliveryAddressInfo.state || '',
      country: 'NG'
    }

    const parcel: TheyutesParcel = {
      weight_kg: totalWeightKg,
      value: totalValueKobo,
      description: 'Maji Order',
      fragile: isFragile,
    }

    // 5. Call consolidated Theyutes API
    const response = await getTheyutesRates(pickup, dropoff, parcel)

    return {
      fee: response.rates[0].fee,
      carrier: response.rates[0].carrier,
      eta: response.rates[0].eta,
      quoteId: response.rates[0].id,
      rates: response.rates.map(rate => ({
        fee: rate.fee,
        carrier: rate.carrier,
        carrierId: rate.id,
        eta: rate.eta,
        quoteId: rate.id
      }))
    }

  } catch (error: any) {
    console.error('Delivery quote error:', error)
    const msg = error?.message || String(error)
    return { error: msg || 'Delivery fee could not be calculated right now. Please try again.' }
  }
}
