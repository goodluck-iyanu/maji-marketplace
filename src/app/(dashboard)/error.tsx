'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCcw } from 'lucide-react'
import { MajiLogo } from '@/components/brand/maji-brand'

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
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300 min-h-[60vh]">
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#111111]/[0.08] p-8 shadow-sm">
        <div className="w-14 h-14 bg-[#F05A28]/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="h-7 w-7 text-[#F05A28]" />
        </div>

        <h2 className="text-xl font-bold text-[#111111] mb-2">Something went wrong</h2>
        <p className="text-sm text-neutral-500 max-w-sm mx-auto mb-6">
          We ran into an issue loading this section of your dashboard. You can reload or head back to your overview.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="flex justify-center items-center px-5 py-2.5 bg-[#111111] text-white rounded-xl text-sm font-semibold hover:bg-[#F05A28] transition-colors cursor-pointer"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Reload Section
          </button>

          <Link
            href="/dashboard"
            className="flex justify-center items-center px-5 py-2.5 bg-[#FAF8F5] text-[#111111] border border-[#111111]/10 rounded-xl text-sm font-semibold hover:bg-neutral-100 transition-colors"
          >
            Go to Overview
          </Link>
        </div>

        <div className="mt-6 pt-5 border-t border-neutral-100 flex justify-center">
          <MajiLogo variant="horizontal" colorway="ember-duotone-light" size={22} />
        </div>
      </div>
    </div>
  )
}
