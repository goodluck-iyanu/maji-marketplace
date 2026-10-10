'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react'

export function ProductImageCarousel({ images, productName }: { images: { image_url: string }[], productName: string }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Auto-play slideshow
  useEffect(() => {
    if (!images || images.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, 5000) // Change image every 5 seconds

    return () => clearInterval(interval)
  }, [images])

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square bg-[#FAF8F5] rounded-2xl overflow-hidden flex items-center justify-center relative border border-gray-200/80">
        <ShoppingCart className="h-16 w-16 text-gray-300" />
      </div>
    )
  }

  const nextImage = () => setCurrentIndex((prev) => (prev + 1) % images.length)
  const prevImage = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)

  return (
    <div className="aspect-square rounded-2xl overflow-hidden relative group border border-gray-200/80 bg-[#FAF8F5]">
      {/* Images container */}
      <div 
        className="flex w-full h-full transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((img, idx) => (
          <img 
            key={idx}
            src={img.image_url} 
            alt={`${productName} - Image ${idx + 1}`} 
            className="w-full h-full object-cover flex-shrink-0"
          />
        ))}
      </div>

      {/* Navigation Buttons */}
      {images.length > 1 && (
        <>
          <button 
            onClick={prevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-[#111111] hover:text-white rounded-full flex items-center justify-center text-[#111111] shadow-md opacity-0 group-hover:opacity-100 transition-all"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          
          <button 
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-[#111111] hover:text-white rounded-full flex items-center justify-center text-[#111111] shadow-md opacity-0 group-hover:opacity-100 transition-all"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-xs shadow-xs">
            {images.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-[#F05A28] w-5' : 'bg-[#111111]/30 w-2 hover:bg-[#111111]/60'}`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

