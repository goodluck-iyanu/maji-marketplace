'use client'

import { useState } from 'react'
import {
  CheckCircle2,
  ChevronRight,
  Copy,
  Check,
  ExternalLink,
  X,
  Building,
  PackagePlus,
  Share2,
} from 'lucide-react'
import Link from 'next/link'
import { MajiLogo } from '@/components/brand/maji-brand'

export function OnboardingBanner({
  hasBank,
  hasProduct,
  storeSlug,
}: {
  hasBank: boolean
  hasProduct: boolean
  storeSlug: string
}) {
  const [copied, setCopied] = useState(false)
  const [dismissed, setDismissed] = useState(false)

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
      icon: Building,
    },
    {
      id: 2,
      title: 'Add First Product',
      description: 'Start selling to your customers',
      completed: hasProduct,
      action: '/dashboard/products/new',
      icon: PackagePlus,
    },
    {
      id: 3,
      title: 'Share Store URL',
      description: 'Let the world know you are open',
      completed: false,
      action: '#',
      icon: Share2,
    },
  ]

  const currentStep = steps.find((s) => !s.completed) || steps[2]

  return (
    <div className="bg-white border border-[#111111]/[0.08] rounded-3xl shadow-sm mb-6 overflow-hidden relative animate-in fade-in slide-in-from-top-4">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#F05A28] via-[#FF8559] to-[#F05A28]" />

      <div className="absolute top-5 right-5">
        <button
          onClick={() => setDismissed(true)}
          className="text-neutral-400 hover:text-[#111111] transition-colors p-1 rounded-lg hover:bg-neutral-100"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-6 sm:p-7">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-[#FAF8F5] border border-[#111111]/[0.07] flex items-center justify-center shrink-0">
            <MajiLogo variant="symbol" colorway="ember-orange" size={26} animation="bounce" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#111111]">
              Welcome to Maji! Let&apos;s get you set up
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500">
              Complete these quick steps to start receiving orders and automated payouts.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {steps.map((step) => {
            const isCurrent = currentStep.id === step.id
            const StepIcon = step.icon

            return (
              <div
                key={step.id}
                className={`relative p-4.5 rounded-2xl border transition-all ${
                  step.completed
                    ? 'border-emerald-200 bg-emerald-50/40'
                    : isCurrent
                    ? 'border-[#F05A28]/40 bg-[#FAF8F5] ring-1 ring-[#F05A28]/20'
                    : 'border-neutral-100 bg-neutral-50/60 opacity-65'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                        step.completed
                          ? 'bg-emerald-100 text-emerald-600'
                          : isCurrent
                          ? 'bg-[#F05A28]/15 text-[#F05A28]'
                          : 'bg-neutral-200 text-neutral-500'
                      }`}
                    >
                      {step.completed ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <StepIcon className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <h3
                        className={`text-sm font-bold ${
                          step.completed
                            ? 'text-emerald-900'
                            : isCurrent
                            ? 'text-[#111111]'
                            : 'text-neutral-600'
                        }`}
                      >
                        {step.title}
                      </h3>
                      <p className="text-xs text-neutral-500 mt-0.5">{step.description}</p>
                    </div>
                  </div>
                </div>

                {isCurrent && !step.completed && step.id !== 3 && (
                  <div className="mt-4">
                    <Link
                      href={step.action}
                      className="inline-flex items-center text-xs font-semibold text-white bg-[#111111] hover:bg-[#F05A28] px-4 py-2 rounded-xl transition-colors"
                    >
                      Complete step <ChevronRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}

                {step.id === 3 && hasBank && hasProduct && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex-1 inline-flex justify-center items-center text-xs font-semibold text-[#F05A28] bg-[#F05A28]/10 hover:bg-[#F05A28]/20 px-3 py-2 rounded-xl transition-colors"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 mr-1" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 mr-1" />
                      )}
                      {copied ? 'Copied!' : 'Copy link'}
                    </button>
                    <Link
                      href={`/store/${storeSlug}`}
                      target="_blank"
                      className="inline-flex justify-center items-center text-xs font-semibold text-[#111111] bg-neutral-100 hover:bg-neutral-200 px-3 py-2 rounded-xl transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
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
