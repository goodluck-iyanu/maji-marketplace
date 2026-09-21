import { Store } from 'lucide-react'
import { AuthForms } from './auth-forms'
import Link from 'next/link'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; error?: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-md">
        {/* Logo + Heading */}
        <div className="flex flex-col items-center justify-center space-y-3 mb-8">
          <Link href="/">
            <div className="h-12 w-12 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors">
              <Store className="h-6 w-6" />
            </div>
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-center">
            Welcome to Maji
          </h1>
          <p className="text-sm text-gray-500 text-center">
            Create your online store in minutes.
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <AuthForms
            defaultMode={params?.mode === 'signup' ? 'signup' : 'login'}
            initialError={params?.error}
          />
        </div>

        {/* Footer */}
        <p className="text-xs text-center text-gray-400 mt-6">
          By continuing, you agree to Maji&apos;s Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
