'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Copy, Check, Share2, ExternalLink } from 'lucide-react'

export function StorefrontLink({ storeSlug }: { storeSlug: string }) {
  const [copied, setCopied] = useState(false)
  const [storeUrl, setStoreUrl] = useState('')

  useEffect(() => {
    // Get the actual origin so the link is correct whether on localhost or vercel
    setStoreUrl(`${window.location.origin}/store/${storeSlug}`)
  }, [storeSlug])

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault() // prevent navigating if it's a link click
    if (!storeUrl) return

    try {
      await navigator.clipboard.writeText(storeUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!storeUrl) return

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Store',
          text: 'Check out my store!',
          url: storeUrl,
        })
      } catch (err) {
        console.error('Failed to share', err)
      }
    } else {
      // Fallback to copy if native share isn't available
      handleCopy(e)
    }
  }

  return (
    <div className="flex items-center w-full gap-1 p-1 bg-[#FAF8F5] border border-[#111111]/[0.08] rounded-xl mt-3">
      <Link
        href={`/store/${storeSlug}`}
        target="_blank"
        className="flex-1 flex items-center justify-center px-2.5 py-1.5 text-xs font-semibold text-[#111111] hover:text-[#F05A28] hover:bg-white rounded-lg transition-colors"
        title="Open store"
      >
        <ExternalLink className="h-3.5 w-3.5 mr-1.5 text-[#F05A28]" />
        My Website
      </Link>

      <div className="w-px h-4 bg-neutral-200" />

      <button
        onClick={handleCopy}
        className="flex items-center justify-center p-1.5 text-neutral-500 hover:text-[#111111] hover:bg-white rounded-lg transition-all relative group cursor-pointer"
        title="Copy Link"
      >
        {copied ? (
          <Check className="h-4 w-4 text-emerald-600 animate-in zoom-in duration-200" />
        ) : (
          <Copy className="h-4 w-4 group-hover:scale-110 transition-transform" />
        )}
      </button>

      <div className="w-px h-4 bg-neutral-200" />

      <button
        onClick={handleShare}
        className="flex items-center justify-center p-1.5 text-neutral-500 hover:text-[#111111] hover:bg-white rounded-lg transition-all group cursor-pointer"
        title="Share Store"
      >
        <Share2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
      </button>
    </div>
  )
}
