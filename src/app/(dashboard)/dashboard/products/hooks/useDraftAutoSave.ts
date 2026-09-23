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

    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        onRestore(parsed)
      }
    } catch (e) {
      // Corrupted data — clear it
      localStorage.removeItem(storageKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Auto-save on every change (debounced 1s) ──
  useEffect(() => {
    // Skip the very first render (the initial default state)
    if (isFirstSave.current) {
      isFirstSave.current = false
      return
    }

    const timer = setTimeout(() => {
      try {
        // Strip out File objects — they can't be serialised
        const clean: Record<string, any> = {}
        for (const [key, val] of Object.entries(currentState)) {
          if (val instanceof File) continue
          if (Array.isArray(val) && val.length > 0 && val[0] instanceof File) continue
          clean[key] = val
        }
        localStorage.setItem(storageKey, JSON.stringify(clean))
      } catch (e) {
        // Storage full or private browsing — silently ignore
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [currentState, storageKey])

  // ── Clear draft — call this RIGHT BEFORE formAction() ──
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey)
    } catch (e) {}
  }, [storageKey])

  return { clearDraft }
}
