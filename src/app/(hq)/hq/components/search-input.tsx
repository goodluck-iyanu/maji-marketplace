'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { useTransition, useState, useEffect } from 'react'

export function SearchInput({ placeholder = "Search..." }: { placeholder?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const [query, setQuery] = useState(searchParams.get('q') || '')

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const currentQ = searchParams.get('q') || ''
      if (query === currentQ) return

      const params = new URLSearchParams(searchParams.toString())
      if (query) {
        params.set('q', query)
      } else {
        params.delete('q')
      }
      params.set('page', '1') // reset to page 1 on search

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    }, 400) // 400ms debounce

    return () => clearTimeout(delayDebounceFn)
  }, [query, pathname, router, searchParams])

  return (
    <div className="relative w-full max-w-sm">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className={`h-4 w-4 ${isPending ? 'text-blue-500 animate-pulse' : 'text-gray-400'}`} />
      </div>
      <input
        type="text"
        className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </div>
  )
}
