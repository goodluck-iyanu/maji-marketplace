'use client'

import { useCart } from '../cart-context'
import { Minus, Plus, ShoppingBag, Loader2, ArrowLeft, AlertCircle, ShieldCheck } from 'lucide-react'
import { useState, useEffect } from 'react'
import { processCheckout } from '../checkout/actions'
import { getDeliveryQuotes } from '../checkout/delivery-actions'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import TerminalAddressForm, { type TerminalAddressData } from '@/components/TerminalAddressForm'

export default function CartPage() {
  const params = useParams()
  const storeSlug = params.storeSlug as string
  const { items, updateQty, removeFromCart, totalAmount } = useCart()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [productType, setProductType] = useState<'physical' | 'digital' | null>(null)
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'arrange'>('delivery')
  
  const [deliveryFee, setDeliveryFee] = useState(0)
  const [isCalculatingFee, setIsCalculatingFee] = useState(false)
  const [quoteError, setQuoteError] = useState<string | null>(null)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [carrierRates, setCarrierRates] = useState<{fee: number, carrier: string, carrierId: string, eta: string, quoteId: string}[]>([])
  const [selectedCarrierIndex, setSelectedCarrierIndex] = useState(0)
  
  const [terminalAddress, setTerminalAddress] = useState<TerminalAddressData | null>(null)
  const quoteCartKey = JSON.stringify(items.map(item => ({ id: item.id, qty: item.qty })))
  const quoteAddressKey = JSON.stringify(terminalAddress)

  useEffect(() => {
    async function fetchStore() {
      const supabase = createClient()
      const { data } = await supabase.from('stores').select('id, product_type').eq('slug', storeSlug).single()
      if (data) {
        setProductType(data.product_type as 'physical' | 'digital')
        setStoreId(data.id)
      }
    }
    fetchStore()
  }, [storeSlug])

  useEffect(() => {
    let cancelled = false
    async function calculateFee() {
      const dropoff: TerminalAddressData | null = JSON.parse(quoteAddressKey)
      const addressReady = dropoff?.locationConfirmed &&
        dropoff.city && dropoff.state && dropoff.lat && dropoff.lng
      if (storeId && addressReady && productType === 'physical' && deliveryMethod === 'delivery') {
        setIsCalculatingFee(true)
        setQuoteError(null)
        setDeliveryFee(0)
        setCarrierRates([])
        try {
          const quoteItems: { id: string; qty: number }[] = JSON.parse(quoteCartKey)
          const res = await getDeliveryQuotes(storeId, dropoff, quoteItems)
          if (cancelled) return
          if (res.rates && res.rates.length > 0) {
            setCarrierRates(res.rates)
            setSelectedCarrierIndex(0)
            setDeliveryFee(res.rates[0].fee)
          } else {
            setCarrierRates([])
            setDeliveryFee(0)
            setQuoteError(res.error || 'No delivery options are available for this route.')
          }
        } catch (error) {
          if (cancelled) return
          setCarrierRates([])
          setDeliveryFee(0)
          setQuoteError(error instanceof Error ? error.message : 'Unable to request a live delivery quote.')
        } finally {
          if (!cancelled) setIsCalculatingFee(false)
        }
      } else {
        setCarrierRates([])
        setDeliveryFee(0)
        setQuoteError(null)
        setIsCalculatingFee(false)
      }
    }
    calculateFee()
    return () => { cancelled = true }
  }, [
    storeId, productType, deliveryMethod, quoteCartKey,
    quoteAddressKey,
  ])

  const finalTotal = totalAmount + deliveryFee
  const selectedRate = carrierRates[selectedCarrierIndex]
  const hasCompleteDeliveryQuote = productType !== 'physical' ||
    deliveryMethod !== 'delivery' ||
    Boolean(selectedRate)

  const handleCheckout = async (formData: FormData) => {
    setLoading(true)
    setError(null)
    
    const cartData = items.map(item => ({ id: item.id, qty: item.qty }))
    formData.append('cart', JSON.stringify(cartData))
    formData.append('storeSlug', storeSlug)
    formData.append('deliveryMethod', deliveryMethod)
    if (carrierRates[selectedCarrierIndex] && deliveryMethod === 'delivery') {
      const selectedQuote = carrierRates[selectedCarrierIndex]
      formData.append('deliveryQuoteId', selectedQuote.quoteId)
      formData.append('deliveryQuote', JSON.stringify(selectedQuote))
    }
    
    try {
      const res = await processCheckout(formData)
      if (res?.error) {
        setError(res.error)
        setLoading(false)
      } else if (res?.url) {
        window.location.href = res.url
      } else {
        setError("An unexpected error occurred. Please try again.")
        setLoading(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed')
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <ShoppingBag className="h-24 w-24 mb-6 text-gray-200" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
        <p className="text-gray-500 mb-8 text-center max-w-md">Looks like you haven't added anything to your cart yet.</p>
        <Link 
          href={`/store/${storeSlug}`}
          className="px-8 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center">
          <Link href={`/store/${storeSlug}`} className="text-gray-500 hover:text-black flex items-center font-medium">
            <ArrowLeft className="h-5 w-5 mr-2" /> Back to Store
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Cart Items */}
          <div className="md:col-span-7 space-y-4">
            {items.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-200 flex gap-4 shadow-sm">
                <div className="w-24 h-24 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                  {item.image ? (
                    <img src={item.image} alt={item.name} loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag className="w-full h-full p-6 text-gray-300" />
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <h3 className="font-semibold text-gray-900 line-clamp-2">{item.name || 'Product Variant'}</h3>
                    <p className="text-gray-900 font-bold mt-1">₦{item.price.toLocaleString()}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border border-gray-200 rounded-md bg-gray-50">
                      <button type="button" onClick={() => updateQty(item.id, item.qty - 1)} className="p-1 px-3 hover:bg-gray-200 transition-colors"><Minus className="h-4 w-4"/></button>
                      <span className="px-3 text-sm font-semibold">{item.qty}</span>
                      <button type="button" onClick={() => updateQty(item.id, item.qty + 1)} className="p-1 px-3 hover:bg-gray-200 transition-colors"><Plus className="h-4 w-4"/></button>
                    </div>
                    <button type="button" onClick={() => removeFromCart(item.id)} className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors">Remove</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Checkout Form */}
          <div className="md:col-span-5">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm sticky top-24">
              <h2 className="text-xl font-bold mb-6">Payment Summary</h2>
              
              <div className="space-y-3 mb-6 pb-6 border-b border-gray-100">
                <div className="flex justify-between text-gray-600">
                  <span>Product subtotal</span>
                  <span>₦{totalAmount.toLocaleString()}</span>
                </div>
                
                {productType === 'physical' && (
                  <div className="flex justify-between text-gray-600 items-center">
                    <span>Delivery</span>
                    {deliveryMethod === 'delivery' ? (
                      <span className="flex items-center">
                        {isCalculatingFee ? (
                          <span className="flex items-center text-blue-600 font-medium animate-pulse">
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            Getting live quote...
                          </span>
                        ) : selectedRate ? (
                          <span className="font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-100">
                            + ₦{deliveryFee.toLocaleString()}
                          </span>
                        ) : quoteError ? (
                          <span className="text-red-500 text-sm">{quoteError}</span>
                        ) : (
                          <span className="text-sm italic text-gray-400">Select address on map</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-400">— Not selected</span>
                    )}
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-100 text-lg transition-all">
                  <span className="text-gray-900 font-semibold">Total Amount</span>
                  <div className="text-right">
                    {isCalculatingFee ? (
                      <div className="h-8 w-24 bg-gray-100 animate-pulse rounded-md ml-auto"></div>
                    ) : (
                      <span className={`font-bold text-2xl transition-colors ${hasCompleteDeliveryQuote ? 'text-black' : 'text-gray-400'}`}>
                        {hasCompleteDeliveryQuote ? `₦${finalTotal.toLocaleString()}` : `₦${totalAmount.toLocaleString()}`}
                      </span>
                    )}
                    {!hasCompleteDeliveryQuote && !isCalculatingFee && deliveryMethod === 'delivery' && (
                      <p className="text-xs text-orange-500 font-medium mt-1">Pending delivery calculation</p>
                    )}
                  </div>
                </div>
              </div>
              
              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form action={handleCheckout} className="space-y-6">
                
                {/* CUSTOMER INFORMATION */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Customer Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input 
                        type="text" 
                        name="name" 
                        placeholder="Enter your full name" 
                        required 
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 focus:bg-white transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <input 
                        type="email" 
                        name="email" 
                        placeholder="Enter your email" 
                        required 
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 focus:bg-white transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp / Phone Number</label>
                      <input 
                        type="tel" 
                        name="whatsapp" 
                        placeholder="e.g. +2348012345678" 
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* DELIVERY SELECTION (Physical Products Only) */}
                {productType === 'physical' && (
                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">How would you like to receive your order?</h3>
                    <div className="space-y-3">
                      <label className={`block p-4 border rounded-xl cursor-pointer transition-all ${deliveryMethod === 'delivery' ? 'border-black bg-gray-50 ring-1 ring-black' : 'border-gray-200 hover:border-gray-300'}`}>
                        <div className="flex items-start">
                          <input 
                            type="radio" 
                            name="deliveryMethod" 
                            value="delivery"
                            checked={deliveryMethod === 'delivery'}
                            onChange={() => setDeliveryMethod('delivery')}
                            className="hidden"
                          />
                          <div className="flex-shrink-0 h-5 w-5 rounded-full border border-gray-300 flex items-center justify-center mt-0.5">
                            {deliveryMethod === 'delivery' && <div className="h-2.5 w-2.5 rounded-full bg-black" />}
                          </div>
                          <div className="ml-3">
                            <span className="block text-sm font-semibold text-gray-900">Delivery</span>
                            <span className="block text-sm text-gray-500 mt-1">Have the product delivered to your address.</span>
                          </div>
                        </div>
                      </label>
                      
                      <label className={`block p-4 border rounded-xl cursor-pointer transition-all ${deliveryMethod === 'arrange' ? 'border-black bg-gray-50 ring-1 ring-black' : 'border-gray-200 hover:border-gray-300'}`}>
                        <div className="flex items-start">
                          <input 
                            type="radio" 
                            name="deliveryMethod" 
                            value="arrange"
                            checked={deliveryMethod === 'arrange'}
                            onChange={() => setDeliveryMethod('arrange')}
                            className="hidden"
                          />
                          <div className="flex-shrink-0 h-5 w-5 rounded-full border border-gray-300 flex items-center justify-center mt-0.5">
                            {deliveryMethod === 'arrange' && <div className="h-2.5 w-2.5 rounded-full bg-black" />}
                          </div>
                          <div className="ml-3">
                            <span className="block text-sm font-semibold text-gray-900">Arrange with seller</span>
                            <span className="block text-sm text-gray-500 mt-1">Contact the seller and arrange pickup/delivery directly.</span>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* DELIVERY ADDRESS FORM */}
                {productType === 'physical' && deliveryMethod === 'delivery' && (
                  <div className="pt-4 border-t border-gray-100">
                    <TerminalAddressForm 
                      type="delivery" 
                      hideContactInfo={true} 
                      onChange={setTerminalAddress}
                    />
                      
                      {/* CARRIER SELECTION */}
                      {terminalAddress?.locationConfirmed && terminalAddress?.state && terminalAddress?.city && (
                        <div className="mt-4 border-t border-gray-100 pt-4">
                          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                            Choose Delivery Option
                          </h4>
                          {isCalculatingFee ? (
                            <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-xl text-sm text-gray-500">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Getting delivery prices...
                            </div>
                          ) : carrierRates.length > 0 ? (
                            <div className="space-y-2">
                              {carrierRates.map((rate, i) => (
                                <label
                                  key={i}
                                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${selectedCarrierIndex === i ? 'border-black bg-gray-50 ring-1 ring-black' : 'border-gray-200 hover:border-gray-300'}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="radio"
                                      name="selectedCarrier"
                                      className="hidden"
                                      checked={selectedCarrierIndex === i}
                                      onChange={() => {
                                        setSelectedCarrierIndex(i)
                                        setDeliveryFee(rate.fee)
                                      }}
                                    />
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedCarrierIndex === i ? 'border-black' : 'border-gray-300'}`}>
                                      {selectedCarrierIndex === i && <div className="w-2 h-2 rounded-full bg-black" />}
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900">{rate.carrier}</p>
                                      <p className="text-xs text-gray-500">{rate.eta}</p>
                                    </div>
                                  </div>
                                  <span className="text-sm font-bold text-gray-900">₦{rate.fee.toLocaleString()}</span>
                                </label>
                              ))}
                            </div>
                          ) : quoteError ? (
                            <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-xl text-sm text-yellow-800">
                              {quoteError}
                            </div>
                          ) : null}
                        </div>
                      )}
                  </div>
                )}
                
                {/* ARRANGE WITH SELLER INFO */}
                {productType === 'physical' && deliveryMethod === 'arrange' && (
                  <div className="pt-4 border-t border-gray-100">
                     <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex gap-3">
                       <ShieldCheck className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                       <p className="text-sm text-gray-700">You'll arrange delivery or pickup directly with the seller. After payment, we'll provide the seller's relevant contact and order information.</p>
                     </div>
                  </div>
                )}
                <div className="mt-6 mb-2">
                  <p className="text-[11px] text-gray-500 text-center leading-relaxed">
                    By clicking "Pay", you agree to Maji's <Link href="#" className="underline hover:text-gray-800">Terms & Conditions</Link>. 
                    Payments are securely processed by Paystack and settled in accordance with their T+1 payout schedule.
                  </p>
                </div>
                
                <button 
                  type="submit" 
                  disabled={loading || (productType === 'physical' && deliveryMethod === 'delivery' && (
                    !terminalAddress?.locationConfirmed ||
                    !terminalAddress?.state ||
                    !terminalAddress?.city ||
                    !terminalAddress?.line1 ||
                    !terminalAddress?.houseNumber ||
                    !terminalAddress?.area ||
                    !terminalAddress?.lga ||
                    !terminalAddress?.landmark ||
                    !terminalAddress?.lat ||
                    !terminalAddress?.lng ||
                    !carrierRates[selectedCarrierIndex] ||
                    isCalculatingFee
                  ))}
                  className="w-full py-4 bg-black text-white rounded-lg font-bold text-lg hover:bg-gray-800 transition-colors flex justify-center items-center disabled:opacity-70 mt-4 shadow-md"
                >
                  {loading ? <Loader2 className="animate-spin h-6 w-6" /> : `Pay ₦${finalTotal.toLocaleString()}`}
                </button>
              </form>
              
              <p className="text-xs text-center text-gray-500 mt-6 flex items-center justify-center">
                 Secured by Paystack
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
