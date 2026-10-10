import { AuthForms } from './auth-forms'
import Link from 'next/link'
import { MajiLogo, MajiStorefrontBadge } from '@/components/brand/maji-brand'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; error?: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-[#FAF8F5] maji-dot-bg relative overflow-hidden">
      {/* Magic UI Ambient Ember Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 h-80 w-96 rounded-full blur-3xl opacity-20"
        style={{
          background: 'radial-gradient(circle, #F05A28 0%, #FF8559 55%, transparent 100%)',
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Official Animated Maji Lockup + Heading */}
        <div className="flex flex-col items-center justify-center space-y-2.5 mb-7">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 border border-[#111111]/[0.07] shadow-xs hover:border-[#F05A28]/40 transition-all"
            aria-label="Maji Home"
          >
            <MajiLogo
              variant="horizontal"
              colorway="ember-duotone-light"
              size={42}
              animation="splash"
            />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-[#111111] text-center pt-1">
            Welcome to Maji
          </h1>
          <p className="text-sm text-neutral-500 text-center">
            Create your online store in minutes.
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-3xl border border-[#111111]/[0.08] shadow-xl shadow-[#111111]/[0.04] p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#F05A28] via-[#FF8559] to-[#F05A28]" />
          <AuthForms
            defaultMode={params?.mode === 'signup' ? 'signup' : 'login'}
            initialError={params?.error}
          />
        </div>

        {/* Footer */}
        <div className="mt-7 flex flex-col items-center space-y-3">
          <p className="text-xs text-center text-neutral-400">
            By continuing, you agree to Maji&apos;s Terms of Service and Privacy Policy.
          </p>
          <MajiStorefrontBadge height={28} className="opacity-85" />
        </div>
      </div>
    </div>
  )
}
