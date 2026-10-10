import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'
export const alt = 'Store Image'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: { storeSlug: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: store } = await supabase
    .from('stores')
    .select('name, store_settings(logo_url)')
    .eq('slug', params.storeSlug)
    .single()

  const name = store?.name || 'Maji Store'
  const settings: any = (Array.isArray(store?.store_settings) ? store?.store_settings[0] : store?.store_settings) || {}

  return new ImageResponse(
    (
      <div
        style={{
          background: '#FAF8F5',
          color: '#111111',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          border: '16px solid #F05A28'
        }}
      >
        {settings.logo_url ? (
          <img src={settings.logo_url} alt="Logo" style={{ maxHeight: '180px', marginBottom: '36px', borderRadius: '32px' }} />
        ) : (
          <div style={{ fontSize: 80, fontWeight: 800, marginBottom: 20, color: '#111111' }}>
            {name}
          </div>
        )}
        <div style={{ fontSize: 38, color: '#52525B', fontWeight: 600 }}>
          Shop online on Maji Marketplace
        </div>
      </div>
    ),
    { ...size }
  )
}



