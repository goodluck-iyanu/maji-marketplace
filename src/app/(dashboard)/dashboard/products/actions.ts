'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { v4 as uuidv4 } from 'uuid'

export async function createProductAction(prevState: any, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!store) return { error: 'Store not found' }

  const name = (formData.get('name') as string) || ''
  const description = (formData.get('description') as string) || ''
  const priceRaw = formData.get('price')
  const price = priceRaw ? parseFloat(priceRaw as string) : 0
  const isDigital = formData.get('is_digital') === 'true'
  const isPublished = formData.get('is_published') === 'true'
  const stockRaw = formData.get('stock')
  const stock = stockRaw ? parseInt(stockRaw as string) : 0
  const discountRaw = formData.get('discount_percent')
  const discount_percent = discountRaw ? parseInt(discountRaw as string) : 0

  if (!name.trim()) {
    return { error: 'Product name is required' }
  }

  if (isNaN(price) || price < 0) {
    return { error: 'Please enter a valid price' }
  }

  // 1. Get images
  const imageFiles = formData.getAll('images') as File[]
  const validImages = imageFiles.filter(f => f && f.size > 0 && f.name)
  
  if (validImages.length > 0 && validImages.length < 2) {
    return { error: 'Please upload at least 2 images' }
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
    discount_percent,
    is_digital: isDigital,
    stock: isDigital ? 0 : stock,
    is_published: isPublished,
  }).select('id').single()

  if (error || !product) {
    console.error('Failed to create product:', error)
    return { error: 'Failed to create product. Please check your inputs.' }
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

  revalidatePath('/', 'layout')
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
  
  revalidatePath('/', 'layout')
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
  
  revalidatePath('/', 'layout')
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
  
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function editProductAction(prevState: any, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const productId = formData.get('productId') as string
  const name = (formData.get('name') as string) || ''
  const description = (formData.get('description') as string) || ''
  const priceRaw = formData.get('price')
  const price = priceRaw ? parseFloat(priceRaw as string) : 0
  const isDigital = formData.get('is_digital') === 'true'
  const discountRaw = formData.get('discount_percent')
  const discount_percent = discountRaw ? parseInt(discountRaw as string) : 0

  if (!productId || !name.trim() || isNaN(price) || price < 0) {
    return { error: 'Missing or invalid required fields' }
  }

  const { error } = await supabase
    .from('products')
    .update({
      name,
      description,
      price,
      discount_percent,
      is_digital: isDigital
    })
    .eq('id', productId)

  if (error) {
    console.error('Edit product error:', error)
    return { error: 'Failed to edit product' }
  }

  // Also bulk-update all variants to match the new base price
  // so the user sees the changes reflect immediately across all combinations
  await supabase
    .from('product_variants')
    .update({ price })
    .eq('product_id', productId)

  revalidatePath('/', 'layout')
  redirect('/dashboard/products')
}

export async function createFashionProductAction(prevState: any, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data: store } = await supabase.from('stores').select('id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single()
  if (!store) return { error: 'Store not found' }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const subCategory = formData.get('subCategory') as string
  const targetAudienceStr = formData.get('targetAudience') as string
  const material = formData.get('material') as string
  const hasOptions = formData.get('hasOptions') === 'true'
  const optionsDefStr = formData.get('optionsDef') as string
  const variantsJsonStr = formData.get('variantsJson') as string

  if (!name?.trim()) return { error: 'Product name is required' }
  
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'product'
  const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(7)}`
  
  const targetAudience = targetAudienceStr ? JSON.parse(targetAudienceStr).join(', ') : ''
  const optionsDef = optionsDefStr ? JSON.parse(optionsDefStr) : { sizes: [], colors: [] }
  const variants = variantsJsonStr ? JSON.parse(variantsJsonStr) : []

  // Extract base price and stock from first variant or form directly
  const basePrice = variants.length > 0 ? (Number(variants[0].price) || 0) : (Number(formData.get('price')) || 0)
  const baseStock = variants.length > 0 ? (Number(variants[0].stock) || 0) : (Number(formData.get('stock')) || 0)

  // Insert product
  const { data: product, error: productError } = await supabase.from('products').insert({
    store_id: store.id,
    name,
    slug: uniqueSlug,
    description,
    price: basePrice,
    stock: baseStock,
    is_digital: false,
    is_published: true,
    sub_category: subCategory,
    target_audience: targetAudience,
    material: material,
    has_variants: hasOptions && variants.length > 0
  }).select().single()

  if (productError || !product) {
    console.error('Fashion product error:', productError)
    return { error: 'Failed to create product' }
  }

  // Handle Photos
  const photos = formData.getAll('photos') as File[]
  const validPhotos = photos.filter(f => f && f.size > 0 && f.name)
  
  if (validPhotos.length > 0) {
    let position = 0
    for (const file of validPhotos) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${store.id}/${product.id}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file)
      
      if (!uploadError && uploadData) {
        const { data: publicUrl } = supabase.storage.from('product-images').getPublicUrl(fileName)
        await supabase.from('product_images').insert({
          product_id: product.id,
          image_url: publicUrl.publicUrl,
          display_order: position
        })
        position++
      }
    }
  }

  // If variants exist, insert options and variants
  if (hasOptions && variants.length > 0) {
    // Insert Product Options
    let pos = 0
    if (optionsDef.sizes && optionsDef.sizes.length > 0) {
      await supabase.from('product_options').insert({
        product_id: product.id, name: 'Size', position: pos++, values: optionsDef.sizes
      })
    }
    if (optionsDef.colors && optionsDef.colors.length > 0) {
      await supabase.from('product_options').insert({
        product_id: product.id, name: 'Color', position: pos++, values: optionsDef.colors
      })
    }

    // Insert Product Variants
    const variantsToInsert = variants.map((v: any) => ({
      product_id: product.id,
      title: v.title,
      price: parseFloat(v.price || basePrice),
      stock: parseInt(v.stock || baseStock),
      sku: v.sku || null,
      options: v.options || {}
    }))

    const { error: variantsError } = await supabase.from('product_variants').insert(variantsToInsert)
    if (variantsError) {
      console.error('Variants error:', variantsError)
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard/products')
}
export async function createGadgetProductAction(prevState: any, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data: store } = await supabase.from('stores').select('id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single()
  if (!store) return { error: 'Store not found' }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const subCategory = formData.get('subCategory') as string
  const brand = formData.get('brand') as string
  const condition = formData.get('condition') as string
  const attributesStr = formData.get('attributesJson') as string
  
  const hasOptions = formData.get('hasOptions') === 'true'
  const optionsDefStr = formData.get('optionsDef') as string
  const variantsJsonStr = formData.get('variantsJson') as string

  if (!name?.trim()) return { error: 'Product name is required' }
  
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'product'
  const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(7)}`
  
  const attributes = attributesStr ? JSON.parse(attributesStr) : {}
  const optionsDef = optionsDefStr ? JSON.parse(optionsDefStr) : { sizes: [], colors: [] }
  const variants = variantsJsonStr ? JSON.parse(variantsJsonStr) : []

  // Extract base price and stock from first variant or form directly
  const basePrice = variants.length > 0 ? (Number(variants[0].price) || 0) : (Number(formData.get('price')) || 0)
  const baseStock = variants.length > 0 ? (Number(variants[0].stock) || 0) : (Number(formData.get('stock')) || 0)

  // Insert product
  const { data: product, error: productError } = await supabase.from('products').insert({
    store_id: store.id,
    name,
    slug: uniqueSlug,
    description,
    price: basePrice,
    stock: baseStock,
    is_digital: false,
    is_published: true,
    sub_category: subCategory,
    brand: brand || null,
    condition: condition || null,
    attributes: attributes,
    has_variants: hasOptions && variants.length > 0
  }).select().single()

  if (productError || !product) {
    console.error('Gadget product error:', productError)
    return { error: 'Failed to create gadget product. Did you run the SQL migration?' }
  }

  // Handle Photos
  const photos = formData.getAll('photos') as File[]
  const validPhotos = photos.filter(f => f && f.size > 0 && f.name)
  
  if (validPhotos.length > 0) {
    let position = 0
    for (const file of validPhotos) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${store.id}/${product.id}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file)
      
      if (!uploadError && uploadData) {
        const { data: publicUrl } = supabase.storage.from('product-images').getPublicUrl(fileName)
        await supabase.from('product_images').insert({
          product_id: product.id,
          image_url: publicUrl.publicUrl,
          display_order: position
        })
        position++
      }
    }
  }

  // Handle Options and Variants
  if (hasOptions && variants.length > 0) {
    if (optionsDef.sizes.length > 0) {
      await supabase.from('product_options').insert({
        product_id: product.id,
        name: 'Size',
        position: 0,
        values: optionsDef.sizes
      })
    }
    if (optionsDef.colors.length > 0) {
      await supabase.from('product_options').insert({
        product_id: product.id,
        name: 'Color',
        position: optionsDef.sizes.length > 0 ? 1 : 0,
        values: optionsDef.colors
      })
    }

    const variantsToInsert = variants.map((v: any) => ({
      product_id: product.id,
      title: v.title,
      price: v.price,
      stock: v.stock,
      sku: v.sku || null,
      options: v.options
    }))
    await supabase.from('product_variants').insert(variantsToInsert)
  }

  revalidatePath('/dashboard/products')
  redirect('/dashboard/products')
}

