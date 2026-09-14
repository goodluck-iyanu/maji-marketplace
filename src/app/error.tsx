'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCcw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service in production
    console.error('Application Error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops, something went wrong!</h1>
        <p className="text-gray-500 mb-8">
          We encountered an unexpected error while trying to load this page. Our team has been notified.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => reset()}
            className="w-full flex justify-center items-center px-4 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Try Again
          </button>
          
          <Link
            href="/dashboard"
            className="w-full flex justify-center items-center px-4 py-3 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
