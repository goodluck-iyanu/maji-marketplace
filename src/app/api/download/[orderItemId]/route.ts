import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleAuth } from 'google-auth-library'

// Initialize Google Drive Auth
async function getDriveAuth() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!clientEmail || !privateKey) {
    throw new Error('Google Drive credentials are not configured.')
  }

  const auth = new GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  })

  return auth.getClient()
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderItemId: string }> }
) {
  try {
    const { orderItemId } = await params
    const supabase = await createClient()

    // 1. Fetch the order item and join with order and product to verify payment and get file ID
    const { data: orderItem, error: itemError } = await supabase
      .from('order_items')
      .select(`
        id,
        order_id,
        orders!inner(payment_status),
        products!inner(
          name, 
          is_digital, 
          digital_file_id, 
          digital_format,
          downloads_allowed
        )
      `)
      .eq('id', orderItemId)
      .single()

    if (itemError || !orderItem) {
      return NextResponse.json({ error: 'Order item not found' }, { status: 404 })
    }

    // 2. Validate Payment
    // Note: Since orders is joined as an array or object depending on schema, we cast carefully
    const orderData = orderItem.orders as any
    if (orderData.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment has not been completed for this order.' }, { status: 403 })
    }

    const product = orderItem.products as any

    // 3. Validate Digital Product
    if (!product.is_digital || !product.digital_file_id) {
      return NextResponse.json({ error: 'This is not a digital product or file is missing.' }, { status: 400 })
    }

    // If it is a link instead of a Google Drive upload, just redirect them to the link
    if (product.digital_file_id.startsWith('LINK::')) {
      const url = product.digital_file_id.replace('LINK::', '')
      return NextResponse.redirect(url)
    }

    // 4. Connect to Google Drive
    const client = await getDriveAuth()
    const accessToken = await client.getAccessToken()

    // 5. Fetch the file metadata first to get exact filename and mimeType (optional but good for headers)
    const metaResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${product.digital_file_id}?fields=name,mimeType`, {
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
      }
    })

    let mimeType = 'application/octet-stream'
    let fileName = `${product.name}.${product.digital_format || 'pdf'}`
    
    if (metaResponse.ok) {
      const meta = await metaResponse.json()
      mimeType = meta.mimeType || mimeType
      // Ensure the filename is safe
      fileName = meta.name ? meta.name.replace(/[^a-zA-Z0-9.-]/g, '_') : fileName
    } else {
      // Fallback safe filename
      fileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    }

    // 6. Stream the actual file bytes from Google Drive to the buyer
    const fileResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${product.digital_file_id}?alt=media`, {
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
      }
    })

    if (!fileResponse.ok) {
      return NextResponse.json({ error: 'Failed to download file from secure storage.' }, { status: 500 })
    }

    // Return the readable stream directly to the client (Bypasses Vercel memory limits via Edge/Node streaming)
    return new Response(fileResponse.body, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        // Pass cache headers to prevent caching sensitive downloads
        'Cache-Control': 'no-store, max-age=0',
      }
    })

  } catch (error: any) {
    console.error('Download error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred during download.' }, { status: 500 })
  }
}

