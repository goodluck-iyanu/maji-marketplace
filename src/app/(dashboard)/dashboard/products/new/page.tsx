import { ArrowLeft } from 'lucide-react'
import { SubmitButton } from './submit-button'
import Link from 'next/link'
import { createProductAction } from '../actions'

import { ImageUploader } from './image-uploader'

export default function NewProductPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/products" className="text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Add New Product</h1>
      </div>

      <form action={createProductAction} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 space-y-6">
            <ImageUploader />
            
            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
              <input 
                type="text" 
                name="name"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black" 
                placeholder="e.g. Nike Air Force 1"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
                  <select name="is_digital" className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="false">Physical Product</option>
                    <option value="true">Digital Product</option>
                  </select>
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
          <SubmitButton />
        </div>
      </form>
    </div>
  )
}

