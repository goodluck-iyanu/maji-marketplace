'use client'

import { useCart } from '../cart-context'
import { Minus, Plus, ShoppingBag, Loader2, ArrowLeft, AlertCircle, ShieldCheck, ChevronDown } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { processCheckout } from '../checkout/actions'
import { getDeliveryQuotes } from '../checkout/delivery-actions'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import { NG_STATES_CITIES, NG_STATES } from '@/lib/ng-cities'

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
  const [storeId, setStoreId] = useState<string | null>(null)
  const [selectedState, setSelectedState] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  
  // OpenStreetMap Autocomplete State
  const [addressQuery, setAddressQuery] = useState('')
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  
  useEffect(() => {
    if (addressQuery.length < 3) {
      setAddressSuggestions([])
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true)
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressQuery)}&format=json&countrycodes=ng&limit=5`, {
          headers: { 'Accept-Language': 'en' }
        })
        const data = await response.json()
        setAddressSuggestions(data)
      } catch (error) {
        console.error('Error fetching addresses:', error)
      } finally {
        setIsSearching(false)
      }
    }, 600)

    return () => clearTimeout(delayDebounceFn)
  }, [addressQuery])

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
    async function calculateFee() {
      if (storeId && selectedState && selectedCity && productType === 'physical' && deliveryMethod === 'delivery') {
        setIsCalculatingFee(true)
        const res = await getDeliveryQuotes(storeId, selectedState, selectedCity)
        if (res.fee) {
          setDeliveryFee(res.fee)
        } else {
          setDeliveryFee(0) // Fallback if API fails
        }
        setIsCalculatingFee(false)
      } else {
        setDeliveryFee(0)
      }
    }
    calculateFee()
  }, [storeId, selectedState, selectedCity, productType, deliveryMethod])

  const finalTotal = totalAmount + deliveryFee

  const handleCheckout = async (formData: FormData) => {
    setLoading(true)
    setError(null)
    
    const cartData = items.map(item => ({ id: item.id, qty: item.qty }))
    formData.append('cart', JSON.stringify(cartData))
    formData.append('storeSlug', storeSlug)
    formData.append('deliveryMethod', deliveryMethod)
    formData.append('deliveryFee', deliveryFee.toString())
    
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
    } catch (err: any) {
      setError(err.message || 'Checkout failed')
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
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
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
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery</span>
                    {deliveryMethod === 'delivery' ? (
                      <span>₦{deliveryFee.toLocaleString()}</span>
                    ) : (
                      <span className="text-gray-400">— Not selected</span>
                    )}
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-100 text-lg">
                  <span className="text-gray-900 font-semibold">Total Amount</span>
                  <span className="font-bold text-2xl text-gray-900">₦{finalTotal.toLocaleString()}</span>
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
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Delivery Address</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                          <select 
                            name="state" 
                            required 
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 focus:bg-white transition-colors"
                            value={selectedState}
                            onChange={(e) => { setSelectedState(e.target.value); setSelectedCity('') }}
                          >
                            <option value="">Select state</option>
                            {NG_STATES.map(state => (
                              <option key={state} value={state}>{state}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">City / Area</label>
                          <select 
                            name="area" 
                            required
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 focus:bg-white transition-colors"
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                            disabled={!selectedState}
                          >
                            <option value="">{selectedState ? 'Select city' : 'Select state first'}</option>
                            {(NG_STATES_CITIES[selectedState] ?? []).map(city => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Delivery Address</label>
                        <input 
                          type="text" 
                          name="address" 
                          value={addressQuery}
                          onChange={(e) => {
                            setAddressQuery(e.target.value)
                            setShowSuggestions(true)
                          }}
                          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                          placeholder="Enter your full street address" 
                          required 
                          autoComplete="off"
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 focus:bg-white transition-colors" 
                        />
                        {showSuggestions && addressSuggestions.length > 0 && (
                          <ul className="absolute z-50 w-full bg-white border border-gray-200 shadow-lg rounded-lg mt-1 max-h-60 overflow-auto">
                            {addressSuggestions.map((suggestion, index) => (
                              <li 
                                key={index} 
                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 border-b border-gray-50 last:border-0"
                                onClick={() => {
                                  setAddressQuery(suggestion.display_name)
                                  setShowSuggestions(false)
                                }}
                              >
                                {suggestion.display_name}
                              </li>
                            ))}
                          </ul>
                        )}
                        {showSuggestions && isSearching && addressQuery.length >= 3 && addressSuggestions.length === 0 && (
                           <div className="absolute z-50 w-full bg-white border border-gray-200 shadow-lg rounded-lg mt-1 px-4 py-3 text-sm text-gray-500">
                             Searching...
                           </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nearest Bus Stop / Landmark</label>
                        <input type="text" name="landmark" placeholder="e.g. Ikeja Along Bus Stop" required className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 focus:bg-white transition-colors" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Instructions <span className="text-gray-400 font-normal">(Optional)</span></label>
                        <input type="text" name="instructions" placeholder="e.g. Call me when you arrive" className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 focus:bg-white transition-colors" />
                      </div>
                      
                      {selectedState && selectedCity && (
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl mt-4 transition-all">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-blue-900">Delivery Fee</span>
                            <span className="font-bold text-blue-900">
                              {isCalculatingFee ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> : deliveryFee > 0 ? `₦${deliveryFee.toLocaleString()}` : 'Calculating...'}
                            </span>
                          </div>
                          <p className="text-sm text-blue-700">Estimated delivery: 2-3 business days</p>
                        </div>
                      )}
                    </div>
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
                
                <button 
                  type="submit" 
                  disabled={loading}
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
