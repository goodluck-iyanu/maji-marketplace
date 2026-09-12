'use client'

import { useFormStatus } from 'react-dom'
import { Save, Loader2 } from 'lucide-react'

export function SubmitButton({ label = 'Save Product' }: { label?: string }) {
  const { pending } = useFormStatus()

  return (
    <button 
      type="submit" 
      disabled={pending}
      className="bg-black text-white px-6 py-2 rounded-md font-medium hover:bg-gray-800 transition-colors flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Save className="h-4 w-4 mr-2" />
      )}
      {pending ? 'Saving Product...' : 'Save Product'}
      {pending ? 'Saving...' : label}
    </button>
  )
}



