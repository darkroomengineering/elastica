'use client'

import { useEffect, useState } from 'react'
import { Pane } from 'tweakpane'

interface TweakpaneBinding {
  key: string
  label: string
  min?: number
  max?: number
  step?: number
  options?: Record<string, string>
  x?: { min: number; max: number; step: number }
  y?: { min: number; max: number; step: number }
}

interface UseTweakpaneOptions<T> {
  initialParams: T
  bindings: TweakpaneBinding[]
  onPlayChange?: (playing: boolean) => void
}

/**
 * Custom hook for creating Tweakpane debug UI controls.
 * @param options - Configuration for the tweakpane
 * @returns The current parameter values
 */
export function useTweakpane<T extends Record<string, unknown>>({
  initialParams,
  bindings,
  onPlayChange,
}: UseTweakpaneOptions<T>): T {
  const [params, setParams] = useState<T>(initialParams)

  useEffect(() => {
    const pane = new Pane()
    const paneParams = { ...initialParams } as Record<string, unknown>

    for (const { key, label, ...options } of bindings) {
      if (key === 'play' && onPlayChange) {
        pane.addBinding(paneParams, key, { label }).on('change', (ev) => {
          onPlayChange(ev.value as boolean)
        })
      } else {
        pane
          .addBinding(paneParams, key, { label, ...options })
          .on('change', (ev) => {
            setParams((prev) => ({
              ...prev,
              [key]: ev.value,
            }))
          })
      }
    }

    return () => {
      pane.dispose()
    }
    // eslint-disable-next-line react-compiler/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return params
}
