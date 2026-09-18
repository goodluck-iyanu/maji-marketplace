import os
import uuid

CODE = """
export async function createDigitalProductAction(prevState: any, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!store) return { error: 'Store not found' }

  const name = formData.get('name') as string
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + uuidv4().substring(0, 4)
  const description = formData.get('description') as string
  
  const category = formData.get('category') as string
  const app = formData.get('app') as string
  const format = formData.get('format') as string
  const includesStr = formData.get('includes') as string
  const storeCategory = formData.get('storeCategory') as string
  
  let includes = []
  try {
    includes = JSON.parse(includesStr || '[]')
  } catch(e) {}
  
  let fullDescription = description
  
  let detailsObj: any = {}
  if (category) detailsObj.Category = category
  if (app && app !== 'None' && app !== 'Any') detailsObj.Software = app
  if (format && format !== 'LINK' && format !== 'OTHER') detailsObj.Format = format
  if (includes.length > 0) detailsObj.Includes = includes.join(', ')
  
  if (Object.keys(detailsObj).length > 0) {
    fullDescription += '\\n\\n**Product Details:**'
    for (const [key, value] of Object.entries(detailsObj)) {
      fullDescription += `\\n- **${key}:** ${value}`
    }
  }

  const priceStr = formData.get('price') as string
  const salePriceStr = formData.get('salePrice') as string
  const price = salePriceStr ? parseFloat(salePriceStr) : parseFloat(priceStr || '0')

  const deliveryType = formData.get('deliveryType') as string
  let digitalFileId = null
  
  if (deliveryType === 'link') {
    digitalFileId = 'LINK::' + formData.get('digitalFileLink')
  } else {
    digitalFileId = formData.get('digitalFileId') as string
  }
  
  const digitalFileSize = formData.get('digitalFileSize') as string
  const downloadsAllowedStr = formData.get('downloadsAllowed') as string
  const downloadsAllowed = parseInt(downloadsAllowedStr || '-1', 10)
  
  const productType = formData.get('productType') as string

  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      store_id: store.id,
      name,
      slug,
      description: fullDescription,
      price,
      is_digital: productType === 'digital',
      stock: 1000000,
      digital_file_id: digitalFileId,
      digital_file_size: digitalFileSize,
      downloads_allowed: downloadsAllowed,
      digital_format: format,
    })
    .select('id')
    .single()

  if (productError) {
    console.error('Error creating product:', productError)
    return { error: 'Failed to create product' }
  }

  const coverPhoto = formData.get('coverPhoto') as File
  if (coverPhoto && coverPhoto.size > 0) {
    const ext = coverPhoto.name.split('.').pop()
    const fileName = `${product.id}/cover-${uuidv4()}.${ext}`
    
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, coverPhoto)

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName)

      await supabase
        .from('product_images')
        .insert({
          product_id: product.id,
          image_url: publicUrl,
          display_order: 0
        })
    }
  }

  revalidatePath('/dashboard/products')
  redirect('/dashboard/products')
}
"""

with open('src/app/(dashboard)/dashboard/products/actions.ts', 'a', encoding='utf-8') as f:
    f.write('\\n' + CODE + '\\n')
