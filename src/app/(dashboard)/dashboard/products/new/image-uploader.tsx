'use client'

import { useState } from 'react'
import { ImagePlus, X } from 'lucide-react'

export function ImageUploader() {
  const [previews, setPreviews] = useState<string[]>([])
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + previews.length > 5) {
      alert('Maximum 5 images allowed')
      return
    }
    
    const newPreviews = files.map(file => URL.createObjectURL(file))
    setPreviews(prev => [...prev, ...newPreviews])
  }

  const removeImage = (index: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Product Images (Min 2, Max 5)
      </label>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {previews.map((preview, idx) => (
          <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <button 
              type="button" 
              onClick={() => removeImage(idx)}
              className="absolute top-2 right-2 bg-white/80 rounded-full p-1 text-red-600 hover:bg-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        
        {previews.length < 5 && (
          <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:text-black hover:border-black cursor-pointer transition-colors bg-gray-50">
            <ImagePlus className="h-8 w-8 mb-2" />
            <span className="text-sm font-medium">Add Image</span>
            <input 
              type="file" 
              name="images" 
              multiple 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange}
            />
          </label>
        )}
      </div>
      
      {previews.length > 0 && previews.length < 2 && (
        <p className="text-sm text-red-600">Please select at least 2 images.</p>
      )}
    </div>
  )
}

