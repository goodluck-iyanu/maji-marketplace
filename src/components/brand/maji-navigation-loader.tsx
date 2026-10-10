'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { MajiLogo, MajiSpinner } from './maji-brand'

function NavigationLoaderInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isNavigating, setIsNavigating] = useState(false)
  const [isSubmittingForm, setIsSubmittingForm] = useState(false)
  const [targetPath, setTargetPath] = useState<string | null>(null)

  const currentUrlKey = `${pathname}?${searchParams?.toString() || ''}`

  // Clear loader whenever route finishes updating
  useEffect(() => {
    setIsNavigating(false)
    setIsSubmittingForm(false)
    setTargetPath(null)
  }, [currentUrlKey])

  // Intercept internal link clicks and form submissions globally
  useEffect(() => {
    let safetyTimer: ReturnType<typeof setTimeout> | null = null
    let pollInterval: ReturnType<typeof setInterval> | null = null

    const clearTimers = () => {
      if (safetyTimer) {
        clearTimeout(safetyTimer)
        safetyTimer = null
      }
      if (pollInterval) {
        clearInterval(pollInterval)
        pollInterval = null
      }
    }

    const startNavigation = (destPath: string) => {
      clearTimers()
      setTargetPath(destPath)
      setIsNavigating(true)
      safetyTimer = setTimeout(() => {
        setIsNavigating(false)
        setTargetPath(null)
      }, 10000)
    }

    const handleClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

      const anchor = (e.target as HTMLElement | null)?.closest?.('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('javascript:')
      ) {
        return
      }
      if (anchor.target && anchor.target !== '_self') return
      if (anchor.hasAttribute('download')) return

      try {
        const url = new URL(href, window.location.origin)
        if (url.origin !== window.location.origin) return

        const destKey = `${url.pathname}?${url.searchParams.toString()}`
        const nowKey = `${window.location.pathname}?${new URLSearchParams(window.location.search).toString()}`
        if (destKey === nowKey) return

        startNavigation(url.pathname)
      } catch {
        // Ignore malformed URLs
      }
    }

    const handleSubmit = (e: SubmitEvent) => {
      if (e.defaultPrevented) return
      const form = e.target as HTMLFormElement | null
      if (!form) return

      const actionAttr = form.getAttribute('action')
      if (actionAttr && actionAttr.startsWith('/')) {
        startNavigation(actionAttr)
        return
      }

      // For React Server Actions and async form submissions, watch the form's submit button
      // while it is in a pending/disabled state.
      setTimeout(() => {
        const submitBtn = form.querySelector('button[type="submit"], button:not([type])') as HTMLButtonElement | null
        if (submitBtn && submitBtn.disabled && form.isConnected) {
          clearTimers()
          setIsSubmittingForm(true)

          pollInterval = setInterval(() => {
            if (!form.isConnected || !submitBtn.isConnected || !submitBtn.disabled) {
              setIsSubmittingForm(false)
              clearTimers()
            }
          }, 100)

          safetyTimer = setTimeout(() => {
            setIsSubmittingForm(false)
            clearTimers()
          }, 25000)
        }
      }, 60)
    }

    document.addEventListener('click', handleClick, false)
    document.addEventListener('submit', handleSubmit, false)

    return () => {
      document.removeEventListener('click', handleClick, false)
      document.removeEventListener('submit', handleSubmit, false)
      clearTimers()
    }
  }, [])

  // Avoid duplicate overlay on auth pages that already render MajiLoginSplashOverlay
  const isAuthPage =
    pathname === '/login' || pathname === '/signup' || pathname === '/verify'

  if (!isNavigating && (!isSubmittingForm || isAuthPage)) return null

  const activeRoute = targetPath || pathname || '/'
  const isHQ = activeRoute.startsWith('/hq')
  const isDashboard = activeRoute.startsWith('/dashboard') || activeRoute.startsWith('/onboarding')
  const isStore = activeRoute.startsWith('/store')

  const animation = isHQ
    ? 'trace'
    : isDashboard
    ? 'rocker'
    : isStore
    ? 'bounce'
    : 'splash'

  const label = isSubmittingForm
    ? 'Processing your request...'
    : isHQ
    ? 'Loading Maji HQ...'
    : isDashboard
    ? 'Loading Seller Studio...'
    : isStore
    ? 'Loading Storefront...'
    : 'Loading Maji...'

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center px-6 transition-opacity duration-150 ${
        isHQ
          ? 'bg-[#111111]/85 text-white backdrop-blur-md'
          : 'bg-[#FAF8F5]/85 text-[#111111] backdrop-blur-md'
      }`}
    >
      {/* Ambient Ember Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full blur-3xl opacity-25"
        style={{
          background: 'radial-gradient(circle, #F05A28 0%, #FF8559 55%, transparent 100%)',
        }}
      />

      <div
        className={`relative z-10 flex flex-col items-center text-center rounded-3xl p-7 border shadow-2xl ${
          isHQ
            ? 'bg-[#18181b] border-white/10 shadow-black/50'
            : 'bg-white border-[#111111]/[0.08] shadow-black/10'
        }`}
      >
        <div className="mb-4 flex items-center justify-center">
          {animation === 'splash' ? (
            <MajiLogo
              variant="horizontal"
              colorway={isHQ ? 'ember-duotone-dark' : 'ember-duotone-light'}
              size={56}
              animation="splash"
            />
          ) : (
            <MajiLogo
              variant="symbol"
              colorway={
                animation === 'rocker'
                  ? isHQ
                    ? 'ember-duotone-dark'
                    : 'ember-duotone-light'
                  : 'ember-orange'
              }
              size={68}
              animation={animation}
            />
          )}
        </div>

        <div className="flex items-center gap-2 text-sm font-extrabold tracking-tight">
          <MajiSpinner size={16} color="ember" />
          <span>{label}</span>
        </div>

        <div
          className={`mt-4 h-1 w-36 rounded-full overflow-hidden ${
            isHQ ? 'bg-white/10' : 'bg-[#111111]/10'
          }`}
        >
          <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-[#F05A28] to-[#FF8559] maji-shimmer-bar" />
        </div>
      </div>
    </div>
  )
}

export function MajiNavigationLoader() {
  return (
    <Suspense fallback={null}>
      <NavigationLoaderInner />
    </Suspense>
  )
}

