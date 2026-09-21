'use client'

import { useState, useTransition, useEffect } from 'react'
import { login } from './actions'
import { Loader2 } from 'lucide-react'

export function LoginForm() {
  const [isPending, startTransition] = useTransition()
  const [countdown, setCountdown] = useState(0)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let timer: any
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000)
    }
    return () => clearInterval(timer)
  }, [countdown])

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (countdown > 0) return

    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      setError('')
      setMessage('')
      
      const res = await login(formData)
      if (res?.error) {
        setError(res.error)
      } else {
        setMessage('Check your email! We sent you a secure link to sign in.')
        setCountdown(60)
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col w-full justify-center gap-2 text-foreground">
      <label className="text-md" htmlFor="email">
        Email
      </label>
      <input
        className="rounded-md px-4 py-2 bg-inherit border mb-4 focus:ring-2 focus:ring-black focus:outline-none"
        name="email"
        type="email"
        placeholder="you@example.com"
        required
      />
      
      <label className="text-md" htmlFor="phone">
        Phone Number (Required)
      </label>
      <input
        className="rounded-md px-4 py-2 bg-inherit border mb-6 focus:ring-2 focus:ring-black focus:outline-none"
        name="phone"
        type="tel"
        placeholder="e.g. +2348012345678"
        required
      />

      <button
        disabled={isPending || countdown > 0}
        type="submit"
        className="bg-black text-white rounded-md px-4 py-2 mb-2 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium"
      >
        {isPending ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait...</>
        ) : countdown > 0 ? (
          `Wait ${countdown}s to request again`
        ) : (
          'Sign In / Register'
        )}
      </button>

      {error && (
        <p className="mt-4 p-4 bg-red-50 text-red-600 text-center text-sm border border-red-200 rounded-md">
          {error}
        </p>
      )}
      {message && (
        <p className="mt-4 p-4 bg-green-50 text-green-700 text-center text-sm border border-green-200 rounded-md font-medium">
          {message}
        </p>
      )}
    </form>
  )
}
