'use client'

import {
  BoundaryBox,
  DomElastica,
  type DomElasticaRef,
  type InitialConditionParams,
  type UpdateParams,
} from '@elastica'
import { useIntersectionObserver, useMediaQuery } from 'hamo'
import { useEffect, useRef, useState } from 'react'
import s from './murmur-thief.module.css'

// ─── Physics constants ────────────────────────────────────────────────────────

// Thief: the cursor steals small words while it moves through the paragraph
const STEAL_RADIUS = 120 // px reach around the cursor
const STEAL_MOVE_WINDOW = 300 // ms: only a moving cursor steals
const RESTEAL_COOLDOWN = 800 // ms after a word docks before it can be re-stolen

// Every stolen word flies out as several copies (like the pen's duplicate
// rings) so the plume is dense — one primary that owns the gap in the
// paragraph, plus echoes that burst out of the same spot.
const ECHOES = 2 // clones per word beyond the primary

// Trail: a snake of points eases after the cursor — the vortex rings anchor
// to points along it, so a moving cursor staggers the rings into the cone's
// envelope and an idle cursor collapses them back into concentric circles.
const TRAIL_LENGTH = 14
const TRAIL_HEAD_EASE = 0.015 // per-ms rate: head point eases to the cursor
const TRAIL_STIFFNESS = 0.036 // per-ms rate: each point follows the previous

// Vortex: a cone seen down its axis. At rest the stolen words sit on
// concentric RINGS around one center, radius growing outward. Every ring
// anchors to a trail point — the innermost (the cone's tip) rides the head
// and moves first; each larger ring anchors deeper, so motion staggers them
// into the cone's envelope. All rings rotate the same direction, inner
// faster than outer; a ring's words are evenly spaced around it, so the
// rings read as rings.
const RING_RADII = [16, 34, 52, 74, 98] // px, growing toward the rim
const RING_TRAIL_INDEX = [1, 4, 7, 10, 13] // deeper trail points lag more
const RING_ROT_SPEED = [0.0042, 0.0036, 0.003, 0.0026, 0.0022] // rad/ms
const BREATHING = 0.06 // ±6% radius wobble — small so rings stay crisp
const FLOCK_SPRING = 0.0004 // accel per px toward the orbit slot (tight)
const FLOCK_DAMP = 0.02 // velocity decay rate per ms (underdamped = lively)
const SEP_STRENGTH = 0.0005 // pairwise soft separation — dense but not stacked
const SEP_PAD = 2 // px breathing room between swirling words
const TILT_AMP = 0.18 // rad (~10°) wobble while swirling
const SCALE_INNER = 0.45 // 34px words shrink to ~15px at the cone's tip…
const SCALE_OUTER = 0.6 // …slightly larger toward the outer rings
const SCALE_EASE = 0.008 // displayScale lerp rate per ms

// Return: dwell and the words fly back to their sentences
const DWELL_RETURN = 1500 // ms of cursor stillness
const RETURN_SPRING = 0.0003
const RETURN_DAMP = 0.03 // near-critical: no overshoot at the dock
const RETURN_TILT_DECAY = 0.01 // angle decay rate on the way home
const DOCK_DIST = 2 // px: close enough to snap home
const DOCK_SPEED = 0.05 // px/ms

// ─── Copy ─────────────────────────────────────────────────────────────────────

// "never explodes" is the resolver's own guarantee (KE ceiling) — the old
// "never teleports" overclaimed; there is no CCD (COPY.md §6)
const PARAGRAPH =
  'Elastica is a 2D physics engine built not for accuracy but for feeling. Anything on your page can become a body — words, images, buttons, the footer. It collides, settles, and misbehaves at sixty frames per second. And it never, ever explodes.'

