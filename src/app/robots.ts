import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL || 'https://maji.hoberg.com.ng'
  ).replace(/\/$/, '')

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/store/', '/login', '/humans.txt', '/llms.txt', '/brand/'],
        disallow: [
          '/hq/',
          '/admin/',
          '/dashboard/',
          '/onboarding/',
          '/checkout/',
          '/track/',
          '/auth/',
          '/api/',
          '/store/*/cart',
          '/store/*/order/',
        ],
      },
      {
        userAgent: ['Googlebot', 'Googlebot-Image', 'Bingbot'],
        allow: ['/', '/store/', '/login', '/brand/'],
        disallow: [
          '/hq/',
          '/admin/',
          '/dashboard/',
          '/onboarding/',
          '/checkout/',
          '/track/',
          '/auth/',
          '/api/',
          '/store/*/cart',
          '/store/*/order/',
        ],
      },
    ],
    host: baseUrl,
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
