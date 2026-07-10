'use client'

import {
  BoundaryBox,
  DomElastica,
  type DomElasticaRef,
  type InitialConditionParams,
  type UpdateParams,
} from '@elastica'
import { useEffect, useRef, useState } from 'react'
import s from './hero-drop.module.css'

// ─── Physics constants ────────────────────────────────────────────────────────

// Gravity in px/ms² — keeps the letters seated on the floor and pulls them
// back down whenever the attractor lets go of them.
const GRAVITY = 0.002

// Rigid borders reflect velocity at full energy; damp the reflected velocity
// so letters seat on the floor instead of bouncing forever.
const BOUNCE_DAMP = 0.3

// Gap between the letter boxes in the resting row.
const GAP = 8

// Initial downward velocity (px/ms): a base push plus a per-letter stagger
// so the letters land left-to-right instead of all at once.
const SPAWN_VY_BASE = 0.1
const SPAWN_VY_STEP = 0.12

// Settle detection: when the summed letter positions vary less than this
// between updates for N consecutive updates, the letters are seated —
// and the attractor ignites (latches on, never re-arms).
const SETTLE_DELTA = 1
const SETTLE_UPDATES = 30

// Attractor: a red circle at the center of the sim area that pulls the
// letters toward it with exponential falloff, plus velocity damping so
// they cluster around it instead of slingshotting past.
const ATTRACT_STRENGTH = 0.06 // px/ms² peak acceleration at the circle center
const ATTRACT_RADIUS = 600 // px falloff distance
const ATTRACT_DRAG = 0.95 // per-update linear damping while attracted
const ATTRACT_ANG_DRAG = 0.97 // per-update spin damping while attracted
// Anti-stutter: the engine's collision solver separates overlapping bodies
// with direct positional corrections — visible pops that no velocity
// damping can hide. So the cluster must never crush into the solver:
//  - the pull feathers to zero at contact distance (full strength beyond
//    rest + feather, so the grab at range stays as strong as before)
//  - letters softly repel each other before their boxes ever overlap
const ATTRACT_FEATHER = 120 // px over which the pull ramps back in
const REPEL_STRENGTH = 0.0006 // px/ms² per px of circle overlap
const SPACING_PAD = 12 // px of breathing room between letter circles
// Keep-clear gap: letters settle this far outside the attractor so the mark
// stays legible and the cluster never crowds onto it.
const MAGNET_CLEARANCE = 34 // px

// Roam: after this long attracting from the center, the circle starts
// drifting in a straight line and bouncing off the sim walls (DVD-style),
// dragging the letter cluster with it. Disabled for now: the dot stays
// static at the center.
const ROAM_ENABLED = false
const ROAM_DELAY = 2000 // ms of attracting before the roam starts
const ROAM_SPEED = 0.15 // px/ms
const CIRCLE_RADIUS = 30 // px — keep in sync with .attractor in the CSS

const LETTERS = [
  { id: 'e', char: 'E' },
  { id: 'l', char: 'L' },
  { id: 'a1', char: 'A' },
  { id: 's', char: 'S' },
  { id: 't', char: 'T' },
  { id: 'i', char: 'I' },
  { id: 'c', char: 'C' },
  { id: 'a2', char: 'A' },
] as const

// ─── Attractor mark ─────────────────────────────────────────────────────────

