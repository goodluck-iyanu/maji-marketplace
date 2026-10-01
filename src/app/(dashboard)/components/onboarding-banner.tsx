'use client'

import { useState } from 'react'
import { CheckCircle2, ChevronRight, Copy, Check, ExternalLink, X, Building, PackagePlus, Share2 } from 'lucide-react'
import Link from 'next/link'

export function OnboardingBanner({
  hasBank,
  hasProduct,
  storeSlug
}: {
  hasBank: boolean
  hasProduct: boolean
  storeSlug: string
}) {
  const [copied, setCopied] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // If they completed both steps, the banner disappears naturally (unless we want to show a final "You're all set!" state briefly)
  // But let's say if they have both, we don't show it at all.
  if (hasBank && hasProduct) {
    return null
  }

  if (dismissed) return null

  const handleCopy = () => {
    const url = `${window.location.origin}/store/${storeSlug}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const steps = [
    {
      id: 1,
      title: 'Add Bank Account',
      description: 'Where you will receive your payouts',
      completed: hasBank,
      action: '/dashboard/payments/connect',
      icon: Building
    },
    {
      id: 2,
      title: 'Add First Product',
      description: 'Start selling to your customers',
      completed: hasProduct,
      action: '/dashboard/products/new',
      icon: PackagePlus
    },
    {
      id: 3,
      title: 'Share Store URL',
      description: 'Let the world know you are open',
      completed: false, // You can't strictly track this, but we'll show it active once product is added
      action: '#',
      icon: Share2
    }
  ]

  const currentStep = steps.find(s => !s.completed) || steps[2]

  return (
    <div className="bg-white border border-blue-100 rounded-xl shadow-sm mb-6 overflow-hidden relative animate-in fade-in slide-in-from-top-4">
      <div className="absolute top-4 right-4">
        <button onClick={() => setDismissed(true)} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to Maji! Let's get you set up</h2>
        <p className="text-gray-500 mb-6">Complete these simple steps to start receiving orders.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((step, idx) => {
            const isCurrent = currentStep.id === step.id
            const StepIcon = step.icon
            
            return (
              <div 
                key={step.id} 
                className={`relative p-4 rounded-lg border ${
                  step.completed 
                    ? 'border-green-200 bg-green-50/50' 
                    : isCurrent 
                      ? 'border-blue-200 bg-blue-50/50 ring-1 ring-blue-500/20' 
                      : 'border-gray-100 bg-gray-50/50 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                      step.completed ? 'bg-green-100 text-green-600' : isCurrent ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {step.completed ? <CheckCircle2 className="h-5 w-5" /> : <StepIcon className="h-4 w-4" />}
                    </div>
                    <div>
                      <h3 className={`font-semibold ${step.completed ? 'text-green-800' : isCurrent ? 'text-blue-900' : 'text-gray-600'}`}>
                        {step.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                    </div>
                  </div>
                </div>

                {isCurrent && !step.completed && step.id !== 3 && (
                  <div className="mt-4">
                    <Link 
                      href={step.action}
                      className="inline-flex items-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
                    >
                      Complete step <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                )}

                {step.id === 3 && (hasBank && hasProduct) && (
                  <div className="mt-4 flex gap-2">
                    <button 
                      onClick={handleCopy}
                      className="flex-1 inline-flex justify-center items-center text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 px-3 py-2 rounded-lg transition-colors"
                    >
                      {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                      {copied ? 'Copied!' : 'Copy link'}
                    </button>
                    <Link
                      href={`/store/${storeSlug}`}
                      target="_blank"
                      className="inline-flex justify-center items-center text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

