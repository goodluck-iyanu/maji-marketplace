'use client'

import { useState } from 'react'
import { Store, Package, Box, ArrowRight, Loader2 } from 'lucide-react'
import { createStoreAction } from './actions'

type Step = 'product_type' | 'store_name' | 'creating'

export function OnboardingWizard() {
  const [step, setStep] = useState<Step>('product_type')
  const [productType, setProductType] = useState<'physical' | 'digital' | 'both' | null>(null)
  const [storeName, setStoreName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleNext = () => {
    if (step === 'product_type' && productType) {
      setStep('store_name')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!storeName.trim()) return

    setStep('creating')
    setError(null)
    
    const result = await createStoreAction({ name: storeName, productType })
    
    if (result.error) {
      setError(result.error)
      setStep('store_name')
    }
    // if success, the action will redirect to /dashboard
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
          {step === 'creating' && "Creating your store..."}
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          {step === 'product_type' && "This helps us tailor your experience."}
          {step === 'store_name' && "You can always change your display name later."}
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
            onClick={() => setProductType('both')}
            className={`w-full flex items-center p-4 border rounded-lg transition-colors ${
              productType === 'both' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Store className="h-6 w-6 mr-4 text-gray-700" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Both</div>
              <div className="text-sm text-gray-500">I sell a mix of physical and digital goods.</div>
            </div>
          </button>

          <button
            onClick={handleNext}
            disabled={!productType}
            className="w-full mt-6 bg-black text-white rounded-md px-4 py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors flex items-center justify-center"
          >
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      )}

      {step === 'store_name' && (
        <form onSubmit={handleSubmit} className="space-y-6">
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
          
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
              {error}
            </div>
          )}

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
              Create Store
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
