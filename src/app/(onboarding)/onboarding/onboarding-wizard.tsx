'use client'

import { useState, useActionState, useEffect } from 'react'
import { Store, Package, Box, ArrowRight, Loader2 } from 'lucide-react'
import { createStoreAction } from './actions'

type Step = 'product_type' | 'store_name' | 'store_details' | 'creating'

export function OnboardingWizard() {
  const [step, setStep] = useState<Step>('product_type')
  const [productType, setProductType] = useState<'physical' | 'digital' | null>(null)
  const [storeName, setStoreName] = useState('')
  
  const [state, formAction] = useActionState(createStoreAction, null)

  useEffect(() => {
    // If the formAction finishes but has an error, go back to details
    if (state?.error) {
      setStep('store_details')
    }
  }, [state])

  const handleNextToName = () => {
    if (productType) setStep('store_name')
  }

  const handleNextToDetails = (e: React.FormEvent) => {
    e.preventDefault()
    if (storeName.trim()) setStep('store_details')
  }

  const handleSubmit = () => {
    setStep('creating')
    // The form submission will trigger formAction automatically
  }

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <div className="mx-auto h-12 w-12 bg-black text-white rounded-full flex items-center justify-center mb-4">
          <Store className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          {step === 'product_type' && "What are you selling?"}
          {step === 'store_name' && "Name your store"}
          {step === 'store_details' && "Store Details (Optional)"}
          {step === 'creating' && "Creating your store..."}
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          {step === 'product_type' && "This helps us tailor your experience."}
          {step === 'store_name' && "You can always change your display name later."}
          {step === 'store_details' && "Add your logo, address, and social links to complete your storefront."}
          {step === 'creating' && "Hold on a second, preparing your dashboard."}
        </p>
      </div>

      {step === 'product_type' && (
        <div className="space-y-4">
          <button
            onClick={() => setProductType('physical')}
            className={`w-full flex items-center p-4 border rounded-lg transition-colors ${
              productType === 'physical' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Box className="h-6 w-6 mr-4 text-gray-700" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Physical Products</div>
              <div className="text-sm text-gray-500">Clothing, electronics, crafts, etc.</div>
            </div>
          </button>
          
          <button
            onClick={() => setProductType('digital')}
            className={`w-full flex items-center p-4 border rounded-lg transition-colors ${
              productType === 'digital' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Package className="h-6 w-6 mr-4 text-gray-700" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Digital Products</div>
              <div className="text-sm text-gray-500">E-books, courses, software, etc.</div>
            </div>
          </button>

          <button
            onClick={handleNextToName}
            disabled={!productType}
            className="w-full mt-6 bg-black text-white rounded-md px-4 py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors flex items-center justify-center"
          >
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      )}

      {step === 'store_name' && (
        <form onSubmit={handleNextToDetails} className="space-y-6">
          <div>
            <label htmlFor="store-name" className="block text-sm font-medium text-gray-700 mb-1">
              Store Name
            </label>
            <input
              id="store-name"
              type="text"
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="e.g. Jane Fashion"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-shadow"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep('product_type')}
              className="w-1/3 py-3 px-4 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!storeName.trim()}
              className="w-2/3 bg-black text-white rounded-md px-4 py-3 font-medium disabled:opacity-50 hover:bg-gray-800 transition-colors flex items-center justify-center"
            >
              Continue
            </button>
          </div>
        </form>
      )}

      {step === 'store_details' && (
        <form action={formAction} onSubmit={handleSubmit} className="space-y-5 text-left">
          <input type="hidden" name="storeName" value={storeName} />
          <input type="hidden" name="productType" value={productType || ''} />

          {state?.error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
              {state.error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Store Logo (Optional)</label>
            <input 
              type="file" 
              name="logo"
              accept="image/*"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black text-sm" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address (Optional)</label>
            <textarea
              name="address"
              rows={2}
              placeholder="Your physical store address"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black transition-shadow text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number (Optional)</label>
            <input
              type="text"
              name="whatsapp"
              placeholder="+2349012345678"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black transition-shadow text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">TikTok Username (Optional)</label>
            <div className="flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">@</span>
              <input
                type="text"
                name="tiktok"
                placeholder="yourstore"
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black transition-shadow text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram Username (Optional)</label>
            <div className="flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">@</span>
              <input
                type="text"
                name="instagram"
                placeholder="yourstore"
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black transition-shadow text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Twitter Username (Optional)</label>
            <div className="flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">@</span>
              <input
                type="text"
                name="twitter"
                placeholder="yourstore"
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black transition-shadow text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Facebook Username (Optional)</label>
            <div className="flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">fb.com/</span>
              <input
                type="text"
                name="facebook"
                placeholder="yourstore"
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black transition-shadow text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setStep('store_name')}
              className="w-1/3 py-3 px-4 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              className="w-2/3 bg-black text-white rounded-md px-4 py-3 font-medium hover:bg-gray-800 transition-colors flex items-center justify-center"
            >
              Finish & Create
            </button>
          </div>
        </form>
      )}
      
      {step === 'creating' && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}
    </div>
  )
}
