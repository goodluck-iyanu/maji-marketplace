import { Loader2 } from 'lucide-react'

export default function GlobalLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="w-12 h-12 text-[#FF7A00] animate-spin mb-4" />
      <p className="text-gray-500 font-medium animate-pulse">Loading...</p>
    </div>
  )
}
