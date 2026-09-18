import Link from 'next/link'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="h-24 w-24 bg-orange-50 rounded-full flex items-center justify-center">
            <AlertCircle className="h-12 w-12 text-[#FF7A00]" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - Page Not Found</h1>
        
        <p className="text-lg text-gray-600 mb-8">
          Oops! The page you are looking for doesn't exist. Please check the link or try again later.
        </p>
        
        <Link 
          href="/" 
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#FF7A00] hover:bg-[#e66e00] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Go back home
        </Link>
      </div>
    </div>
  )
}
