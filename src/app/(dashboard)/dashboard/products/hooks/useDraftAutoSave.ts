'use client'

import { useEffect, useState, useRef } from 'react'
import { saveDraftAction, getDraftAction, clearDraftAction } from '../draft-actions'

export function useDraftAutoSave(productType: string, currentState: any, onRestore: (data: any) => void) {
  const [isRestoring, setIsRestoring] = useState(true)
  const isFirstRender = useRef(true)

  // Load draft on mount
  useEffect(() => {
    let isMounted = true
    const loadDraft = async () => {
      const res = await getDraftAction(productType)
      if (isMounted && res.success && res.data) {
        onRestore(res.data)
      }
      if (isMounted) {
        setIsRestoring(false)
      }
    }
    loadDraft()
    return () => { isMounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productType])

  // Save draft on change (debounced)
  useEffect(() => {
    // Prevent saving during the initial restore phase
    if (isRestoring) return

    // Prevent saving immediately on the first render if restore failed/passed but state hasn't changed
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const handler = setTimeout(() => {
      // Create a clean copy of the state, excluding File objects which can't be stringified/saved easily
      const cleanState = JSON.parse(JSON.stringify(currentState, (key, value) => {
        // Exclude File objects or anything that looks like it's a DOM node/File
        if (value && typeof value === 'object' && 'size' in value && 'name' in value && 'type' in value) {
          return undefined
        }
        return value
      }))
      
      saveDraftAction(productType, cleanState)
    }, 1500) // 1.5 second debounce

    return () => clearTimeout(handler)
  }, [currentState, productType, isRestoring])

  const clearDraft = async () => {
    await clearDraftAction(productType)
  }

  return { isRestoring, clearDraft }
}
