'use client'

import Link from 'next/link'
import { FileQuestion, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-gray-100">
        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="w-12 h-12" />
        </div>
        
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">404</h1>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Page Not Found</h2>
        
        <p className="text-gray-500 mb-8 leading-relaxed">
          Oops! It looks like the page you are looking for doesn't exist. Please check the link and try again later.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => {
              if (typeof window !== 'undefined') window.history.back()
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
          
          <Link 
            href="/"
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors shadow-sm"
          >
            <Home className="w-4 h-4" /> Home
          </Link>
        </div>
      </div>
    </div>
  )
}