const TOKENS = PARAGRAPH.split(' ')
// small, unpunctuated, lowercase words are fair game for the thief
const STEALABLE = TOKENS.map((t) => /^[a-z]{1,4}$/.test(t))
const WORDS = TOKENS.map((t, i) => ({ token: t, tokenIndex: i })).filter(
  (_, i) => STEALABLE[i]
)
// one physics body per copy: word × (primary + echoes) ≈ the plan's ~60 bodies
const BODIES = WORDS.flatMap((word, wordIndex) =>
  Array.from({ length: 1 + ECHOES }, (_, echo) => ({ ...word, wordIndex, echo }))
)

// ring capacity grows with circumference, so word density is even across
// the cone — bigger rings hold more words
const RING_COUNTS = (() => {
  const weightSum = RING_RADII.reduce((sum, r) => sum + r, 0)
  const counts = RING_RADII.map((r) =>
    Math.max(1, Math.round((BODIES.length * r) / weightSum))
  )
  // absorb rounding drift into the outermost ring so every body has a slot
  const assigned = counts.reduce((sum, c) => sum + c, 0)
  counts[counts.length - 1] =
    (counts[counts.length - 1] ?? 1) + (BODIES.length - assigned)
  return counts
})()

type WordState = 'docked' | 'stolen' | 'returning'

// ─── Component ────────────────────────────────────────────────────────────────

export function MurmurThief() {
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

  if (reducedMotion || !fontsReady) return <MurmurStatic />
  return <MurmurSim />
}

// ─── Static fallback (reduced motion / fonts loading) ─────────────────────────

function MurmurStatic() {
  return (
    <section className={s.murmur} aria-labelledby="murmur-label">
      <p id="murmur-label" className={s.sectionLabel}>
        02 — how it feels
      </p>
      <p className={s.murmurBody}>{PARAGRAPH}</p>
    </section>
  )
}

// ─── The sim: sleeping words, a thieving cursor, a trailing plume ──────────────

