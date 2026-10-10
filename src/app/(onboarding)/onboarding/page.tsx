import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingWizard } from './onboarding-wizard'
import { MajiLogo } from '@/components/brand/maji-brand'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if they already have a store
  const { data: store } = await supabase
    .from('stores')
    .select('slug')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (store) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] maji-dot-bg flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 h-80 w-96 rounded-full blur-3xl opacity-20"
        style={{
          background: 'radial-gradient(circle, #F05A28 0%, #FF8559 55%, transparent 100%)',
        }}
      />

      <div className="relative z-10 mb-6 flex flex-col items-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-2.5 border border-[#111111]/[0.07] shadow-xs"
        >
          <MajiLogo variant="horizontal" colorway="ember-duotone-light" size={34} />
        </Link>
      </div>

      <div className="relative z-10 max-w-xl w-full space-y-8 bg-white p-7 sm:p-10 rounded-3xl shadow-xl shadow-[#111111]/[0.04] border border-[#111111]/[0.08] overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#F05A28] via-[#FF8559] to-[#F05A28]" />
        <OnboardingWizard />
      </div>
    </div>
  )
}