export async function createFoodProductAction(prevState: any, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data: store } = await supabase.from('stores').select('id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single()
  if (!store) return { error: 'Store not found' }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const subCategory = formData.get('subCategory') as string
  const brand = formData.get('brand') as string
  const condition = formData.get('condition') as string
  const attributesStr = formData.get('attributesJson') as string
  
  const hasOptions = formData.get('hasOptions') === 'true'
  const optionsDefStr = formData.get('optionsDef') as string
  const variantsJsonStr = formData.get('variantsJson') as string

  if (!name?.trim()) return { error: 'Product name is required' }
  
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'product'
  const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(7)}`
  
  const attributes = attributesStr ? JSON.parse(attributesStr) : {}
  const optionsDef = optionsDefStr ? JSON.parse(optionsDefStr) : []
  const variants = variantsJsonStr ? JSON.parse(variantsJsonStr) : []

  // Extract base price and stock
  const basePrice = variants.length > 0 ? (Number(variants[0].price) || 0) : (Number(formData.get('price')) || 0)
  const baseStock = variants.length > 0 ? (Number(variants[0].stock) || 0) : (Number(formData.get('stock')) || 0)

  // Insert product
  const { data: product, error: productError } = await supabase.from('products').insert({
    store_id: store.id,
    name,
    slug: uniqueSlug,
    description,
    price: basePrice,
    stock: baseStock,
    is_digital: false,
    is_published: true,
    sub_category: subCategory,
    brand: brand || null,
    condition: condition || null,
    attributes: attributes,
    has_variants: hasOptions && variants.length > 0
  }).select().single()

  if (productError || !product) {
    console.error('Food product error:', productError)
    return { error: 'Failed to create food product.' }
  }

  // Handle Photos
  const photos = formData.getAll('photos') as File[]
  const validPhotos = photos.filter(f => f && f.size > 0 && f.name)
  
  if (validPhotos.length > 0) {
    let position = 0
    for (const file of validPhotos) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${store.id}/${product.id}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file)
      
      if (!uploadError && uploadData) {
        const { data: publicUrl } = supabase.storage.from('product-images').getPublicUrl(fileName)
        await supabase.from('product_images').insert({
          product_id: product.id,
          image_url: publicUrl.publicUrl,
          display_order: position
        })
        position++
      }
    }
  }

  // Handle Options and Variants dynamically
  if (hasOptions && variants.length > 0 && optionsDef.length > 0) {
    // optionsDef is an array of objects: [{ name: 'Weight', values: ['1kg', '2kg'] }, { name: 'Flavour', values: ['Vanilla'] }]
    for (let i = 0; i < optionsDef.length; i++) {
      await supabase.from('product_options').insert({
        product_id: product.id,
        name: optionsDef[i].name,
        position: i,
        values: optionsDef[i].values
      })
    }

    const variantsToInsert = variants.map((v: any) => ({
      product_id: product.id,
      title: v.title,
      price: v.price,
      stock: v.stock,
      sku: v.sku || null,
      options: v.options
    }))
    await supabase.from('product_variants').insert(variantsToInsert)
  }

  revalidatePath('/dashboard/products')
  redirect('/dashboard/products')
}

export async function createBeautyProductAction(prevState: any, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data: store } = await supabase.from('stores').select('id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single()
  if (!store) return { error: 'Store not found' }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const subCategory = formData.get('subCategory') as string
  const brand = formData.get('brand') as string
  const condition = formData.get('condition') as string
  const attributesStr = formData.get('attributesJson') as string
  
  const hasOptions = formData.get('hasOptions') === 'true'
  const optionsDefStr = formData.get('optionsDef') as string
  const variantsJsonStr = formData.get('variantsJson') as string

  if (!name?.trim()) return { error: 'Product name is required' }
  
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'product'
  const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(7)}`
  
  const attributes = attributesStr ? JSON.parse(attributesStr) : {}
  const optionsDef = optionsDefStr ? JSON.parse(optionsDefStr) : []
  const variants = variantsJsonStr ? JSON.parse(variantsJsonStr) : []

  // Extract base price and stock
  const basePrice = variants.length > 0 ? (Number(variants[0].price) || 0) : (Number(formData.get('price')) || 0)
  const baseStock = variants.length > 0 ? (Number(variants[0].stock) || 0) : (Number(formData.get('stock')) || 0)

  // Insert product
  const { data: product, error: productError } = await supabase.from('products').insert({
    store_id: store.id,
    name,
    slug: uniqueSlug,
    description,
    price: basePrice,
    stock: baseStock,
    is_digital: false,
    is_published: true,
    sub_category: subCategory,
    brand: brand || null,
    condition: condition || null,
    attributes: attributes,
    has_variants: hasOptions && variants.length > 0
  }).select().single()

  if (productError || !product) {
    console.error('Beauty product error:', productError)
    return { error: 'Failed to create beauty product.' }
  }

  // Handle Photos
  const photos = formData.getAll('photos') as File[]
  const validPhotos = photos.filter(f => f && f.size > 0 && f.name)
  
  if (validPhotos.length > 0) {
    let position = 0
    for (const file of validPhotos) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${store.id}/${product.id}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file)
      
      if (!uploadError && uploadData) {
        const { data: publicUrl } = supabase.storage.from('product-images').getPublicUrl(fileName)
        await supabase.from('product_images').insert({
          product_id: product.id,
          image_url: publicUrl.publicUrl,
          display_order: position
        })
        position++
      }
    }
  }

  // Handle Options and Variants dynamically
  if (hasOptions && variants.length > 0 && optionsDef.length > 0) {
    // optionsDef is an array of objects: [{ name: 'Weight', values: ['1kg', '2kg'] }, { name: 'Flavour', values: ['Vanilla'] }]
    for (let i = 0; i < optionsDef.length; i++) {
      await supabase.from('product_options').insert({
        product_id: product.id,
        name: optionsDef[i].name,
        position: i,
        values: optionsDef[i].values
      })
    }

    const variantsToInsert = variants.map((v: any) => ({
      product_id: product.id,
      title: v.title,
      price: v.price,
      stock: v.stock,
      sku: v.sku || null,
      options: v.options
    }))
    await supabase.from('product_variants').insert(variantsToInsert)
  }

  revalidatePath('/dashboard/products')
  redirect('/dashboard/products')
}





