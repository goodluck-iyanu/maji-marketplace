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
  value: number
  description: string
  fragile: boolean
  length_cm?: number
  width_cm?: number
  height_cm?: number
  delivery_category?: string
  service_level?: string
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
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      pickup,
      dropoff,
      parcels: [parcel],
      currency: 'NGN',
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  })

  const responseBody: unknown = await response.json().catch(() => null)
  const body = record(responseBody)
  if (!response.ok) {
    const message = stringValue(body?.message, body?.error)
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
    const fee = Number(rate.amount ?? rate.fee ?? rate.price)
    if (!Number.isFinite(fee) || fee < 0) return []
    const carrier = stringValue(rate.carrier_name, rate.carrier, rate.provider) || 'Carrier'
    const serviceLevel = stringValue(rate.service_level, rate.service, rate.name)
    const eta = stringValue(rate.eta, rate.delivery_time, rate.estimated_delivery)
    return [{
      id: stringValue(rate.id, rate.quote_id, rate.rate_id) || `${carrier}:${serviceLevel}:${fee}:${eta}:${index}`,
      fee,
      carrier,
      serviceLevel,
      eta,
      raw: rate,
    }]
  }).sort((first, second) => first.fee - second.fee)

  if (!rates.length) {
    throw new Error('Theyutes returned no usable carrier quotes for this route.')
  }

  return {
    rates,
    quote: {
      requested_at: new Date().toISOString(),
      pickup,
      dropoff,
      parcel,
      rates: rates.map(({ raw, ...rate }) => ({ ...rate, provider_rate: raw })),
    },
  }
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
      quote_id: quoteId,
      reference: reference,
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  })

  const responseBody: unknown = await response.json().catch(() => null)
  const body = record(responseBody)
  if (!response.ok) {
    const message = stringValue(body?.message, body?.error)
    throw new Error(message || `Theyutes dispatch failed (${response.status}).`)
  }

  return body?.data || body
}
