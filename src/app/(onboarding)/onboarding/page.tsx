import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingWizard } from './onboarding-wizard'

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
    .single()

  if (store) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-sm border border-gray-100">
        <OnboardingWizard />
      </div>
    </div>
  )
}
