'use client'

import { useState, useActionState, useRef } from 'react'
import { ArrowLeft, ImagePlus, X, Loader2, Save } from 'lucide-react'
import Link from 'next/link'
import { createProductAction } from '../actions'

const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new window.Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 1200
        const MAX_HEIGHT = 1200
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height
            height = MAX_HEIGHT
          }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }))
          } else {
            reject(new Error('Canvas to Blob failed'))
          }
        }, 'image/jpeg', 0.8)
      }
      img.onerror = (e) => reject(e)
    }
    reader.onerror = (e) => reject(e)
  })
}

export default function NewProductForm({ productType }: { productType: string | null }) {
  const [state, formAction, isPending] = useActionState(createProductAction, null)
  const [isCompressing, setIsCompressing] = useState(false)
  const isLoading = isPending || isCompressing

  const [photos, setPhotos] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (photos.length + files.length > 5) {
      alert('Maximum 5 images allowed')
      return
    }
    setPhotos(prev => [...prev, ...files])
  }

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/products" className="text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Add New Product</h1>
      </div>

      {state?.error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm font-medium animate-in fade-in">
          {state.error}
        </div>
      )}

      <form action={async (formData) => {
        setIsCompressing(true)
        try {
          const compressedFormData = new FormData()
          // Copy all non-image fields (original form uses 'images' name for photos, wait! Let's check actions.ts for what it expects)
          for (const [key, value] of formData.entries()) {
            if (key !== 'images') {
              compressedFormData.append(key, value)
            }
          }
          
          for (const file of photos) {
            try {
              const compressed = await compressImage(file)
              // createProductAction (standard) expects 'images'
              compressedFormData.append('images', compressed)
            } catch (e) {
              compressedFormData.append('images', file)
            }
          }
          
          formAction(compressedFormData)
        } finally {
          setIsCompressing(false)
        }
      }} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 space-y-6">
            
            {/* Image Uploader */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Product Images (Min 2, Max 5)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {photos.map((file, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                    <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => removePhoto(idx)}
                      className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-sm"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                
                {photos.length < 5 && (
                  <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 hover:text-black hover:border-black hover:bg-gray-50 cursor-pointer transition-colors bg-gray-50/50">
                    <ImagePlus className="h-8 w-8 mb-2" />
                    <span className="text-sm font-medium">Add Image</span>
                    <input 
                      type="file" 
                      name="images" 
                      multiple 
                      accept="image/jpeg, image/png, image/webp" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handlePhotoUpload}
                    />
                  </label>
                )}
              </div>
            </div>
            
            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
              <input 
                type="text" 
                name="name"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black" 
                placeholder="e.g. Handmade Ceramic Vase"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                name="description"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black" 
                placeholder="Describe your product..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦)</label>
                <input 
                  type="number" 
                  name="price"
                  min="0"
                  step="0.01"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black" 
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                <input 
                  type="number" 
                  name="stock"
                  min="0"
                  defaultValue={0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount % (Optional)</label>
                <input 
                  type="number" 
                  name="discount_percent"
                  min="0"
                  max="100"
                  defaultValue={0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black" 
                  placeholder="e.g. 20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
                    <select 
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                      defaultValue={productType === 'digital' ? 'true' : 'false'}
                    >
                      <option value="false">Physical Product</option>
                      <option value="true">Digital Product</option>
                    </select>
                    <input type="hidden" name="is_digital" value={productType === 'digital' ? 'true' : 'false'} />
                 </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select name="is_published" className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="true">Published (Active)</option>
                    <option value="false">Draft (Hidden)</option>
                  </select>
               </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            type="submit" 
            disabled={isLoading}
            className="bg-black text-white px-8 py-3 rounded-md font-medium hover:bg-gray-800 transition-colors flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Save className="h-5 w-5 mr-2" />
            )}
            {isLoading ? 'Publishing...' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  )
}