// The pull is radial — it grabs letters from every direction equally — so the
// mark is omnidirectional: concentric field rings around a solid core, with no
// up/down like a horseshoe would imply. Ink core + ring read against the red
// letters; a red outer ring carries the accent. Fills the attractor box;
// collision stays the bounding circle.
function AttractorMark() {
  return (
    <svg
      className={s.attractorIcon}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="24" cy="24" r="21" stroke="var(--color-red)" strokeWidth="2.5" />
      <circle cx="24" cy="24" r="13" stroke="var(--color-ink)" strokeWidth="3" />
      <circle cx="24" cy="24" r="5" fill="var(--color-ink)" />
    </svg>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

// Module-scope: evaluated once on the client; SSR renders the sim path and
// hydration keeps it (reduced-motion users get the static wordmark).
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function HeroDrop() {
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

  if (prefersReducedMotion) return <HeroStatic />
  // Engine rects must be measured with the real fonts loaded — fallback
  // metrics produce wrong letter boxes.
  if (!fontsReady) return <HeroChrome />
  return <HeroSim />
}

// ─── Shared fold chrome (baseline, tagline, meta) ────────────────────────────

function HeroChrome({ children }: { children?: React.ReactNode }) {
  return (
    <section className={s.hero} aria-label="Hero">
      <h1 className="sr-only">Elastica</h1>
      {children}
      <HeroFooter />
    </section>
  )
}

// Bottom strip of the hero: the dashed line the letters rest on, plus
// tagline and meta row — the physics floor sits at its top edge.
function HeroFooter() {
  return (
    <div className={s.heroFooter}>
      <div className={s.wordmarkBaseline} aria-hidden="true" />
      <p className={s.heroTagline}>the unserious physics engine</p>
      <div className={s.heroMeta}>
        <span className={s.heroMetaMuted}>v1.0 · MIT</span>
        <span className={s.heroMetaCenter}>scroll ↓</span>
        <span className={s.heroMetaMuted}>2d · dom · canvas</span>
      </div>
    </div>
  )
}

// ─── Static fallback (prefers-reduced-motion) ────────────────────────────────

function HeroStatic() {
  return (
    <HeroChrome>
      <div aria-hidden="true" className={s.wordmarkWrapper}>
        <span>E</span>
        <span>L</span>
        <span>A</span>
        <span>S</span>
        <span>T</span>
        <span>I</span>
        <span>C</span>
        <span>A</span>
      </div>
    </HeroChrome>
  )
}

// ─── The sim: drop, settle, then the attractor circle takes over ─────────────

interface Attractor {
  x: number
  y: number
  vx: number
  vy: number
}

function HeroSim() {
  const simRef = useRef<DomElasticaRef>(null)
  const heroRef = useRef<HTMLElement | null>(null)
  const circleRef = useRef<HTMLDivElement | null>(null)
  const prevBouncedRef = useRef<number[]>(new Array(LETTERS.length).fill(0))

  // settle detection → attractor ignition
  const settledRef = useRef(false)
  const prevSumRef = useRef(0)
  const calmUpdatesRef = useRef(0)

  // the red circle: starts at the sim center, roams after ROAM_DELAY
  const attractorRef = useRef<Attractor>({ x: 0, y: 0, vx: 0, vy: 0 })
  const attractElapsedRef = useRef(0)
  const roamingRef = useRef(false)

  // Pause the sim while the hero is off-screen (one section simulates at a time)
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry) return
      if (entry.isIntersecting) simRef.current?.play()
      else simRef.current?.pause()
    })
    observer.observe(hero)
    return () => observer.disconnect()
  }, [])

  const initialCondition = ({
    boxes,
    positions,
    velocities,
    angles,
    angularVelocities,
    container,
  }: InitialConditionParams) => {
    prevBouncedRef.current = new Array(LETTERS.length).fill(0)
    settledRef.current = false
    prevSumRef.current = 0
    calmUpdatesRef.current = 0
    attractorRef.current = {
      x: container.width / 2,
      y: container.height / 2,
      vx: 0,
      vy: 0,
    }
    attractElapsedRef.current = 0
    roamingRef.current = false

    // Boxes all sit at the container origin (library convention), so the
    // layout is computed here: each letter spawns at the top of the sim box,
    // in its resting-row x position, and drops straight down onto the floor.
    const totalWidth = boxes.reduce(
      (sum, box) => sum + (box?.rect.width ?? 0) + GAP,
      -GAP
    )
    let cursor = Math.max(0, (container.width - totalWidth) / 2)
    boxes.forEach((box, i) => {
      if (!box?.rect) return
      const halfW = box.rect.width / 2
      const halfH = box.rect.height / 2
      positions[i] = [cursor + halfW, halfH + 2]
      cursor += box.rect.width + GAP
      // first letters get the bigger push → they land left-to-right
      velocities[i] = [
        0,
        SPAWN_VY_BASE + (boxes.length - 1 - i) * SPAWN_VY_STEP,
      ]
      angles[i] = 0
      angularVelocities[i] = 0
    })
  }

  const update = ({
    boxes,
    positions,
    velocities,
    angularVelocities,
    bounced,
    container,
    deltaTime,
  }: UpdateParams) => {
    const attract = settledRef.current
    const att = attractorRef.current

    // phase progression: attract from the center, then start roaming
    if (attract && ROAM_ENABLED) {
      attractElapsedRef.current += deltaTime
      if (!roamingRef.current && attractElapsedRef.current >= ROAM_DELAY) {
        roamingRef.current = true
        // DVD kickoff: a diagonal heading with random quadrant
        const angle = (Math.PI / 180) * (25 + Math.random() * 40)
        att.vx = Math.cos(angle) * ROAM_SPEED * (Math.random() < 0.5 ? -1 : 1)
        att.vy = Math.sin(angle) * ROAM_SPEED * (Math.random() < 0.5 ? -1 : 1)
      }
    }

    // roam: straight line, reflecting off the sim walls
    if (roamingRef.current) {
      att.x += att.vx * deltaTime
      att.y += att.vy * deltaTime
      if (att.x < CIRCLE_RADIUS) {
        att.x = CIRCLE_RADIUS
        att.vx = Math.abs(att.vx)
      } else if (att.x > container.width - CIRCLE_RADIUS) {
        att.x = container.width - CIRCLE_RADIUS
        att.vx = -Math.abs(att.vx)
      }
      if (att.y < CIRCLE_RADIUS) {
        att.y = CIRCLE_RADIUS
        att.vy = Math.abs(att.vy)
      } else if (att.y > container.height - CIRCLE_RADIUS) {
        att.y = container.height - CIRCLE_RADIUS
        att.vy = -Math.abs(att.vy)
      }
    }

    // soft letter-letter spacing while clustered: force-based repulsion
    // keeps the boxes from overlapping, so the hard solver stays quiet
    if (attract) {
      for (let i = 0; i < LETTERS.length; i++) {
        const pi = positions[i]
        const vi = velocities[i]
        const bi = boxes[i]
        if (!(pi && vi && bi?.rect)) continue
        const ri = (bi.rect.width + bi.rect.height) / 4
        for (let j = i + 1; j < LETTERS.length; j++) {
          const pj = positions[j]
          const vj = velocities[j]
          const bj = boxes[j]
          if (!(pj && vj && bj?.rect)) continue
          const rj = (bj.rect.width + bj.rect.height) / 4
          const dx = pj[0] - pi[0]
          const dy = pj[1] - pi[1]
          const dist = Math.hypot(dx, dy) || 1
          const overlap = ri + rj + SPACING_PAD - dist
          if (overlap > 0) {
            const f = (REPEL_STRENGTH * overlap * deltaTime) / dist
            vi[0] -= dx * f
            vi[1] -= dy * f
            vj[0] += dx * f
            vj[1] += dy * f
          }
        }
      }
    }

    let positionSum = 0

    for (let i = 0; i < LETTERS.length; i++) {
      const pos = positions[i]
      const vel = velocities[i]
      const box = boxes[i]
      if (!(pos && vel && box?.rect)) continue

      // gravity
      vel[1] += GRAVITY * deltaTime

      if (attract) {
        const letterR = (box.rect.width + box.rect.height) / 4
        const rest = CIRCLE_RADIUS + letterR + MAGNET_CLEARANCE

        // attraction toward the circle: exponential falloff at range,
        // feathered to zero at contact so the cluster is never crushed
        const dx = att.x - pos[0]
        const dy = att.y - pos[1]
        const dist = Math.hypot(dx, dy) || 1
        const t = Math.min(1, Math.max(0, (dist - rest) / ATTRACT_FEATHER))
        const ease = t * t * (3 - 2 * t)
        const pull =
          ATTRACT_STRENGTH * Math.exp(-dist / ATTRACT_RADIUS) * ease * deltaTime
        vel[0] += (dx / dist) * pull
        vel[1] += (dy / dist) * pull
        vel[0] *= ATTRACT_DRAG
        vel[1] *= ATTRACT_DRAG
        angularVelocities[i] = (angularVelocities[i] ?? 0) * ATTRACT_ANG_DRAG

        // letters never overlap the dot: solid-circle backstop
        if (dist < rest) {
          const nx = -dx / dist
          const ny = -dy / dist
          pos[0] = att.x + nx * rest
          pos[1] = att.y + ny * rest
          const vn = vel[0] * nx + vel[1] * ny
          if (vn < 0) {
            vel[0] -= vn * nx
            vel[1] -= vn * ny
          }
        }
      }

      // damp engine border reflections so letters seat instead of bouncing
      const b = bounced[i] ?? 0
      if (b !== prevBouncedRef.current[i]) {
        prevBouncedRef.current[i] = b
        vel[0] *= BOUNCE_DAMP
        vel[1] *= BOUNCE_DAMP
      }

      // integrate
      pos[0] += vel[0] * deltaTime
      pos[1] += vel[1] * deltaTime

      positionSum += pos[0] + pos[1]
    }

    // settle detection: once the summed positions stop varying, the letters
    // are seated at the bottom → ignite the attractor (latched)
    if (!settledRef.current) {
      const calm = Math.abs(positionSum - prevSumRef.current) < SETTLE_DELTA
      calmUpdatesRef.current = calm ? calmUpdatesRef.current + 1 : 0
      if (calmUpdatesRef.current >= SETTLE_UPDATES) settledRef.current = true
    }
    prevSumRef.current = positionSum

    // render the circle (not an engine body — positioned directly)
    const circle = circleRef.current
    if (circle) {
      circle.style.transform = `translate3d(${att.x - CIRCLE_RADIUS}px, ${att.y - CIRCLE_RADIUS}px, 0)`
      circle.style.opacity = attract ? '1' : '0'
    }
  }

  return (
    <section
      className={s.hero}
      aria-label="Hero"
      ref={(el) => {
        heroRef.current = el
      }}
    >
      <h1 className="sr-only">Elastica</h1>

      {/* Sim area ends at the hero footer: the rigid floor is the dashed line */}
      <div className={s.simArea}>
        <div className={s.attractor} ref={circleRef} aria-hidden="true">
          <AttractorMark />
        </div>
        <DomElastica
          ref={simRef}
          className={s.simContainer}
          config={{
            collisions: true,
            borders: 'rigid',
            gridSize: 6,
          }}
          initialCondition={initialCondition}
          update={update}
        >
          <div aria-hidden="true" className={s.wordmarkPhysicsH1}>
            {LETTERS.map((letter) => (
              <BoundaryBox key={letter.id} className={s.letterHitbox}>
                {letter.char}
              </BoundaryBox>
            ))}
          </div>
        </DomElastica>
      </div>

      <HeroFooter />
    </section>
  )
}