export async function createHealthProductAction(prevState: any, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data: store } = await supabase.from('stores').select('id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single()
  if (!store) return { error: 'Store not found' }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const subCategory = formData.get('subCategory') as string
  const brand = formData.get('brand') as string
  const condition = formData.get('condition') as string
  const attributesStr = formData.get('attributesJson') as string
  
  const hasOptions = formData.get('hasOptions') === 'true'
  const optionsDefStr = formData.get('optionsDef') as string
  const variantsJsonStr = formData.get('variantsJson') as string

  if (!name?.trim()) return { error: 'Product name is required' }
  
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'product'
  const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(7)}`
  
  const attributes = attributesStr ? JSON.parse(attributesStr) : {}
  const optionsDef = optionsDefStr ? JSON.parse(optionsDefStr) : []
  const variants = variantsJsonStr ? JSON.parse(variantsJsonStr) : []

  // Extract base price and stock
  const basePrice = variants.length > 0 ? (Number(variants[0].price) || 0) : (Number(formData.get('price')) || 0)
  const baseStock = variants.length > 0 ? (Number(variants[0].stock) || 0) : (Number(formData.get('stock')) || 0)

  // Insert product
  const { data: product, error: productError } = await supabase.from('products').insert({
    store_id: store.id,
    name,
    slug: uniqueSlug,
    description,
    price: basePrice,
    stock: baseStock,
    is_digital: false,
    is_published: true,
    sub_category: subCategory,
    brand: brand || null,
    condition: condition || null,
    attributes: attributes,
    has_variants: hasOptions && variants.length > 0
  }).select().single()

  if (productError || !product) {
    console.error('Beauty product error:', productError)
    return { error: 'Failed to create health product.' }
  }

  // Handle Photos
  const photos = formData.getAll('photos') as File[]
  const validPhotos = photos.filter(f => f && f.size > 0 && f.name)
  
  if (validPhotos.length > 0) {
    let position = 0
    for (const file of validPhotos) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${store.id}/${product.id}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file)
      
      if (!uploadError && uploadData) {
        const { data: publicUrl } = supabase.storage.from('product-images').getPublicUrl(fileName)
        await supabase.from('product_images').insert({
          product_id: product.id,
          image_url: publicUrl.publicUrl,
          display_order: position
        })
        position++
      }
    }
  }

  // Handle Options and Variants dynamically
  if (hasOptions && variants.length > 0 && optionsDef.length > 0) {
    // optionsDef is an array of objects: [{ name: 'Weight', values: ['1kg', '2kg'] }, { name: 'Flavour', values: ['Vanilla'] }]
    for (let i = 0; i < optionsDef.length; i++) {
      await supabase.from('product_options').insert({
        product_id: product.id,
        name: optionsDef[i].name,
        position: i,
        values: optionsDef[i].values
      })
    }

    const variantsToInsert = variants.map((v: any) => ({
      product_id: product.id,
      title: v.title,
      price: v.price,
      stock: v.stock,
      sku: v.sku || null,
      options: v.options
    }))
    await supabase.from('product_variants').insert(variantsToInsert)
  }

  revalidatePath('/dashboard/products')
  redirect('/dashboard/products')
}

export async function createHomeProductAction(prevState: any, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data: store } = await supabase.from('stores').select('id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single()
  if (!store) return { error: 'Store not found' }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const subCategory = formData.get('subCategory') as string
  const brand = formData.get('brand') as string
  const condition = formData.get('condition') as string
  const attributesStr = formData.get('attributesJson') as string
  
  const hasOptions = formData.get('hasOptions') === 'true'
  const optionsDefStr = formData.get('optionsDef') as string
  const variantsJsonStr = formData.get('variantsJson') as string

  if (!name?.trim()) return { error: 'Product name is required' }
  
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'product'
  const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(7)}`
  
  const attributes = attributesStr ? JSON.parse(attributesStr) : {}
  const optionsDef = optionsDefStr ? JSON.parse(optionsDefStr) : []
  const variants = variantsJsonStr ? JSON.parse(variantsJsonStr) : []

  // Extract base price and stock
  const basePrice = variants.length > 0 ? (Number(variants[0].price) || 0) : (Number(formData.get('price')) || 0)
  const baseStock = variants.length > 0 ? (Number(variants[0].stock) || 0) : (Number(formData.get('stock')) || 0)

  // Insert product
  const { data: product, error: productError } = await supabase.from('products').insert({
    store_id: store.id,
    name,
    slug: uniqueSlug,
    description,
    price: basePrice,
    stock: baseStock,
    is_digital: false,
    is_published: true,
    sub_category: subCategory,
    brand: brand || null,
    condition: condition || null,
    attributes: attributes,
    has_variants: hasOptions && variants.length > 0
  }).select().single()

  if (productError || !product) {
    console.error('Beauty product error:', productError)
    return { error: 'Failed to create home product.' }
  }

  // Handle Photos
  const photos = formData.getAll('photos') as File[]
  const validPhotos = photos.filter(f => f && f.size > 0 && f.name)
  
  if (validPhotos.length > 0) {
    let position = 0
    for (const file of validPhotos) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${store.id}/${product.id}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file)
      
      if (!uploadError && uploadData) {
        const { data: publicUrl } = supabase.storage.from('product-images').getPublicUrl(fileName)
        await supabase.from('product_images').insert({
          product_id: product.id,
          image_url: publicUrl.publicUrl,
          display_order: position
        })
        position++
      }
    }
  }

  // Handle Options and Variants dynamically
  if (hasOptions && variants.length > 0 && optionsDef.length > 0) {
    // optionsDef is an array of objects: [{ name: 'Weight', values: ['1kg', '2kg'] }, { name: 'Flavour', values: ['Vanilla'] }]
    for (let i = 0; i < optionsDef.length; i++) {
      await supabase.from('product_options').insert({
        product_id: product.id,
        name: optionsDef[i].name,
        position: i,
        values: optionsDef[i].values
      })
    }

    const variantsToInsert = variants.map((v: any) => ({
      product_id: product.id,
      title: v.title,
      price: v.price,
      stock: v.stock,
      sku: v.sku || null,
      options: v.options
    }))
    await supabase.from('product_variants').insert(variantsToInsert)
  }

  revalidatePath('/dashboard/products')
  redirect('/dashboard/products')
}