function MurmurSim() {
  const simRef = useRef<DomElasticaRef>(null)
  const sectionRef = useRef<HTMLElement | null>(null)
  const simAreaRef = useRef<HTMLDivElement | null>(null)
  const fieldRef = useRef<HTMLDivElement | null>(null)
  const ringRef = useRef<HTMLDivElement | null>(null)
  const ghostRefs = useRef<(HTMLSpanElement | null)[]>([]) // per word

  // per-body choreography state
  const statesRef = useRef<WordState[]>([])
  const homesRef = useRef<[number, number][]>([])
  const coneRingRef = useRef<number[]>([]) // which ring of the cone this copy rides
  const rotSpeedRef = useRef<number[]>([])
  const angleOffsetRef = useRef<number[]>([])
  const phaseRef = useRef<number[]>([])
  const cooldownRef = useRef<number[]>([]) // per word
  const stolenCountRef = useRef(0)
  const timeRef = useRef(0)

  // the trail snake, in sim-area coordinates
  const trailRef = useRef<[number, number][]>([])

  // the thief, in sim-area coordinates
  const cursorRef = useRef<[number, number] | null>(null)
  const lastMoveRef = useRef(0)

  // Flip a body between hidden-under-the-ghost and its flying twin. Only
  // the primary copy owns the dashed gap in the paragraph. DOM writes
  // happen only at transition moments, never per frame.
  const setBodyState = (bodyIndex: number, state: WordState) => {
    statesRef.current[bodyIndex] = state
    const body = fieldRef.current?.children[bodyIndex] as
      | HTMLElement
      | undefined
    if (body) {
      if (state === 'docked') delete body.dataset.state
      else body.dataset.state = state
    }
    if (BODIES[bodyIndex]?.echo === 0) {
      const ghost = ghostRefs.current[BODIES[bodyIndex]?.wordIndex ?? -1]
      ghost?.classList.toggle(s.ghostStolen ?? '', state !== 'docked')
    }
  }

  // Everything snaps home instantly (used when the section leaves the screen)
  const dockAll = () => {
    for (let i = 0; i < BODIES.length; i++) {
      if (statesRef.current[i] !== 'docked') setBodyState(i, 'docked')
    }
    stolenCountRef.current = 0
    if (ringRef.current) ringRef.current.style.opacity = '0'
  }

  // hamo IO pauses the word sim off-screen (and docks any stolen words).
  const [setSectionIo] = useIntersectionObserver({
    callback: (entry) => {
      if (!entry) return
      if (entry.isIntersecting) {
        simRef.current?.play()
      } else {
        dockAll()
        simRef.current?.pause()
      }
    },
  })

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      const area = simAreaRef.current
      if (!area) return
      const rect = area.getBoundingClientRect()
      const point: [number, number] = [
        e.clientX - rect.left,
        e.clientY - rect.top,
      ]
      // first sighting: the whole trail starts at the cursor
      if (!cursorRef.current) {
        trailRef.current = Array.from(
          { length: TRAIL_LENGTH },
          () => [point[0], point[1]] as [number, number]
        )
      }
      cursorRef.current = point
      lastMoveRef.current = performance.now()
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    return () => window.removeEventListener('pointermove', onPointerMove)
  }, [])

  const initialCondition = ({
    boxes,
    positions,
    velocities,
    angles,
    angularVelocities,
    masses,
    displayScales,
  }: InitialConditionParams) => {
    statesRef.current = new Array(BODIES.length).fill('docked')
    cooldownRef.current = new Array(WORDS.length).fill(0)
    stolenCountRef.current = 0
    homesRef.current = []

    // deal the bodies onto the rings in shuffled order, evenly spacing each
    // ring's words around its circle — copies of the same word spread across
    // different rings instead of clustering
    const order = BODIES.map((_, i) => i)
    for (let k = order.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1))
      const a = order[k] as number
      order[k] = order[j] as number
      order[j] = a
    }
    let dealt = 0
    RING_COUNTS.forEach((count, ring) => {
      for (let slot = 0; slot < count; slot++) {
        const body = order[dealt++]
        if (body === undefined) continue
        coneRingRef.current[body] = ring
        angleOffsetRef.current[body] =
          (slot / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.3
        rotSpeedRef.current[body] =
          (RING_ROT_SPEED[ring] ?? 0.003) * (0.95 + Math.random() * 0.1)
      }
    })

    // home = the ghost word's center in the flowing paragraph, measured;
    // every copy of a word shares the same home
    const areaRect = simAreaRef.current?.getBoundingClientRect()
    boxes.forEach((_, i) => {
      const ghost = ghostRefs.current[BODIES[i]?.wordIndex ?? -1]
      let home: [number, number] = [0, 0]
      if (ghost && areaRect) {
        const g = ghost.getBoundingClientRect()
        home = [
          g.left - areaRect.left + g.width / 2,
          g.top - areaRect.top + g.height / 2,
        ]
      }
      homesRef.current[i] = home
      positions[i] = [home[0], home[1]]
      velocities[i] = [0, 0]
      angles[i] = 0
      angularVelocities[i] = 0
      masses[i] = 1
      displayScales[i] = 1

      // ring, slot angle, and rotation speed were dealt above; only the
      // per-copy breathing phase is free
      phaseRef.current[i] = Math.random() * Math.PI * 2

      // make sure any leftover DOM state from a re-init is cleared
      setBodyState(i, 'docked')
    })
  }

  const update = ({
    boxes,
    positions,
    velocities,
    angles,
    displayScales,
    deltaTime,
  }: UpdateParams) => {
    timeRef.current += deltaTime
    const t = timeRef.current
    const now = performance.now()
    const cursor = cursorRef.current
    const sinceMove = now - lastMoveRef.current
    const thiefActive = cursor !== null && sinceMove < STEAL_MOVE_WINDOW

    // the snake: head eases to the cursor, each point follows the previous
    const trail = trailRef.current
    if (cursor && trail.length === TRAIL_LENGTH) {
      const headEase = 1 - Math.exp(-TRAIL_HEAD_EASE * deltaTime)
      const head = trail[0]
      if (head) {
        head[0] += (cursor[0] - head[0]) * headEase
        head[1] += (cursor[1] - head[1]) * headEase
      }
      const stiff = 1 - Math.exp(-TRAIL_STIFFNESS * deltaTime)
      for (let k = 1; k < TRAIL_LENGTH; k++) {
        const prev = trail[k - 1]
        const curr = trail[k]
        if (!(prev && curr)) continue
        curr[0] += (prev[0] - curr[0]) * stiff
        curr[1] += (prev[1] - curr[1]) * stiff
      }
    }

    // dwell → everyone flies back to their sentence
    if (cursor && sinceMove > DWELL_RETURN && stolenCountRef.current > 0) {
      for (let i = 0; i < BODIES.length; i++) {
        if (statesRef.current[i] === 'stolen') setBodyState(i, 'returning')
      }
      stolenCountRef.current = 0
    }

    for (let i = 0; i < BODIES.length; i++) {
      const pos = positions[i]
      const vel = velocities[i]
      const home = homesRef.current[i]
      if (!(pos && vel && home)) continue
      const state = statesRef.current[i]

      if (state === 'docked') {
        pos[0] = home[0]
        pos[1] = home[1]
        vel[0] = 0
        vel[1] = 0
        angles[i] = 0
        displayScales[i] = 1

        // the primary copy watches the cursor; when it's grabbed, every
        // copy of the word bursts out of the same gap
        if (
          thiefActive &&
          cursor &&
          BODIES[i]?.echo === 0 &&
          now >= (cooldownRef.current[BODIES[i]?.wordIndex ?? 0] ?? 0)
        ) {
          const dx = home[0] - cursor[0]
          const dy = home[1] - cursor[1]
          if (dx * dx + dy * dy < STEAL_RADIUS * STEAL_RADIUS) {
            const wordIndex = BODIES[i]?.wordIndex
            for (let j = 0; j < BODIES.length; j++) {
              if (
                BODIES[j]?.wordIndex === wordIndex &&
                statesRef.current[j] === 'docked'
              ) {
                setBodyState(j, 'stolen')
                stolenCountRef.current++
              }
            }
          }
        }
        continue
      }

      if (state === 'stolen' && cursor) {
        // the copy's slot: its spot on its ring of the cone. The ring's
        // trail anchor gives the stagger — the tip ring rides the head and
        // leaves first, outer rings peel off after it, drawing the cone's
        // envelope while the cursor moves
        const ring = coneRingRef.current[i] ?? 0
        const point = trail[RING_TRAIL_INDEX[ring] ?? 1] ?? cursor
        const phase = phaseRef.current[i] ?? 0
        const angle =
          t * (rotSpeedRef.current[i] ?? 0.003) +
          (angleOffsetRef.current[i] ?? 0)
        const breathing = 1 + Math.sin(t * 0.002 + phase) * BREATHING
        const radius = (RING_RADII[ring] ?? 40) * breathing
        const targetX = point[0] + Math.cos(angle) * radius
        const targetY = point[1] + Math.sin(angle) * radius

        vel[0] += (targetX - pos[0]) * FLOCK_SPRING * deltaTime
        vel[1] += (targetY - pos[1]) * FLOCK_SPRING * deltaTime

        // separation: the plume never stacks
        for (let j = 0; j < BODIES.length; j++) {
          if (j === i || statesRef.current[j] === 'docked') continue
          const other = positions[j]
          const boxI = boxes[i]
          const boxJ = boxes[j]
          if (!(other && boxI?.rect && boxJ?.rect)) continue
          const ri =
            ((boxI.rect.width + boxI.rect.height) / 4) *
            (displayScales[i] ?? 1)
          const rj =
            ((boxJ.rect.width + boxJ.rect.height) / 4) *
            (displayScales[j] ?? 1)
          const sx = pos[0] - other[0]
          const sy = pos[1] - other[1]
          const dist = Math.hypot(sx, sy)
          const minDist = ri + rj + SEP_PAD
          if (dist > 0 && dist < minDist) {
            const push = ((minDist - dist) / minDist) * SEP_STRENGTH * deltaTime
            vel[0] += (sx / dist) * push * minDist
            vel[1] += (sy / dist) * push * minDist
          }
        }

        const damp = Math.exp(-FLOCK_DAMP * deltaTime)
        vel[0] *= damp
        vel[1] *= damp
        pos[0] += vel[0] * deltaTime
        pos[1] += vel[1] * deltaTime

        angles[i] = Math.sin(t * 0.0015 + phase) * TILT_AMP
        const ringNorm = ring / (RING_RADII.length - 1)
        const targetScale = SCALE_INNER + ringNorm * (SCALE_OUTER - SCALE_INNER)
        const scale = displayScales[i] ?? 1
        displayScales[i] =
          scale +
          (targetScale - scale) * (1 - Math.exp(-SCALE_EASE * deltaTime))
        continue
      }

      // returning: spring home, straighten, grow back, dock seamlessly
      vel[0] += (home[0] - pos[0]) * RETURN_SPRING * deltaTime
      vel[1] += (home[1] - pos[1]) * RETURN_SPRING * deltaTime
      const damp = Math.exp(-RETURN_DAMP * deltaTime)
      vel[0] *= damp
      vel[1] *= damp
      pos[0] += vel[0] * deltaTime
      pos[1] += vel[1] * deltaTime
      angles[i] = (angles[i] ?? 0) * Math.exp(-RETURN_TILT_DECAY * deltaTime)
      const scale = displayScales[i] ?? 1
      displayScales[i] =
        scale + (1 - scale) * (1 - Math.exp(-SCALE_EASE * deltaTime))

      const dx = home[0] - pos[0]
      const dy = home[1] - pos[1]
      const speed = Math.hypot(vel[0], vel[1])
      if (dx * dx + dy * dy < DOCK_DIST * DOCK_DIST && speed < DOCK_SPEED) {
        pos[0] = home[0]
        pos[1] = home[1]
        vel[0] = 0
        vel[1] = 0
        angles[i] = 0
        displayScales[i] = 1
        cooldownRef.current[BODIES[i]?.wordIndex ?? 0] = now + RESTEAL_COOLDOWN
        setBodyState(i, 'docked')
      }
    }

    // the little ring marks the thief while it holds words
    const ring = ringRef.current
    if (ring) {
      if (cursor && stolenCountRef.current > 0) {
        ring.style.transform = `translate3d(${cursor[0]}px, ${cursor[1]}px, 0) translate(-50%, -50%)`
        ring.style.opacity = '1'
      } else {
        ring.style.opacity = '0'
      }
    }
  }

  return (
    <section
      className={s.murmur}
      aria-labelledby="murmur-label"
      ref={(el) => {
        sectionRef.current = el
        setSectionIo(el)
      }}
    >
      <p id="murmur-label" className={s.sectionLabel}>
        02 — how it feels
      </p>

      {/* the real paragraph — always in the DOM, always selectable; stolen
          words just go transparent and leave a dashed gap behind */}
      <p className={s.murmurBody}>
        {TOKENS.map((token, i) => {
          if (!STEALABLE[i]) {
            // biome-ignore lint/suspicious/noArrayIndexKey: static token list
            return <span key={i}>{token} </span>
          }
          const wordIndex = WORDS.findIndex((w) => w.tokenIndex === i)
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: static token list
            <span key={i}>
              <span
                className={s.ghost}
                ref={(el) => {
                  ghostRefs.current[wordIndex] = el
                }}
              >
                {token}
              </span>{' '}
            </span>
          )
        })}
      </p>

      <div className={s.simArea} ref={simAreaRef}>
        <div className={s.thiefRing} ref={ringRef} />
        <DomElastica
          ref={simRef}
          config={{ collisions: false, borders: false, gridSize: 4 }}
          initialCondition={initialCondition}
          update={update}
        >
          <div aria-hidden="true" className={s.wordField} ref={fieldRef}>
            {BODIES.map(({ token, tokenIndex, echo }) => (
              <BoundaryBox key={`${tokenIndex}-${echo}`} className={s.wordBody}>
                {token}
              </BoundaryBox>
            ))}
          </div>
        </DomElastica>
      </div>

    </section>
  )
}
