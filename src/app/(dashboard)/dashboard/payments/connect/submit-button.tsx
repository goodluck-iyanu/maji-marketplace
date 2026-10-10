'use client'

import { useFormStatus } from 'react-dom'
import { MajiSpinner } from '@/components/brand/maji-brand'

export function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button 
      type="submit" 
      disabled={pending}
      className="bg-[#111111] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#F05A28] transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
    >
      {pending && <MajiSpinner size={16} color="white" />}
      {pending ? 'Connecting...' : 'Connect Account'}
    </button>
  )
}