export async function createJewelryProductAction(prevState: any, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data: store } = await supabase.from('stores').select('id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single()
  if (!store) return { error: 'Store not found' }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const subCategory = formData.get('subCategory') as string
  const brand = formData.get('brand') as string
  const condition = formData.get('condition') as string
  const attributesStr = formData.get('attributesJson') as string
  
  const hasOptions = formData.get('hasOptions') === 'true'
  const optionsDefStr = formData.get('optionsDef') as string
  const variantsJsonStr = formData.get('variantsJson') as string

  if (!name?.trim()) return { error: 'Product name is required' }
  
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'product'
  const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(7)}`
  
  const attributes = attributesStr ? JSON.parse(attributesStr) : {}
  const optionsDef = optionsDefStr ? JSON.parse(optionsDefStr) : []
  const variants = variantsJsonStr ? JSON.parse(variantsJsonStr) : []

  // Extract base price and stock
  const basePrice = variants.length > 0 ? (Number(variants[0].price) || 0) : (Number(formData.get('price')) || 0)
  const baseStock = variants.length > 0 ? (Number(variants[0].stock) || 0) : (Number(formData.get('stock')) || 0)

  // Insert product
  const { data: product, error: productError } = await supabase.from('products').insert({
    store_id: store.id,
    name,
    slug: uniqueSlug,
    description,
    price: basePrice,
    stock: baseStock,
    is_digital: false,
    is_published: true,
    sub_category: subCategory,
    brand: brand || null,
    condition: condition || null,
    attributes: attributes,
    has_variants: hasOptions && variants.length > 0
  }).select().single()

  if (productError || !product) {
    console.error('Beauty product error:', productError)
    return { error: 'Failed to create jewelry product.' }
  }

  // Handle Photos
  const photos = formData.getAll('photos') as File[]
  const validPhotos = photos.filter(f => f && f.size > 0 && f.name)
  
  if (validPhotos.length > 0) {
    let position = 0
    for (const file of validPhotos) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${store.id}/${product.id}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file)
      
      if (!uploadError && uploadData) {
        const { data: publicUrl } = supabase.storage.from('product-images').getPublicUrl(fileName)
        await supabase.from('product_images').insert({
          product_id: product.id,
          image_url: publicUrl.publicUrl,
          display_order: position
        })
        position++
      }
    }
  }

  // Handle Options and Variants dynamically
  if (hasOptions && variants.length > 0 && optionsDef.length > 0) {
    // optionsDef is an array of objects: [{ name: 'Weight', values: ['1kg', '2kg'] }, { name: 'Flavour', values: ['Vanilla'] }]
    for (let i = 0; i < optionsDef.length; i++) {
      await supabase.from('product_options').insert({
        product_id: product.id,
        name: optionsDef[i].name,
        position: i,
        values: optionsDef[i].values
      })
    }

    const variantsToInsert = variants.map((v: any) => ({
      product_id: product.id,
      title: v.title,
      price: v.price,
      stock: v.stock,
      sku: v.sku || null,
      options: v.options
    }))
    await supabase.from('product_variants').insert(variantsToInsert)
  }

  revalidatePath('/dashboard/products')
  redirect('/dashboard/products')
}

export async function createBooksProductAction(prevState: any, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data: store } = await supabase.from('stores').select('id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single()
  if (!store) return { error: 'Store not found' }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const subCategory = formData.get('subCategory') as string
  const brand = formData.get('brand') as string
  const condition = formData.get('condition') as string
  const attributesStr = formData.get('attributesJson') as string
  
  const hasOptions = formData.get('hasOptions') === 'true'
  const optionsDefStr = formData.get('optionsDef') as string
  const variantsJsonStr = formData.get('variantsJson') as string

  if (!name?.trim()) return { error: 'Product name is required' }
  
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'product'
  const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(7)}`
  
  const attributes = attributesStr ? JSON.parse(attributesStr) : {}
  const optionsDef = optionsDefStr ? JSON.parse(optionsDefStr) : []
  const variants = variantsJsonStr ? JSON.parse(variantsJsonStr) : []

  // Extract base price and stock
  const basePrice = variants.length > 0 ? (Number(variants[0].price) || 0) : (Number(formData.get('price')) || 0)
  const baseStock = variants.length > 0 ? (Number(variants[0].stock) || 0) : (Number(formData.get('stock')) || 0)

  // Insert product
  const { data: product, error: productError } = await supabase.from('products').insert({
    store_id: store.id,
    name,
    slug: uniqueSlug,
    description,
    price: basePrice,
    stock: baseStock,
    is_digital: false,
    is_published: true,
    sub_category: subCategory,
    brand: brand || null,
    condition: condition || null,
    attributes: attributes,
    has_variants: hasOptions && variants.length > 0
  }).select().single()

  if (productError || !product) {
    console.error('Beauty product error:', productError)
    return { error: 'Failed to create books & stationery product.' }
  }

  // Handle Photos
  const photos = formData.getAll('photos') as File[]
  const validPhotos = photos.filter(f => f && f.size > 0 && f.name)
  
  if (validPhotos.length > 0) {
    let position = 0
    for (const file of validPhotos) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${store.id}/${product.id}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file)
      
      if (!uploadError && uploadData) {
        const { data: publicUrl } = supabase.storage.from('product-images').getPublicUrl(fileName)
        await supabase.from('product_images').insert({
          product_id: product.id,
          image_url: publicUrl.publicUrl,
          display_order: position
        })
        position++
      }
    }
  }

  // Handle Options and Variants dynamically
  if (hasOptions && variants.length > 0 && optionsDef.length > 0) {
    // optionsDef is an array of objects: [{ name: 'Weight', values: ['1kg', '2kg'] }, { name: 'Flavour', values: ['Vanilla'] }]
    for (let i = 0; i < optionsDef.length; i++) {
      await supabase.from('product_options').insert({
        product_id: product.id,
        name: optionsDef[i].name,
        position: i,
        values: optionsDef[i].values
      })
    }

    const variantsToInsert = variants.map((v: any) => ({
      product_id: product.id,
      title: v.title,
      price: v.price,
      stock: v.stock,
      sku: v.sku || null,
      options: v.options
    }))
    await supabase.from('product_variants').insert(variantsToInsert)
  }

  revalidatePath('/dashboard/products')
  redirect('/dashboard/products')
}

