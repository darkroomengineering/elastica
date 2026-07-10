'use client'

import { useRect } from 'hamo'
import { useEffect } from 'react'

/**
 * Keeps every hamo `useRect` on the page resolved.
 *
 * hamo resolves an element's document coordinates through a ResizeObserver on
 * `document.body` — but that observer is shared with one callback slot per
 * element, so only a single `useRect` instance ever receives body entries.
 * Any instance mounted after first paint (this site swaps its physics sims in
 * once fonts are ready) never gets its `top`, which silently disarms every
 * `useScrollTrigger` fed by it.
 *
 * `useRect.resize()` is hamo's broadcast escape hatch: every live instance
 * recomputes. Broadcast once fonts settle (right after those swaps mount) and
 * on window resize, debounced to match hamo's own cadence.
 */
export function RectSync() {
  useEffect(() => {
    let raf = 0
    let cancelled = false
    document.fonts.ready.then(() => {
      if (cancelled) return
      // the font gates flip sibling components from static to sim in this
      // same microtask; wait one frame so their useRect instances commit
      raf = requestAnimationFrame(() => useRect.resize())
    })

    let timeoutId: ReturnType<typeof setTimeout> | undefined
    const onResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => useRect.resize(), 300)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      clearTimeout(timeoutId)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return null
}
