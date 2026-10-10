import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { MajiLogo } from '@/components/brand/maji-brand'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] maji-dot-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full blur-3xl opacity-20"
        style={{
          background: 'radial-gradient(circle, #F05A28 0%, #FF8559 60%, transparent 100%)',
        }}
      />

      <div className="relative z-10 w-full max-w-md rounded-3xl bg-white border border-[#111111]/[0.08] p-8 sm:p-10 text-center shadow-xl shadow-[#111111]/[0.03]">
        <div className="mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-[#FAF8F5] border border-[#111111]/[0.06]">
          <MajiLogo variant="symbol" colorway="ember-duotone-light" size={52} animation="rocker" />
        </div>

        <span className="inline-flex items-center rounded-full bg-[#F05A28]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#F05A28] mb-3">
          404 · Storefront Not Found
        </span>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111] mb-3">
          We couldn’t find that page
        </h1>

        <p className="text-sm text-neutral-500 leading-relaxed mb-8">
          The page or storefront link you followed doesn’t exist or may have moved. Check the URL or return to Maji home.
        </p>

        <Link
          href="/"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#111111] px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#F05A28] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Maji Home
        </Link>

        <div className="mt-8 pt-6 border-t border-neutral-100 flex justify-center">
          <MajiLogo variant="horizontal" colorway="ember-duotone-light" size={26} />
        </div>
      </div>
    </div>
  )
}
