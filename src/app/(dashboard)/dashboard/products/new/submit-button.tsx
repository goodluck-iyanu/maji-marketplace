'use client'

import { useFormStatus } from 'react-dom'
import { Save } from 'lucide-react'
import { MajiSpinner } from '@/components/brand/maji-brand'

export function SubmitButton({ label = 'Save Product' }: { label?: string }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-[#111111] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#F05A28] transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-xs"
    >
      {pending ? (
        <MajiSpinner size={16} color="white" />
      ) : (
        <Save className="h-4 w-4" />
      )}
      {pending ? 'Saving...' : label}
    </button>
  )
}
