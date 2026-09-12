'use client'

import { useState, useEffect } from 'react'
import { Building, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { getBanks, resolveAccount, connectBankAccount } from '../actions'
import { SubmitButton } from './submit-button'

export function ConnectBankForm() {
  const [banks, setBanks] = useState<any[]>([])
  const [accountNumber, setAccountNumber] = useState('')
  const [bankCode, setBankCode] = useState('')
  const [accountName, setAccountName] = useState('')
  const [isResolving, setIsResolving] = useState(false)
  const [resolveError, setResolveError] = useState('')

  useEffect(() => {
    async function loadBanks() {
      const data = await getBanks()
      setBanks(data)
    }
    loadBanks()
  }, [])

  useEffect(() => {
    if (accountNumber.length === 10 && bankCode) {
      async function resolve() {
        setIsResolving(true)
        setResolveError('')
        setAccountName('')
        
        const res = await resolveAccount(accountNumber, bankCode)
        if (res.success) {
          setAccountName(res.account_name)
        } else {
          setResolveError(res.message)
        }
        setIsResolving(false)
      }
      resolve()
    } else {
      setAccountName('')
      setResolveError('')
    }
  }, [accountNumber, bankCode])

  return (
    <form action={connectBankAccount} className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="mb-6 flex justify-center">
            <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center">
               <Building className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
            <input 
              type="text" 
              name="account_number"
              required
              maxLength={10}
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black" 
              placeholder="0123456789"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bank</label>
            <select 
              name="bank_code"
              required
              value={bankCode}
              onChange={(e) => setBankCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black bg-white"
            >
              <option value="">Select a bank...</option>
              {banks.map((bank: any) => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
            <div className="relative">
              <input 
                type="text" 
                name="account_name"
                required
                readOnly
                value={accountName}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none bg-gray-50 ${resolveError ? 'border-red-300' : 'border-gray-300'}`} 
                placeholder="Automatically resolved"
              />
              <div className="absolute right-3 top-2.5">
                {isResolving && <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />}
                {accountName && !isResolving && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                {resolveError && !isResolving && <AlertCircle className="h-5 w-5 text-red-500" />}
              </div>
            </div>
            {resolveError && (
              <p className="text-sm text-red-500 mt-1">{resolveError}</p>
            )}
          </div>
          
          <div className="pt-4 text-sm text-gray-500">
             By connecting, you agree to Maji's terms of service and authorize us to send payouts to this account.
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  )
}

