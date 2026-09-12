import { createClient } from '@/lib/supabase/server'
import { Building2, ShieldAlert } from 'lucide-react'
import Link from 'next/link'

export default async function PaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('user_id', user!.id)
    .single()

  const { data: payoutAccount } = await supabase
    .from('payout_accounts')
    .select('*')
    .eq('store_id', store!.id)
    .single()

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Payments & Payouts</h1>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Payout Account</h2>
          {payoutAccount && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Verified
            </span>
          )}
        </div>
        <div className="p-6 space-y-4">
          {!payoutAccount ? (
            <div className="text-center py-6">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-900">No payout account connected</h3>
              <p className="text-sm text-gray-500 mt-1 mb-4">You need to connect a bank account to receive your payouts from sales.</p>
              <Link 
                href="/dashboard/payments/connect" 
                className="inline-flex items-center bg-black text-white px-4 py-2 rounded-md font-medium hover:bg-gray-800 transition-colors"
              >
                Connect Bank Account
              </Link>
            </div>
          ) : (
            <div>
              <div className="flex items-center space-x-3 mb-6">
                 <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-gray-600" />
                 </div>
                 <div>
                    <div className="font-medium text-gray-900">{payoutAccount.account_name}</div>
                    <div className="text-sm text-gray-500">
                      {payoutAccount.bank_code} ••••{payoutAccount.account_number.slice(-4)}
                    </div>
                 </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex items-start">
                 <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                 <div>
                   <h4 className="text-sm font-medium text-amber-800">Changing payout account requires admin review</h4>
                   <p className="text-sm text-amber-700 mt-1">
                     For security, any changes to your payout account will temporarily keep the old account active until an admin verifies and approves the new one.
                   </p>
                   <button className="mt-3 text-sm font-medium text-amber-800 hover:text-amber-900 bg-amber-100 px-3 py-1.5 rounded-md">
                     Request Account Change
                   </button>
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