export async function createKidsProductAction(prevState: any, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data: store } = await supabase.from('stores').select('id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single()
  if (!store) return { error: 'Store not found' }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const subCategory = formData.get('subCategory') as string
  const brand = formData.get('brand') as string
  const condition = formData.get('condition') as string
  const attributesStr = formData.get('attributesJson') as string
  
  const hasOptions = formData.get('hasOptions') === 'true'
  const optionsDefStr = formData.get('optionsDef') as string
  const variantsJsonStr = formData.get('variantsJson') as string

  if (!name?.trim()) return { error: 'Product name is required' }
  
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'product'
  const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(7)}`
  
  const attributes = attributesStr ? JSON.parse(attributesStr) : {}
  const optionsDef = optionsDefStr ? JSON.parse(optionsDefStr) : []
  const variants = variantsJsonStr ? JSON.parse(variantsJsonStr) : []

  // Extract base price and stock
  const basePrice = variants.length > 0 ? (Number(variants[0].price) || 0) : (Number(formData.get('price')) || 0)
  const baseStock = variants.length > 0 ? (Number(variants[0].stock) || 0) : (Number(formData.get('stock')) || 0)

  // Insert product
  const { data: product, error: productError } = await supabase.from('products').insert({
    store_id: store.id,
    name,
    slug: uniqueSlug,
    description,
    price: basePrice,
    stock: baseStock,
    is_digital: false,
    is_published: true,
    sub_category: subCategory,
    brand: brand || null,
    condition: condition || null,
    attributes: attributes,
    has_variants: hasOptions && variants.length > 0
  }).select().single()

  if (productError || !product) {
    console.error('Beauty product error:', productError)
    return { error: 'Failed to create baby, kids & toys product.' }
  }

  // Handle Photos
  const photos = formData.getAll('photos') as File[]
  const validPhotos = photos.filter(f => f && f.size > 0 && f.name)
  
  if (validPhotos.length > 0) {
    let position = 0
    for (const file of validPhotos) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${store.id}/${product.id}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file)
      
      if (!uploadError && uploadData) {
        const { data: publicUrl } = supabase.storage.from('product-images').getPublicUrl(fileName)
        await supabase.from('product_images').insert({
          product_id: product.id,
          image_url: publicUrl.publicUrl,
          display_order: position
        })
        position++
      }
    }
  }

  // Handle Options and Variants dynamically
  if (hasOptions && variants.length > 0 && optionsDef.length > 0) {
    // optionsDef is an array of objects: [{ name: 'Weight', values: ['1kg', '2kg'] }, { name: 'Flavour', values: ['Vanilla'] }]
    for (let i = 0; i < optionsDef.length; i++) {
      await supabase.from('product_options').insert({
        product_id: product.id,
        name: optionsDef[i].name,
        position: i,
        values: optionsDef[i].values
      })
    }

    const variantsToInsert = variants.map((v: any) => ({
      product_id: product.id,
      title: v.title,
      price: v.price,
      stock: v.stock,
      sku: v.sku || null,
      options: v.options
    }))
    await supabase.from('product_variants').insert(variantsToInsert)
  }

  revalidatePath('/dashboard/products')
  redirect('/dashboard/products')
}

export async function createPetsProductAction(prevState: any, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data: store } = await supabase.from('stores').select('id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single()
  if (!store) return { error: 'Store not found' }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const subCategory = formData.get('subCategory') as string
  const brand = formData.get('brand') as string
  const condition = formData.get('condition') as string
  const attributesStr = formData.get('attributesJson') as string
  
  const hasOptions = formData.get('hasOptions') === 'true'
  const optionsDefStr = formData.get('optionsDef') as string
  const variantsJsonStr = formData.get('variantsJson') as string

  if (!name?.trim()) return { error: 'Product name is required' }
  
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'product'
  const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(7)}`
  
  const attributes = attributesStr ? JSON.parse(attributesStr) : {}
  const optionsDef = optionsDefStr ? JSON.parse(optionsDefStr) : []
  const variants = variantsJsonStr ? JSON.parse(variantsJsonStr) : []

  // Extract base price and stock
  const basePrice = variants.length > 0 ? (Number(variants[0].price) || 0) : (Number(formData.get('price')) || 0)
  const baseStock = variants.length > 0 ? (Number(variants[0].stock) || 0) : (Number(formData.get('stock')) || 0)

  // Insert product
  const { data: product, error: productError } = await supabase.from('products').insert({
    store_id: store.id,
    name,
    slug: uniqueSlug,
    description,
    price: basePrice,
    stock: baseStock,
    is_digital: false,
    is_published: true,
    sub_category: subCategory,
    brand: brand || null,
    condition: condition || null,
    attributes: attributes,
    has_variants: hasOptions && variants.length > 0
  }).select().single()

  if (productError || !product) {
    console.error('Beauty product error:', productError)
    return { error: 'Failed to create pets & pet supplies product.' }
  }

  // Handle Photos
  const photos = formData.getAll('photos') as File[]
  const validPhotos = photos.filter(f => f && f.size > 0 && f.name)
  
  if (validPhotos.length > 0) {
    let position = 0
    for (const file of validPhotos) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${store.id}/${product.id}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file)
      
      if (!uploadError && uploadData) {
        const { data: publicUrl } = supabase.storage.from('product-images').getPublicUrl(fileName)
        await supabase.from('product_images').insert({
          product_id: product.id,
          image_url: publicUrl.publicUrl,
          display_order: position
        })
        position++
      }
    }
  }

  // Handle Options and Variants dynamically
  if (hasOptions && variants.length > 0 && optionsDef.length > 0) {
    // optionsDef is an array of objects: [{ name: 'Weight', values: ['1kg', '2kg'] }, { name: 'Flavour', values: ['Vanilla'] }]
    for (let i = 0; i < optionsDef.length; i++) {
      await supabase.from('product_options').insert({
        product_id: product.id,
        name: optionsDef[i].name,
        position: i,
        values: optionsDef[i].values
      })
    }

    const variantsToInsert = variants.map((v: any) => ({
      product_id: product.id,
      title: v.title,
      price: v.price,
      stock: v.stock,
      sku: v.sku || null,
      options: v.options
    }))
    await supabase.from('product_variants').insert(variantsToInsert)
  }

  revalidatePath('/dashboard/products')
  redirect('/dashboard/products')
}

