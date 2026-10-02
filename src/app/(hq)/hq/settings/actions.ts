'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updatePlatformSettings(formData: FormData) {
  const supabase = await createClient()
  
  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
    
  const { data: adminRole } = await supabase.from('admin_users').select('role').eq('user_id', user.id).single()
  if (!adminRole) throw new Error('Unauthorized')

  const commissionPercentage = formData.get('commissionPercentage')
  const commissionFixed = formData.get('commissionFixed')

  const { error } = await supabase
    .from('platform_settings')
    .update({
      commission_percentage: commissionPercentage,
      commission_fixed_fee: commissionFixed,
      updated_at: new Date().toISOString()
    })
    .eq('id', '00000000-0000-0000-0000-000000000001')

  if (error) {
    console.error('Error updating settings:', error)
    throw new Error('Failed to update settings')
  }

  revalidatePath('/hq/settings')
}
