'use client'

import { useState } from 'react'
import { Copy, Check, ExternalLink, Share2 } from 'lucide-react'

export function StorefrontLink({ storeSlug }: { storeSlug: string }) {
  const [copied, setCopied] = useState(false)
  const storeUrl = typeof window !== 'undefined' ? `${window.location.origin}/store/${storeSlug}` : ''

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Store',
          url: storeUrl
        })
      } catch (err) {
        console.error('Failed to share', err)
      }
    } else {
      copyToClipboard()
    }
  }

  return (
    <div className="mt-8 pt-6 border-t border-gray-800">
      <div className="mb-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Your Store Link</h3>
      </div>
      <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
        <div className="flex items-center justify-between gap-2 mb-3">
          <a 
            href={`/store/${storeSlug}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-gray-300 hover:text-white truncate transition-colors flex items-center"
          >
            {storeSlug}
            <ExternalLink className="ml-1.5 h-3 w-3" />
          </a>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={copyToClipboard}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-green-400" />
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
          
          <button
            onClick={shareLink}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded transition-colors"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  )
}