export async function createToolsProductAction(prevState: any, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data: store } = await supabase.from('stores').select('id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single()
  if (!store) return { error: 'Store not found' }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const subCategory = formData.get('subCategory') as string
  const brand = formData.get('brand') as string
  const condition = formData.get('condition') as string
  const attributesStr = formData.get('attributesJson') as string
  
  const hasOptions = formData.get('hasOptions') === 'true'
  const optionsDefStr = formData.get('optionsDef') as string
  const variantsJsonStr = formData.get('variantsJson') as string

  if (!name?.trim()) return { error: 'Product name is required' }
  
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'product'
  const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(7)}`
  
  const attributes = attributesStr ? JSON.parse(attributesStr) : {}
  const optionsDef = optionsDefStr ? JSON.parse(optionsDefStr) : []
  const variants = variantsJsonStr ? JSON.parse(variantsJsonStr) : []

  // Extract base price and stock
  const basePrice = variants.length > 0 ? (Number(variants[0].price) || 0) : (Number(formData.get('price')) || 0)
  const baseStock = variants.length > 0 ? (Number(variants[0].stock) || 0) : (Number(formData.get('stock')) || 0)

  // Insert product
  const { data: product, error: productError } = await supabase.from('products').insert({
    store_id: store.id,
    name,
    slug: uniqueSlug,
    description,
    price: basePrice,
    stock: baseStock,
    is_digital: false,
    is_published: true,
    sub_category: subCategory,
    brand: brand || null,
    condition: condition || null,
    attributes: attributes,
    has_variants: hasOptions && variants.length > 0
  }).select().single()

  if (productError || !product) {
    console.error('Beauty product error:', productError)
    return { error: 'Failed to create tools & hardware product.' }
  }

  // Handle Photos
  const photos = formData.getAll('photos') as File[]
  const validPhotos = photos.filter(f => f && f.size > 0 && f.name)
  
  if (validPhotos.length > 0) {
    let position = 0
    for (const file of validPhotos) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${store.id}/${product.id}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file)
      
      if (!uploadError && uploadData) {
        const { data: publicUrl } = supabase.storage.from('product-images').getPublicUrl(fileName)
        await supabase.from('product_images').insert({
          product_id: product.id,
          image_url: publicUrl.publicUrl,
          display_order: position
        })
        position++
      }
    }
  }

  // Handle Options and Variants dynamically
  if (hasOptions && variants.length > 0 && optionsDef.length > 0) {
    // optionsDef is an array of objects: [{ name: 'Weight', values: ['1kg', '2kg'] }, { name: 'Flavour', values: ['Vanilla'] }]
    for (let i = 0; i < optionsDef.length; i++) {
      await supabase.from('product_options').insert({
        product_id: product.id,
        name: optionsDef[i].name,
        position: i,
        values: optionsDef[i].values
      })
    }

    const variantsToInsert = variants.map((v: any) => ({
      product_id: product.id,
      title: v.title,
      price: v.price,
      stock: v.stock,
      sku: v.sku || null,
      options: v.options
    }))
    await supabase.from('product_variants').insert(variantsToInsert)
  }

  revalidatePath('/dashboard/products')
  redirect('/dashboard/products')
}

export async function createAgricultureProductAction(prevState: any, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data: store } = await supabase.from('stores').select('id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single()
  if (!store) return { error: 'Store not found' }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const subCategory = formData.get('subCategory') as string
  const brand = formData.get('brand') as string
  const condition = formData.get('condition') as string
  const attributesStr = formData.get('attributesJson') as string
  
  const hasOptions = formData.get('hasOptions') === 'true'
  const optionsDefStr = formData.get('optionsDef') as string
  const variantsJsonStr = formData.get('variantsJson') as string

  if (!name?.trim()) return { error: 'Product name is required' }
  
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'product'
  const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(7)}`
  
  const attributes = attributesStr ? JSON.parse(attributesStr) : {}
  const optionsDef = optionsDefStr ? JSON.parse(optionsDefStr) : []
  const variants = variantsJsonStr ? JSON.parse(variantsJsonStr) : []

  // Extract base price and stock
  const basePrice = variants.length > 0 ? (Number(variants[0].price) || 0) : (Number(formData.get('price')) || 0)
  const baseStock = variants.length > 0 ? (Number(variants[0].stock) || 0) : (Number(formData.get('stock')) || 0)

  // Insert product
  const { data: product, error: productError } = await supabase.from('products').insert({
    store_id: store.id,
    name,
    slug: uniqueSlug,
    description,
    price: basePrice,
    stock: baseStock,
    is_digital: false,
    is_published: true,
    sub_category: subCategory,
    brand: brand || null,
    condition: condition || null,
    attributes: attributes,
    has_variants: hasOptions && variants.length > 0
  }).select().single()

  if (productError || !product) {
    console.error('Beauty product error:', productError)
    return { error: 'Failed to create agriculture & garden product.' }
  }

  // Handle Photos
  const photos = formData.getAll('photos') as File[]
  const validPhotos = photos.filter(f => f && f.size > 0 && f.name)
  
  if (validPhotos.length > 0) {
    let position = 0
    for (const file of validPhotos) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${store.id}/${product.id}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file)
      
      if (!uploadError && uploadData) {
        const { data: publicUrl } = supabase.storage.from('product-images').getPublicUrl(fileName)
        await supabase.from('product_images').insert({
          product_id: product.id,
          image_url: publicUrl.publicUrl,
          display_order: position
        })
        position++
      }
    }
  }

  // Handle Options and Variants dynamically
  if (hasOptions && variants.length > 0 && optionsDef.length > 0) {
    // optionsDef is an array of objects: [{ name: 'Weight', values: ['1kg', '2kg'] }, { name: 'Flavour', values: ['Vanilla'] }]
    for (let i = 0; i < optionsDef.length; i++) {
      await supabase.from('product_options').insert({
        product_id: product.id,
        name: optionsDef[i].name,
        position: i,
        values: optionsDef[i].values
      })
    }

    const variantsToInsert = variants.map((v: any) => ({
      product_id: product.id,
      title: v.title,
      price: v.price,
      stock: v.stock,
      sku: v.sku || null,
      options: v.options
    }))
    await supabase.from('product_variants').insert(variantsToInsert)
  }

  revalidatePath('/dashboard/products')
  redirect('/dashboard/products')
}

export async function createGamingProductAction(prevState: any, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data: store } = await supabase.from('stores').select('id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single()
  if (!store) return { error: 'Store not found' }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const subCategory = formData.get('subCategory') as string
  const brand = formData.get('brand') as string
  const condition = formData.get('condition') as string
  const attributesStr = formData.get('attributesJson') as string
  
  const hasOptions = formData.get('hasOptions') === 'true'
  const optionsDefStr = formData.get('optionsDef') as string
  const variantsJsonStr = formData.get('variantsJson') as string

  if (!name?.trim()) return { error: 'Product name is required' }
  
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'product'
  const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(7)}`
  
  const attributes = attributesStr ? JSON.parse(attributesStr) : {}
  const optionsDef = optionsDefStr ? JSON.parse(optionsDefStr) : []
  const variants = variantsJsonStr ? JSON.parse(variantsJsonStr) : []

  // Extract base price and stock
  const basePrice = variants.length > 0 ? (Number(variants[0].price) || 0) : (Number(formData.get('price')) || 0)
  const baseStock = variants.length > 0 ? (Number(variants[0].stock) || 0) : (Number(formData.get('stock')) || 0)

  // Insert product
  const { data: product, error: productError } = await supabase.from('products').insert({
    store_id: store.id,
    name,
    slug: uniqueSlug,
    description,
    price: basePrice,
    stock: baseStock,
    is_digital: false,
    is_published: true,
    sub_category: subCategory,
    brand: brand || null,
    condition: condition || null,
    attributes: attributes,
    has_variants: hasOptions && variants.length > 0
  }).select().single()

  if (productError || !product) {
    console.error('Beauty product error:', productError)
    return { error: 'Failed to create gaming product.' }
  }

  // Handle Photos
  const photos = formData.getAll('photos') as File[]
  const validPhotos = photos.filter(f => f && f.size > 0 && f.name)
  
  if (validPhotos.length > 0) {
    let position = 0
    for (const file of validPhotos) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${store.id}/${product.id}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file)
      
      if (!uploadError && uploadData) {
        const { data: publicUrl } = supabase.storage.from('product-images').getPublicUrl(fileName)
        await supabase.from('product_images').insert({
          product_id: product.id,
          image_url: publicUrl.publicUrl,
          display_order: position
        })
        position++
      }
    }
  }

  // Handle Options and Variants dynamically
  if (hasOptions && variants.length > 0 && optionsDef.length > 0) {
    // optionsDef is an array of objects: [{ name: 'Weight', values: ['1kg', '2kg'] }, { name: 'Flavour', values: ['Vanilla'] }]
    for (let i = 0; i < optionsDef.length; i++) {
      await supabase.from('product_options').insert({
        product_id: product.id,
        name: optionsDef[i].name,
        position: i,
        values: optionsDef[i].values
      })
    }

    const variantsToInsert = variants.map((v: any) => ({
      product_id: product.id,
      title: v.title,
      price: v.price,
      stock: v.stock,
      sku: v.sku || null,
      options: v.options
    }))
    await supabase.from('product_variants').insert(variantsToInsert)
  }

  revalidatePath('/dashboard/products')
  redirect('/dashboard/products')
}

export async function createOfficeProductAction(prevState: any, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data: store } = await supabase.from('stores').select('id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single()
  if (!store) return { error: 'Store not found' }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const subCategory = formData.get('subCategory') as string
  const brand = formData.get('brand') as string
  const condition = formData.get('condition') as string
  const attributesStr = formData.get('attributesJson') as string
  
  const hasOptions = formData.get('hasOptions') === 'true'
  const optionsDefStr = formData.get('optionsDef') as string
  const variantsJsonStr = formData.get('variantsJson') as string

  if (!name?.trim()) return { error: 'Product name is required' }
  
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'product'
  const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(7)}`
  
  const attributes = attributesStr ? JSON.parse(attributesStr) : {}
  const optionsDef = optionsDefStr ? JSON.parse(optionsDefStr) : []
  const variants = variantsJsonStr ? JSON.parse(variantsJsonStr) : []

  // Extract base price and stock
  const basePrice = variants.length > 0 ? (Number(variants[0].price) || 0) : (Number(formData.get('price')) || 0)
  const baseStock = variants.length > 0 ? (Number(variants[0].stock) || 0) : (Number(formData.get('stock')) || 0)

  // Insert product
  const { data: product, error: productError } = await supabase.from('products').insert({
    store_id: store.id,
    name,
    slug: uniqueSlug,
    description,
    price: basePrice,
    stock: baseStock,
    is_digital: false,
    is_published: true,
    sub_category: subCategory,
    brand: brand || null,
    condition: condition || null,
    attributes: attributes,
    has_variants: hasOptions && variants.length > 0
  }).select().single()

  if (productError || !product) {
    console.error('Beauty product error:', productError)
    return { error: 'Failed to create office & business product.' }
  }

  // Handle Photos
  const photos = formData.getAll('photos') as File[]
  const validPhotos = photos.filter(f => f && f.size > 0 && f.name)
  
  if (validPhotos.length > 0) {
    let position = 0
    for (const file of validPhotos) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${store.id}/${product.id}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file)
      
      if (!uploadError && uploadData) {
        const { data: publicUrl } = supabase.storage.from('product-images').getPublicUrl(fileName)
        await supabase.from('product_images').insert({
          product_id: product.id,
          image_url: publicUrl.publicUrl,
          display_order: position
        })
        position++
      }
    }
  }

  // Handle Options and Variants dynamically
  if (hasOptions && variants.length > 0 && optionsDef.length > 0) {
    // optionsDef is an array of objects: [{ name: 'Weight', values: ['1kg', '2kg'] }, { name: 'Flavour', values: ['Vanilla'] }]
    for (let i = 0; i < optionsDef.length; i++) {
      await supabase.from('product_options').insert({
        product_id: product.id,
        name: optionsDef[i].name,
        position: i,
        values: optionsDef[i].values
      })
    }

    const variantsToInsert = variants.map((v: any) => ({
      product_id: product.id,
      title: v.title,
      price: v.price,
      stock: v.stock,
      sku: v.sku || null,
      options: v.options
    }))
    await supabase.from('product_variants').insert(variantsToInsert)
  }

  revalidatePath('/dashboard/products')
  redirect('/dashboard/products')
}

