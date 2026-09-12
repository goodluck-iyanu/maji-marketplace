'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createStoreAction(data: { name: string, productType: string | null }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Basic slugify
  const baseSlug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') || 'store'

  // Call the postgres function to get a unique slug
  const { data: uniqueSlug, error: slugError } = await supabase
    .rpc('generate_unique_store_slug', { base_slug: baseSlug })

  if (slugError) {
    console.error('Slug error:', slugError)
    return { error: 'Failed to generate store URL.' }
  }

  // Insert the store
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .insert({
      user_id: user.id,
      name: data.name,
      slug: uniqueSlug,
    })
    .select('id')
    .single()

  if (storeError) {
    console.error('Store error:', storeError)
    // Check for unique constraint violation on slug (though RPC should prevent it)
    if (storeError.code === '23505') {
      return { error: 'This store name is currently unavailable. Please try another.' }
    }
    return { error: 'Could not create store. Please try again.' }
  }

  // Initialize store settings
  const { error: settingsError } = await supabase
    .from('store_settings')
    .insert({
      store_id: store.id,
      // You can store productType in store_settings if added to schema, or just use it to setup defaults
    })

  if (settingsError) {
    console.error('Settings error:', settingsError)
    // Non-fatal, they can configure it later
  }

  // Redirect to their dashboard
  redirect('/dashboard')
}
