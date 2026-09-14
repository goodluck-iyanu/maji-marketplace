'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCcw } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard Error:', error)
  }, [error])

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500 min-h-[60vh]">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
      <p className="text-gray-500 max-w-md mx-auto mb-8">
        We ran into an issue loading this section of your dashboard. You can try reloading, or head back to the overview.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={() => reset()}
          className="flex justify-center items-center px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          <RefreshCcw className="h-4 w-4 mr-2" />
          Reload Section
        </button>
        
        <Link
          href="/dashboard"
          className="flex justify-center items-center px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Go to Overview
        </Link>
      </div>
    </div>
  )
}
