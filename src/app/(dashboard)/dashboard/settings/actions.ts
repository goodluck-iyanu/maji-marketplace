'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveSettingsAction(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!store) throw new Error('Store not found')

  const name = formData.get('name') as string
  const about_text = formData.get('about_text') as string
  const primary_color = formData.get('primary_color') as string
  const secondary_color = formData.get('secondary_color') as string
  const layout = formData.get('layout') as string

  console.log('--- SAVING SETTINGS ---')
  console.log('primary_color:', primary_color)
  console.log('secondary_color:', secondary_color)
  console.log('layout:', layout)
  console.log('store.id:', store.id)

  // Update store name
  if (name) {
    await supabase.from('stores').update({ name }).eq('id', store.id)
  }

  const { createClient: createAdminClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabaseAdmin.from('store_settings').upsert({
    store_id: store.id,
    about_text,
    primary_color,
    secondary_color,
    layout,
  }, { onConflict: 'store_id' })

  if (error) {
    console.error('Upsert settings error:', error)
    throw new Error('Failed to save settings')
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