export async function createOtherProductAction(prevState: any, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data: store } = await supabase.from('stores').select('id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single()
  if (!store) return { error: 'Store not found' }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const subCategory = formData.get('subCategory') as string
  const brand = formData.get('brand') as string
  const condition = formData.get('condition') as string
  const attributesStr = formData.get('attributesJson') as string
  
  const hasOptions = formData.get('hasOptions') === 'true'
  const optionsDefStr = formData.get('optionsDef') as string
  const variantsJsonStr = formData.get('variantsJson') as string

  if (!name?.trim()) return { error: 'Product name is required' }
  
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'product'
  const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(7)}`
  
  const attributes = attributesStr ? JSON.parse(attributesStr) : {}
  const optionsDef = optionsDefStr ? JSON.parse(optionsDefStr) : []
  const variants = variantsJsonStr ? JSON.parse(variantsJsonStr) : []

  // Extract base price and stock
  const basePrice = variants.length > 0 ? (Number(variants[0].price) || 0) : (Number(formData.get('price')) || 0)
  const baseStock = variants.length > 0 ? (Number(variants[0].stock) || 0) : (Number(formData.get('stock')) || 0)

  // Insert product
  const { data: product, error: productError } = await supabase.from('products').insert({
    store_id: store.id,
    name,
    slug: uniqueSlug,
    description,
    price: basePrice,
    stock: baseStock,
    is_digital: false,
    is_published: true,
    sub_category: subCategory,
    brand: brand || null,
    condition: condition || null,
    attributes: attributes,
    has_variants: hasOptions && variants.length > 0
  }).select().single()

  if (productError || !product) {
    console.error('Beauty product error:', productError)
    return { error: 'Failed to create other product.' }
  }

  // Handle Photos
  const photos = formData.getAll('photos') as File[]
  const validPhotos = photos.filter(f => f && f.size > 0 && f.name)
  
  if (validPhotos.length > 0) {
    let position = 0
    for (const file of validPhotos) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${store.id}/${product.id}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file)
      
      if (!uploadError && uploadData) {
        const { data: publicUrl } = supabase.storage.from('product-images').getPublicUrl(fileName)
        await supabase.from('product_images').insert({
          product_id: product.id,
          image_url: publicUrl.publicUrl,
          display_order: position
        })
        position++
      }
    }
  }

  // Handle Options and Variants dynamically
  if (hasOptions && variants.length > 0 && optionsDef.length > 0) {
    // optionsDef is an array of objects: [{ name: 'Weight', values: ['1kg', '2kg'] }, { name: 'Flavour', values: ['Vanilla'] }]
    for (let i = 0; i < optionsDef.length; i++) {
      await supabase.from('product_options').insert({
        product_id: product.id,
        name: optionsDef[i].name,
        position: i,
        values: optionsDef[i].values
      })
    }

    const variantsToInsert = variants.map((v: any) => ({
      product_id: product.id,
      title: v.title,
      price: v.price,
      stock: v.stock,
      sku: v.sku || null,
      options: v.options
    }))
    await supabase.from('product_variants').insert(variantsToInsert)
  }

  revalidatePath('/dashboard/products')
  redirect('/dashboard/products')
}

export async function createSportsProductAction(prevState: any, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data: store } = await supabase.from('stores').select('id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single()
  if (!store) return { error: 'Store not found' }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const subCategory = formData.get('subCategory') as string
  const brand = formData.get('brand') as string
  const condition = formData.get('condition') as string
  const attributesStr = formData.get('attributesJson') as string
  
  const hasOptions = formData.get('hasOptions') === 'true'
  const optionsDefStr = formData.get('optionsDef') as string
  const variantsJsonStr = formData.get('variantsJson') as string

  if (!name?.trim()) return { error: 'Product name is required' }
  
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'product'
  const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(7)}`
  
  const attributes = attributesStr ? JSON.parse(attributesStr) : {}
  const optionsDef = optionsDefStr ? JSON.parse(optionsDefStr) : []
  const variants = variantsJsonStr ? JSON.parse(variantsJsonStr) : []

  // Extract base price and stock
  const basePrice = variants.length > 0 ? (Number(variants[0].price) || 0) : (Number(formData.get('price')) || 0)
  const baseStock = variants.length > 0 ? (Number(variants[0].stock) || 0) : (Number(formData.get('stock')) || 0)

  // Insert product
  const { data: product, error: productError } = await supabase.from('products').insert({
    store_id: store.id,
    name,
    slug: uniqueSlug,
    description,
    price: basePrice,
    stock: baseStock,
    is_digital: false,
    is_published: true,
    sub_category: subCategory,
    brand: brand || null,
    condition: condition || null,
    attributes: attributes,
    has_variants: hasOptions && variants.length > 0
  }).select().single()

  if (productError || !product) {
    console.error('Beauty product error:', productError)
    return { error: 'Failed to create sports & fitness product.' }
  }

  // Handle Photos
  const photos = formData.getAll('photos') as File[]
  const validPhotos = photos.filter(f => f && f.size > 0 && f.name)
  
  if (validPhotos.length > 0) {
    let position = 0
    for (const file of validPhotos) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${store.id}/${product.id}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file)
      
      if (!uploadError && uploadData) {
        const { data: publicUrl } = supabase.storage.from('product-images').getPublicUrl(fileName)
        await supabase.from('product_images').insert({
          product_id: product.id,
          image_url: publicUrl.publicUrl,
          display_order: position
        })
        position++
      }
    }
  }

  // Handle Options and Variants dynamically
  if (hasOptions && variants.length > 0 && optionsDef.length > 0) {
    // optionsDef is an array of objects: [{ name: 'Weight', values: ['1kg', '2kg'] }, { name: 'Flavour', values: ['Vanilla'] }]
    for (let i = 0; i < optionsDef.length; i++) {
      await supabase.from('product_options').insert({
        product_id: product.id,
        name: optionsDef[i].name,
        position: i,
        values: optionsDef[i].values
      })
    }

    const variantsToInsert = variants.map((v: any) => ({
      product_id: product.id,
      title: v.title,
      price: v.price,
      stock: v.stock,
      sku: v.sku || null,
      options: v.options
    }))
    await supabase.from('product_variants').insert(variantsToInsert)
  }

  revalidatePath('/dashboard/products')
  redirect('/dashboard/products')
}

