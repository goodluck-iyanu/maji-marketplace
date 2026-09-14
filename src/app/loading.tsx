import { Loader2 } from 'lucide-react'

export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
      <Loader2 className="h-10 w-10 text-gray-400 animate-spin mb-4" />
      <p className="text-gray-500 font-medium">Loading...</p>
    </div>
  )
}
