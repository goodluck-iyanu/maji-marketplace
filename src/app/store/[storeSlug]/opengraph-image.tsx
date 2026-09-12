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
    .select('name, store_settings(primary_color, secondary_color, logo_url)')
    .eq('slug', params.storeSlug)
    .single()

  const name = store?.name || 'Maji Store'
  const settings: any = (Array.isArray(store?.store_settings) ? store?.store_settings[0] : store?.store_settings) || {}
  const bg = settings.secondary_color || '#ffffff'
  const fg = settings.primary_color || '#000000'

  return new ImageResponse(
    (
      <div
        style={{
          background: bg,
          color: fg,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          border: `16px solid ${fg}`
        }}
      >
        {settings.logo_url ? (
          <img src={settings.logo_url} alt="Logo" style={{ maxHeight: '200px', marginBottom: '40px' }} />
        ) : (
          <div style={{ fontSize: 80, fontWeight: 800, marginBottom: 20 }}>
            {name}
          </div>
        )}
        <div style={{ fontSize: 40, opacity: 0.8 }}>
          Shop our latest collection
        </div>
      </div>
    ),
    { ...size }
  )
}



