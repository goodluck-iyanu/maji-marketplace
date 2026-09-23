'use client'

import { useEffect, useState, useRef } from 'react'
import { saveDraftAction, getDraftAction, clearDraftAction } from '../draft-actions'
import { saveDraftFiles, getDraftFiles, clearDraftFiles } from './idbFiles'

export function useDraftAutoSave(productType: string, currentState: any, onRestore: (data: any) => void) {
  const [isRestoring, setIsRestoring] = useState(true)
  const isFirstRender = useRef(true)

  // Load draft on mount
  useEffect(() => {
    let isMounted = true
    const loadDraft = async () => {
      let combinedData: any = {}
      
      // Load JSON state from backend
      const res = await getDraftAction(productType)
      if (res.success && res.data) {
        combinedData = { ...res.data }
      }

      // Load File state from browser IndexedDB
      try {
        const idbFiles = await getDraftFiles(productType)
        if (idbFiles) {
          combinedData = { ...combinedData, ...idbFiles }
        }
      } catch (err) {
        console.error('Failed to load local files from IDB', err)
      }

      if (isMounted && Object.keys(combinedData).length > 0) {
        onRestore(combinedData)
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

    // Prevent saving immediately on the first render
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const handler = setTimeout(() => {
      let fileData: any = {}
      
      // Separate files vs simple JSON
      const cleanState = JSON.parse(JSON.stringify(currentState, (key, value) => {
        // Intercept File objects and arrays of File objects
        if (value && typeof value === 'object' && 'size' in value && 'name' in value && 'type' in value) {
          // Found a file
          if (!fileData[key]) fileData[key] = value
          return undefined
        }
        return value
      }))
      
      // Since JSON.stringify intercepts properties recursively, we need to explicitly pull out the root file variables 
      // just in case they are completely omitted. Let's do a fast manual scan of the root.
      Object.entries(currentState).forEach(([key, val]) => {
        if (val instanceof File) {
          fileData[key] = val
        } else if (Array.isArray(val) && val.length > 0 && val[0] instanceof File) {
          fileData[key] = val
        }
      })

      // 1. Save normal data to Backend
      saveDraftAction(productType, cleanState)
      
      // 2. Save file data to IndexedDB
      if (Object.keys(fileData).length > 0) {
         saveDraftFiles(productType, fileData).catch(e => console.error(e))
      }
    }, 1500) // 1.5 second debounce

    return () => clearTimeout(handler)
  }, [currentState, productType, isRestoring])

  const clearDraft = async () => {
    await clearDraftAction(productType)
    try {
      await clearDraftFiles(productType)
    } catch (e) {}
  }

  return { isRestoring, clearDraft }
}
