import 'server-only'

export interface TheyutesLocation {
  lat: number
  lng: number
  address: string
  city: string
  state: string
  country: 'NG'
}

export interface TheyutesParcel {
  weight_kg: number
  value: number // in kobo
  description: string
  fragile: boolean
}

export interface TheyutesRate {
  id: string
  fee: number
  carrier: string
  serviceLevel: string
  eta: string
  raw: Record<string, unknown>
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function stringValue(...values: unknown[]): string {
  const value = values.find(candidate => typeof candidate === 'string' && candidate.trim())
  return typeof value === 'string' ? value.trim() : ''
}

export async function getTheyutesRates(
  pickup: TheyutesLocation,
  dropoff: TheyutesLocation,
  parcel: TheyutesParcel,
): Promise<{ rates: TheyutesRate[]; quote: Record<string, unknown> }> {
  const apiKey = process.env.THEYUTES_API_KEY
  if (!apiKey) {
    throw new Error('Theyutes is not configured. Set THEYUTES_API_KEY on the server.')
  }

  const baseUrl = process.env.THEYUTES_API_BASE_URL || 'https://theyutes.com'
  const endpoint = `${baseUrl.replace(/\/+$/, '')}/api/v1/logistics/quote`
  
  const payload = {
    pickup,
    dropoff,
    parcels: [{
      weightKg: parcel.weight_kg,
      valueKobo: parcel.value,
      description: parcel.description,
      isFragile: parcel.fragile
    }],
    currency: 'NGN',
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  })

  const responseBody: unknown = await response.json().catch(() => null)
  const body = record(responseBody)
  
  if (!response.ok) {
    console.error('=== THEYUTES 400 VALIDATION ERROR ===')
    console.error('Status:', response.status)
    console.error('Response Body:', JSON.stringify(body, null, 2))
    console.error('Request Payload Sent:', JSON.stringify(payload, null, 2))
    console.error('=======================================')

    const message = stringValue(body?.message, record(body?.error)?.message, body?.error)
    throw new Error(message || `Theyutes quote request failed (${response.status}).`)
  }

  const nestedData = record(body?.data)
  const candidates = Array.isArray(body?.quotes)
    ? body.quotes
    : Array.isArray(body?.rates)
      ? body.rates
      : Array.isArray(nestedData?.quotes)
        ? nestedData.quotes
        : Array.isArray(nestedData?.rates)
          ? nestedData.rates
          : Array.isArray(body?.data)
            ? body.data
            : []

  const rates = candidates.flatMap((candidate, index) => {
    const rate = record(candidate)
    if (!rate) return []
    
    // Theyutes returns priceKobo
    let fee = Number(rate.amount ?? rate.fee ?? rate.price)
    if (rate.priceKobo) fee = Number(rate.priceKobo) / 100

    if (!Number.isFinite(fee) || fee < 0) return []
    
    const carrier = stringValue(rate.carrierName, rate.carrier_name, rate.carrier, rate.provider) || 'Carrier'
    const serviceLevel = stringValue(rate.service_level, rate.service, rate.name) || 'Standard'
    
    const totalMinutes = rate.totalMinutes ? `${rate.totalMinutes} mins` : null
    const eta = stringValue(totalMinutes, rate.eta, rate.delivery_time, rate.estimated_delivery) || 'Same day'

    const id = stringValue(rate.quoteId, rate.quote_id, rate.id) || `rate_${index}`

    return {
      id,
      fee,
      carrier,
      serviceLevel,
      eta,
      raw: rate,
    }
  })

  // Sort by fee ascending
  rates.sort((a, b) => a.fee - b.fee)

  if (rates.length === 0) {
    throw new Error('No delivery routes available for these addresses.')
  }

  return { rates, quote: body || {} }
}

export async function dispatchTheyutesDelivery(
  quoteId: string,
  reference: string
) {
  const apiKey = process.env.THEYUTES_API_KEY
  if (!apiKey) {
    throw new Error('Theyutes is not configured. Set THEYUTES_API_KEY on the server.')
  }

  const baseUrl = process.env.THEYUTES_API_BASE_URL || 'https://theyutes.com'
  const endpoint = `${baseUrl.replace(/\/+$/, '')}/api/v1/logistics/dispatch`
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Idempotency-Key': `MAJI-DELIVERY-${reference}`
    },
    body: JSON.stringify({
      quoteId: quoteId,
      reference: reference,
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  })

  const responseBody: unknown = await response.json().catch(() => null)
  const body = record(responseBody)
  if (!response.ok) {
    const message = stringValue(body?.message, record(body?.error)?.message, body?.error)
    throw new Error(message || `Theyutes dispatch failed (${response.status}).`)
  }

  return body?.data || body
}
