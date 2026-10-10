'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCcw } from 'lucide-react'
import { MajiLogo } from '@/components/brand/maji-brand'

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
    <div className="min-h-screen bg-[#FAF8F5] maji-dot-bg flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-[#111111]/[0.04] border border-[#111111]/[0.08] p-8 text-center animate-in fade-in zoom-in duration-300">
        <div className="mx-auto w-16 h-16 bg-[#F05A28]/10 rounded-2xl flex items-center justify-center mb-5">
          <AlertTriangle className="h-8 w-8 text-[#F05A28]" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[#111111] mb-2">
          Something went wrong
        </h1>
        <p className="text-sm text-neutral-500 mb-4">
          We encountered an unexpected error while loading this page.
        </p>
        <div className="bg-red-50/80 border border-red-100 text-red-700 p-3.5 rounded-xl text-xs text-left font-mono break-all mb-6">
          {error.message || 'Unknown error'}
        </div>

        <div className="space-y-3">
          <button
            onClick={() => reset()}
            className="w-full flex justify-center items-center px-4 py-3 bg-[#111111] text-white rounded-xl text-sm font-semibold hover:bg-[#F05A28] transition-colors cursor-pointer"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Try Again
          </button>

          <Link
            href="/dashboard"
            className="w-full flex justify-center items-center px-4 py-3 bg-[#FAF8F5] text-[#111111] border border-[#111111]/10 rounded-xl text-sm font-semibold hover:bg-neutral-100 transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>

        <div className="mt-7 pt-5 border-t border-neutral-100 flex justify-center">
          <MajiLogo variant="horizontal" colorway="ember-duotone-light" size={24} />
        </div>
      </div>
    </div>
  )
}
