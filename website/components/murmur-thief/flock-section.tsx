'use client'

import { useMediaQuery, useRect } from 'hamo'
import { useEffect, useRef, useState } from 'react'
import { useScrollTrigger } from '~/hooks'
import { FLOCK_COPY, FlockPanel, type FlockPhase } from './flock-panel'
import s from './murmur-thief.module.css'

// ─── 03 — still your dom ──────────────────────────────────────────────────────
// The DOM-story copy gets its own room: it sits readable bottom-right until
// the section is mostly in view, then its words lift off and flock through
// the whole section — no other animation to compete with.

export function FlockSection() {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [fontsReady, setFontsReady] = useState(false)
  useEffect(() => {
    let cancelled = false
    document.fonts.ready.then(() => {
      if (!cancelled) setFontsReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (reducedMotion || !fontsReady) return <FlockStatic />
  return <FlockSim />
}

// ─── Static fallback (reduced motion / fonts loading) ─────────────────────────

function FlockStatic() {
  return (
    <section className={s.flockSection} aria-labelledby="flock-label">
      <p id="flock-label" className={s.flockLabel}>
        03 — still your dom
      </p>
      <p className={s.flockStatic}>{FLOCK_COPY}</p>
    </section>
  )
}

// ─── The sim: readable paragraph lifts into a flock across the section ───────

function FlockSim() {
  // one hamo rect (cached, resize-aware) feeds both triggers below
  const [setRectRef, rect] = useRect()
  const flockRef = useRef<FlockPhase>('home')

  // Lift the copy into a flock only once the section tops the viewport —
  // the paragraph gets read first, the flock is the flourish.
  useScrollTrigger({
    rect,
    start: 'top top',
    end: 'bottom top',
    onEnter: () => {
      if (flockRef.current === 'home') flockRef.current = 'flying'
    },
  })

  // When the section leaves the viewport entirely (either direction),
  // request a reset so the next pass restarts from the readable paragraph —
  // the panel performs the actual re-homing on its first engine frame back
  // (see FlockPhase).
  useScrollTrigger({
    rect,
    start: 'top bottom',
    end: 'bottom top',
    onLeave: () => {
      if (flockRef.current === 'flying') flockRef.current = 'resetPending'
    },
  })

  return (
    <section
      className={s.flockSection}
      aria-labelledby="flock-label"
      ref={setRectRef}
    >
      <p id="flock-label" className={s.flockLabel}>
        03 — still your dom
      </p>
      {/* screen-reader copy for the decorative flock */}
      <p className="sr-only">{FLOCK_COPY}</p>
      <FlockPanel flockRef={flockRef} />
    </section>
  )
}
