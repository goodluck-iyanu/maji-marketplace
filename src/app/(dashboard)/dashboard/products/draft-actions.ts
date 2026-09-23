'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Saves a product draft for the current user's store.
 * @param productType e.g., 'books', 'digital', 'fashion'
 * @param data The JSON data representing the component state (excluding files)
 */
export async function saveDraftAction(productType: string, data: any) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!store) return { error: 'Store not found' }

    const { error } = await supabase
      .from('product_drafts')
      .upsert({
        store_id: store.id,
        product_type: productType,
        draft_data: data,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'store_id, product_type'
      })

    if (error) {
      console.error('Save draft error:', error)
      return { error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Unknown error' }
  }
}

/**
 * Retrieves a product draft for the current user's store.
 */
export async function getDraftAction(productType: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!store) return { error: 'Store not found' }

    const { data, error } = await supabase
      .from('product_drafts')
      .select('draft_data')
      .eq('store_id', store.id)
      .eq('product_type', productType)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.error('Get draft error:', error)
      return { error: error.message }
    }

    return { success: true, data: data?.draft_data || null }
  } catch (err: any) {
    return { error: err.message || 'Unknown error' }
  }
}

/**
 * Clears a product draft for the current user's store.
 */
export async function clearDraftAction(productType: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!store) return { error: 'Store not found' }

    const { error } = await supabase
      .from('product_drafts')
      .delete()
      .eq('store_id', store.id)
      .eq('product_type', productType)

    if (error) {
      console.error('Clear draft error:', error)
      return { error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Unknown error' }
  }
}