export async function createAutomotiveProductAction(prevState: any, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data: store } = await supabase.from('stores').select('id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single()
  if (!store) return { error: 'Store not found' }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const subCategory = formData.get('subCategory') as string
  const brand = formData.get('brand') as string
  const condition = formData.get('condition') as string
  const attributesStr = formData.get('attributesJson') as string
  
  const hasOptions = formData.get('hasOptions') === 'true'
  const optionsDefStr = formData.get('optionsDef') as string
  const variantsJsonStr = formData.get('variantsJson') as string

  if (!name?.trim()) return { error: 'Product name is required' }
  
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'product'
  const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(7)}`
  
  const attributes = attributesStr ? JSON.parse(attributesStr) : {}
  const optionsDef = optionsDefStr ? JSON.parse(optionsDefStr) : []
  const variants = variantsJsonStr ? JSON.parse(variantsJsonStr) : []

  // Extract base price and stock
  const basePrice = variants.length > 0 ? (Number(variants[0].price) || 0) : (Number(formData.get('price')) || 0)
  const baseStock = variants.length > 0 ? (Number(variants[0].stock) || 0) : (Number(formData.get('stock')) || 0)

  // Insert product
  const { data: product, error: productError } = await supabase.from('products').insert({
    store_id: store.id,
    name,
    slug: uniqueSlug,
    description,
    price: basePrice,
    stock: baseStock,
    is_digital: false,
    is_published: true,
    sub_category: subCategory,
    brand: brand || null,
    condition: condition || null,
    attributes: attributes,
    has_variants: hasOptions && variants.length > 0
  }).select().single()

  if (productError || !product) {
    console.error('Beauty product error:', productError)
    return { error: 'Failed to create automotive product.' }
  }

  // Handle Photos
  const photos = formData.getAll('photos') as File[]
  const validPhotos = photos.filter(f => f && f.size > 0 && f.name)
  
  if (validPhotos.length > 0) {
    let position = 0
    for (const file of validPhotos) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${store.id}/${product.id}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file)
      
      if (!uploadError && uploadData) {
        const { data: publicUrl } = supabase.storage.from('product-images').getPublicUrl(fileName)
        await supabase.from('product_images').insert({
          product_id: product.id,
          image_url: publicUrl.publicUrl,
          display_order: position
        })
        position++
      }
    }
  }

  // Handle Options and Variants dynamically
  if (hasOptions && variants.length > 0 && optionsDef.length > 0) {
    // optionsDef is an array of objects: [{ name: 'Weight', values: ['1kg', '2kg'] }, { name: 'Flavour', values: ['Vanilla'] }]
    for (let i = 0; i < optionsDef.length; i++) {
      await supabase.from('product_options').insert({
        product_id: product.id,
        name: optionsDef[i].name,
        position: i,
        values: optionsDef[i].values
      })
    }

    const variantsToInsert = variants.map((v: any) => ({
      product_id: product.id,
      title: v.title,
      price: v.price,
      stock: v.stock,
      sku: v.sku || null,
      options: v.options
    }))
    await supabase.from('product_variants').insert(variantsToInsert)
  }

  revalidatePath('/dashboard/products')
  redirect('/dashboard/products')
}

export async function createArtsProductAction(prevState: any, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data: store } = await supabase.from('stores').select('id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single()
  if (!store) return { error: 'Store not found' }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const subCategory = formData.get('subCategory') as string
  const brand = formData.get('brand') as string
  const condition = formData.get('condition') as string
  const attributesStr = formData.get('attributesJson') as string
  
  const hasOptions = formData.get('hasOptions') === 'true'
  const optionsDefStr = formData.get('optionsDef') as string
  const variantsJsonStr = formData.get('variantsJson') as string

  if (!name?.trim()) return { error: 'Product name is required' }
  
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'product'
  const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(7)}`
  
  const attributes = attributesStr ? JSON.parse(attributesStr) : {}
  const optionsDef = optionsDefStr ? JSON.parse(optionsDefStr) : []
  const variants = variantsJsonStr ? JSON.parse(variantsJsonStr) : []

  // Extract base price and stock
  const basePrice = variants.length > 0 ? (Number(variants[0].price) || 0) : (Number(formData.get('price')) || 0)
  const baseStock = variants.length > 0 ? (Number(variants[0].stock) || 0) : (Number(formData.get('stock')) || 0)

  // Insert product
  const { data: product, error: productError } = await supabase.from('products').insert({
    store_id: store.id,
    name,
    slug: uniqueSlug,
    description,
    price: basePrice,
    stock: baseStock,
    is_digital: false,
    is_published: true,
    sub_category: subCategory,
    brand: brand || null,
    condition: condition || null,
    attributes: attributes,
    has_variants: hasOptions && variants.length > 0
  }).select().single()

  if (productError || !product) {
    console.error('Beauty product error:', productError)
    return { error: 'Failed to create arts, crafts & collectibles product.' }
  }

  // Handle Photos
  const photos = formData.getAll('photos') as File[]
  const validPhotos = photos.filter(f => f && f.size > 0 && f.name)
  
  if (validPhotos.length > 0) {
    let position = 0
    for (const file of validPhotos) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${store.id}/${product.id}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file)
      
      if (!uploadError && uploadData) {
        const { data: publicUrl } = supabase.storage.from('product-images').getPublicUrl(fileName)
        await supabase.from('product_images').insert({
          product_id: product.id,
          image_url: publicUrl.publicUrl,
          display_order: position
        })
        position++
      }
    }
  }

  // Handle Options and Variants dynamically
  if (hasOptions && variants.length > 0 && optionsDef.length > 0) {
    // optionsDef is an array of objects: [{ name: 'Weight', values: ['1kg', '2kg'] }, { name: 'Flavour', values: ['Vanilla'] }]
    for (let i = 0; i < optionsDef.length; i++) {
      await supabase.from('product_options').insert({
        product_id: product.id,
        name: optionsDef[i].name,
        position: i,
        values: optionsDef[i].values
      })
    }

    const variantsToInsert = variants.map((v: any) => ({
      product_id: product.id,
      title: v.title,
      price: v.price,
      stock: v.stock,
      sku: v.sku || null,
      options: v.options
    }))
    await supabase.from('product_variants').insert(variantsToInsert)
  }

  revalidatePath('/dashboard/products')
  redirect('/dashboard/products')
}