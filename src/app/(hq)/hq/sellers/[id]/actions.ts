'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function toggleStoreStatus(formData: FormData) {
  const storeId = formData.get('storeId') as string
  const currentStatus = formData.get('currentStatus') === 'true'

  if (!storeId) throw new Error('Store ID required')

  const { error } = await supabaseAdmin
    .from('stores')
    .update({ is_active: !currentStatus })
    .eq('id', storeId)

  if (error) {
    console.error('Failed to toggle store status', error)
    throw new Error('Failed to update store status')
  }

  revalidatePath(`/hq/sellers/${storeId}`)
  revalidatePath('/hq/sellers')
}
