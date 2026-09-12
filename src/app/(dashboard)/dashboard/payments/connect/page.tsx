import { ArrowLeft, Building } from 'lucide-react'
import Link from 'next/link'
import { ConnectBankForm } from './connect-bank-form'

export default function ConnectBankPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/payments" className="text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Connect Bank Account</h1>
      </div>

      <ConnectBankForm />
    </div>
  )
}

