'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'

export async function createProductAction(formData: FormData) {
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
  const description = formData.get('description') as string
  const price = parseFloat(formData.get('price') as string)
  const isDigital = formData.get('is_digital') === 'true'
  const isPublished = formData.get('is_published') === 'true'
  const stock = parseInt(formData.get('stock') as string) || 0

  // 1. Get images
  const imageFiles = formData.getAll('images') as File[]
  const validImages = imageFiles.filter(f => f.size > 0 && f.name)
  
  if (validImages.length > 0 && validImages.length < 2) {
    throw new Error('Please upload at least 2 images')
  }

  // Basic slugify
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'product'
  const uniqueSlug = `${baseSlug}-${Math.floor(Math.random() * 10000)}`

  // 2. Insert product first to get ID
  const { data: product, error } = await supabase.from('products').insert({
    store_id: store.id,
    name,
    slug: uniqueSlug,
    description,
    price,
    is_digital: isDigital,
    stock: isDigital ? 0 : stock,
    is_published: isPublished,
  }).select('id').single()

  if (error || !product) {
    console.error('Failed to create product:', error)
    throw new Error('Failed to create product')
  }

  // 3. Upload images
  if (validImages.length >= 2) {
    const imageUrls = []
    for (let i = 0; i < validImages.length; i++) {
      const file = validImages[i]
      const fileExt = file.name.split('.').pop()
      const fileName = `${product.id}/${i}-${Math.random().toString(36).substring(7)}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file)
        
      if (!uploadError && uploadData) {
        const { data: publicUrl } = supabase.storage.from('product-images').getPublicUrl(fileName)
        imageUrls.push(publicUrl.publicUrl)
      }
    }
    
    if (imageUrls.length > 0) {
      const imagesToInsert = imageUrls.map((url, idx) => ({
        product_id: product.id,
        image_url: url,
        display_order: idx
      }))
      
      const { error: insertError } = await supabase.from('product_images').insert(imagesToInsert)
      if (insertError) {
        console.error('Failed to insert product images', insertError)
      }
    }
  }

  redirect('/dashboard/products')
}

export async function deleteProductAction(productId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Verify ownership implicitly via RLS
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)

  if (error) {
    console.error('Delete product error:', error)
    return { error: 'Failed to delete product' }
  }
  
  return { success: true }
}

export async function togglePublishProductAction(productId: string, currentStatus: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('products')
    .update({ is_published: !currentStatus })
    .eq('id', productId)

  if (error) {
    console.error('Toggle publish error:', error)
    return { error: 'Failed to update product status' }
  }
  
  return { success: true }
}

export async function updateStockAction(productId: string, newStock: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('products')
    .update({ stock: newStock })
    .eq('id', productId)

  if (error) {
    console.error('Update stock error:', error)
    return { error: 'Failed to update stock' }
  }
  
  return { success: true }
}

export async function editProductAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const productId = formData.get('productId') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const price = parseFloat(formData.get('price') as string)
  const isDigital = formData.get('is_digital') === 'true'

  if (!productId || !name || !price) {
    throw new Error('Missing required fields')
  }

  const { error } = await supabase
    .from('products')
    .update({
      name,
      description,
      price,
      is_digital: isDigital
    })
    .eq('id', productId)

  if (error) {
    console.error('Edit product error:', error)
    throw new Error('Failed to edit product')
  }

  redirect('/dashboard/products')
}
