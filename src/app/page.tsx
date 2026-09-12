import Link from 'next/link'
import { Store } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-8">
      <div className="flex flex-col items-center justify-center space-y-6 max-w-2xl text-center">
        <div className="h-16 w-16 bg-black text-white rounded-full flex items-center justify-center">
           <Store className="h-8 w-8" />
        </div>
        <h1 className="text-5xl font-bold tracking-tight">
          Create your online store in minutes.
        </h1>
        <p className="text-xl text-gray-500">
          Maji handles the infrastructure. You focus on selling.
        </p>
        <div className="pt-4 flex gap-4">
          <Link
            href="/login"
            className="bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors"
          >
            Start Selling
          </Link>
          <Link
            href="/login"
            className="border border-gray-200 text-gray-700 px-8 py-3 rounded-full font-medium hover:bg-gray-50 transition-colors"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  )
}
