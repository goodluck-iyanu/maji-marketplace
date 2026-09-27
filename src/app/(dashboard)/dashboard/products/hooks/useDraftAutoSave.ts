'use client'

import { useEffect, useRef, useCallback } from 'react'

const STORAGE_PREFIX = 'maji_draft_'

/**
 * Auto-saves product builder state to localStorage.
 * Restores it on mount. Clears it when clearDraft() is called.
 * 
 * IMPORTANT: File objects (images) cannot be saved to localStorage.
 * Only text fields, selections, and step progress are persisted.
 */
export function useDraftAutoSave(
  productType: string,
  currentState: Record<string, any>,
  onRestore: (data: Record<string, any>) => void
) {
  const storageKey = STORAGE_PREFIX + productType
  const hasRestored = useRef(false)
  const isFirstSave = useRef(true)

  // ── Restore on mount (runs once) ──
  useEffect(() => {
    if (hasRestored.current) return
    hasRestored.current = true

    // disabled auto-restore because it prevents users from starting a fresh product
    // we also aggressively clear any lingering drafts to fix the bug where old drafts appear
    try {
      localStorage.removeItem(storageKey)
    } catch (e) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Auto-save on every change (debounced 1s) ──
  useEffect(() => {
    // Disabled auto-save completely to prevent conflicts when creating new products
    //
    // if (isFirstSave.current) {
    //   isFirstSave.current = false
    //   return
    // }
    //
    // const timer = setTimeout(() => {
    //   try {
    //     const clean: Record<string, any> = {}
    //     for (const [key, val] of Object.entries(currentState)) {
    //       if (val instanceof File) continue
    //       if (Array.isArray(val) && val.length > 0 && val[0] instanceof File) continue
    //       clean[key] = val
    //     }
    //     localStorage.setItem(storageKey, JSON.stringify(clean))
    //   } catch (e) {}
    // }, 1000)
    //
    // return () => clearTimeout(timer)
  }, [currentState, storageKey])

  // ── Clear draft — call this RIGHT BEFORE formAction() ──
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey)
    } catch (e) {}
  }, [storageKey])

  return { clearDraft }
}
