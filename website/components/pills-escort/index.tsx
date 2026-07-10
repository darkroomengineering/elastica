'use client'

import {
  BoundaryBox,
  DomElastica,
  type DomElasticaRef,
  type InitialConditionParams,
  type UpdateParams,
} from '@elastica'
import cn from 'clsx'
import { useIntersectionObserver, useMediaQuery, useRect } from 'hamo'
import { useEffect, useRef, useState } from 'react'
import { useScrollTrigger } from '~/hooks'
import s from './pills-escort.module.css'

// ─── Physics constants ────────────────────────────────────────────────────────

// Pinned pills stay dynamic (the engine's DOM renderer skips `isStatic`
// bodies entirely — statics are meant to be CSS-positioned), so pinning is
// done in userland: near-infinite mass makes them immovable for the solver,
// and their position is reset to home every update.
const PINNED_MASS = 1e9
const PINNED_INERTIA = 1e12
const UNPIN_STAGGER = 80 // ms between unpins (heaviest first)

// Cruise (resting state): once released, each pill just moves forward along its
// heading at a steady speed. It never random-walks — the only thing that turns
// it is a collision (a section wall or another pill), after which it faces the
// way it now travels. No cohesion, no seek: straight run + bounce until the
// cursor calls.
const REST_SPEED = 0.1 // px/ms forward cruise at rest

// Follow (cursor inside the section): a hard mode switch, not a blend — while
// the pointer is over the section every pill drops self-drive and commits to
// the cursor; the moment it leaves, they go back to cruising. Mixing the two
// (a ramped weight) made them fight, so this is binary.
const FOLLOW_THRUST = 0.3 // px/ms cruise toward the cursor
const FOLLOW_TURN = 0.22 // fraction of the way the heading turns to the cursor each update
const FOLLOW_RECOVERY = 0.01 // velocity blend rate (collision recovery)
const FOLLOW_DEAD_ZONE = 40 // px: no seek thrust inside this radius (pills settle on the cursor)
const FOLLOW_RANGE = 200 // px: full seek thrust beyond this distance

// The engine's rigid borders clamp with unrotated half-extents, so a long
// pill steering vertically would poke out of the section and get clipped —
// clamp with the pill's true rotated footprint instead.
const WALL_DAMP = 0.7 // energy kept on a wall hit (elastic enough to keep cruising)

// Grid layout (fractions of the 1440 design viewport, resolved at runtime)
const GRID_GAP = 14 / 1440
const GRID_PAD_X = 96 / 1440
const GRID_MAX_WIDTH = 1100 / 1440
const GRID_MARGIN_TOP = 56 / 1440

const PILLS = [
  { id: 'rigid', label: '2D rigid bodies' },
  { id: 'aabb', label: 'AABB · OBB' },
  { id: 'dom', label: 'DOM mode' },
  { id: 'canvas', label: 'canvas mode', accent: true },
  { id: 'shapes', label: 'circles + rectangles' },
  { id: 'hash', label: 'spatial hashing' },
  { id: 'timestep', label: 'fixed timestep' },
  { id: 'borders', label: 'rigid / periodic borders' },
  { id: 'react', label: 'React bindings', accent: true },
  { id: 'restitution', label: 'restitution 0…1' },
  { id: 'static', label: 'static bodies' },
  { id: 'mit', label: 'MIT' },
] as const

// ─── Component ────────────────────────────────────────────────────────────────

export function PillsEscort() {
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

  // Reduced motion (or fonts still loading): the plain settled grid
  if (reducedMotion || !fontsReady) return <PillsStatic />
  return <PillsSim />
}

// ─── Static fallback (reduced motion / fonts loading) ─────────────────────────

function PillsStatic() {
  return (
    <section className={s.pills} aria-labelledby="pills-heading">
      <p className={s.sectionLabel}>01 — what it is</p>
      <h2 id="pills-heading" className={s.sectionHeading}>
        Collision as a layout tool.
      </h2>
      <p className={s.sectionStandfirst}>
        Wrap an element in a boundary box and it becomes a rigid body. The
        engine measures it, gives it mass, and lets the rest of the page find
        out.
      </p>
      <ul className={s.pillGrid}>
        {PILLS.map((pill) => (
          <li
            key={pill.id}
            className={'accent' in pill ? s.pillStaticAccent : s.pillStatic}
          >
            {pill.label}
          </li>
        ))}
      </ul>
    </section>
  )
}

// ─── The sim: pinned grid → staggered unpin → wander, attract on hover ────────

function PillsSim() {
  const simRef = useRef<DomElasticaRef>(null)
  const [setSectionRectRef, sectionRect] = useRect()
  const labelRef = useRef<HTMLParagraphElement | null>(null)
  const headingRef = useRef<HTMLHeadingElement | null>(null)
  const standfirstRef = useRef<HTMLParagraphElement | null>(null)
  const simAreaRef = useRef<HTMLDivElement | null>(null)

  // release choreography: latched by the scroll trigger, consumed in the loop
  const releasedRef = useRef(false)
  const releaseElapsedRef = useRef(0)
  const nextUnpinRef = useRef(0)
  const unpinOrderRef = useRef<number[]>([])
  // userland pinning state
  const pinnedRef = useRef<boolean[]>([])
  const homesRef = useRef<[number, number][]>([])
  const realMassesRef = useRef<number[]>([])
  // the cursor, in sim-area coordinates, and how strongly it's pulling
  const cursorRef = useRef<[number, number] | null>(null)
  const cursorInsideRef = useRef(false) // true while the cursor is over the section

  // hamo IO pauses the sim off-screen (one section simulates at a time).
  const [setIoRef] = useIntersectionObserver({
    callback: (entry) => {
      if (!entry) return
      if (entry.isIntersecting) simRef.current?.play()
      else simRef.current?.pause()
    },
  })

  // Release once the section's top passes the top of the viewport — the reader
  // has scrolled the features up to eye level, so let them loose. The hamo
  // rect (set on the section below) keeps the trigger cached and resize-aware.
  useScrollTrigger({
    rect: sectionRect,
    start: 'top top',
    end: 'bottom top',
    onEnter: () => {
      releasedRef.current = true
    },
  })

  // The leader is the cursor — tracked window-wide. Its sim-area coordinates
  // feed the seek, and whether it sits inside the section sets the attract
  // target (ramped smoothly in the update loop so entering/leaving glides).
  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      const area = simAreaRef.current
      if (!area) return
      const r = area.getBoundingClientRect()
      const x = e.clientX - r.left
      const y = e.clientY - r.top
      cursorRef.current = [x, y]
      cursorInsideRef.current =
        x >= 0 && x <= r.width && y >= 0 && y <= r.height
    }
    const release = () => {
      cursorInsideRef.current = false
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('blur', release)
    document.addEventListener('pointerleave', release)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('blur', release)
      document.removeEventListener('pointerleave', release)
    }
  }, [])

  const initialCondition = ({
    boxes,
    positions,
    velocities,
    angles,
    angularVelocities,
    masses,
    momentsOfInertia,
    restitutions,
    isStatic,
    container,
  }: InitialConditionParams) => {
    releaseElapsedRef.current = 0
    nextUnpinRef.current = 0
    pinnedRef.current = new Array(PILLS.length).fill(true)
    homesRef.current = []
    realMassesRef.current = []

    // The grid starts below the copy block (standfirst is its last line) —
    // measured, not guessed
    const areaTop = simAreaRef.current?.getBoundingClientRect().top ?? 0
    const copyBottom =
      standfirstRef.current?.getBoundingClientRect().bottom ?? 0
    const gridTop = copyBottom - areaTop + container.width * GRID_MARGIN_TOP

    // Greedy row-wrap of the measured pill boxes, left-aligned like the
    // static grid (boxes all sit at the container origin — library
    // convention — so the layout is computed here)
    const gap = container.width * GRID_GAP
    const padX = container.width * GRID_PAD_X
    const maxRow = Math.min(
      container.width * GRID_MAX_WIDTH,
      container.width - padX * 2
    )
    let x = 0
    let y = gridTop
    let rowH = 0
    boxes.forEach((box, i) => {
      // the static heading guard isn't part of the grid — skip it here
      if (isStatic[i] || !box?.rect) return
      const w = box.rect.width
      const h = box.rect.height
      if (x > 0 && x + w > maxRow) {
        x = 0
        y += rowH + gap
        rowH = 0
      }
      const home: [number, number] = [padX + x + w / 2, y + h / 2]
      positions[i] = [home[0], home[1]]
      homesRef.current[i] = home
      x += w + gap
      rowH = Math.max(rowH, h)

      velocities[i] = [0, 0]
      angles[i] = 0
      angularVelocities[i] = 0
      realMassesRef.current[i] = (w * h) / 10000 // mass ∝ area
      masses[i] = PINNED_MASS
      momentsOfInertia[i] = PINNED_INERTIA
      restitutions[i] = 0.2
    })

    // heaviest first (pills only — the guard never unpins)
    unpinOrderRef.current = boxes
      .map((_, i) => i)
      .filter((i) => !isStatic[i])
      .sort(
        (a, b) =>
          (realMassesRef.current[b] ?? 0) - (realMassesRef.current[a] ?? 0)
      )

    // Static heading guard: pin its immovable collision box over the label +
    // heading block so pills bounce off it and never crowd the copy. The engine
    // already flagged it static (from the box's data-state="static") and skips
    // rendering it — we just place its collision centre. Its box size (the
    // guard div's own rect) is what the pills actually collide against.
    const areaRect = simAreaRef.current?.getBoundingClientRect()
    const labelRect = labelRef.current?.getBoundingClientRect()
    const headRect = headingRef.current?.getBoundingClientRect()
    const standRect = standfirstRef.current?.getBoundingClientRect()
    if (areaRect && labelRect && headRect && standRect) {
      // horizontal extent comes from the heading (the label is a full-width
      // block, so its left/right would be misleading); the guarded band runs
      // from the label down through the standfirst
      const cx = (headRect.left + headRect.right) / 2 - areaRect.left
      const cy = (labelRect.top + standRect.bottom) / 2 - areaRect.top
      for (let i = 0; i < boxes.length; i++) {
        if (!isStatic[i]) continue
        positions[i] = [cx, cy]
        velocities[i] = [0, 0]
        angles[i] = 0
      }
    }
  }

  const update = ({
    positions,
    velocities,
    angles,
    angularVelocities,
    masses,
    momentsOfInertia,
    boxes,
    container,
    deltaTime,
  }: UpdateParams) => {
    // staggered unpin, heaviest first
    if (releasedRef.current && nextUnpinRef.current < PILLS.length) {
      releaseElapsedRef.current += deltaTime
      while (
        nextUnpinRef.current < PILLS.length &&
        releaseElapsedRef.current >= nextUnpinRef.current * UNPIN_STAGGER
      ) {
        const idx = unpinOrderRef.current[nextUnpinRef.current]
        if (idx !== undefined) {
          pinnedRef.current[idx] = false
          // launch it forward in a random direction — collisions do the rest
          const launch = Math.random() * Math.PI * 2
          angles[idx] = launch
          const v = velocities[idx]
          if (v) {
            v[0] = Math.cos(launch) * REST_SPEED
            v[1] = Math.sin(launch) * REST_SPEED
          }
          const box = boxes[idx]
          const m = realMassesRef.current[idx] ?? 1
          masses[idx] = m
          if (box?.rect) {
            const w = box.rect.width
            const h = box.rect.height
            momentsOfInertia[idx] = (m / 12) * (w * w + h * h)
          }
        }
        nextUnpinRef.current++
      }
    }

    // hard mode switch: cursor over the section → every pill follows; cursor
    // gone → every pill self-drives. No in-between weight, so the two never fight.
    const following = cursorInsideRef.current
    const cursor = cursorRef.current

    for (let i = 0; i < PILLS.length; i++) {
      const pos = positions[i]
      const vel = velocities[i]
      if (!(pos && vel)) continue

      // pinned: hold at home, immovable
      if (pinnedRef.current[i]) {
        const home = homesRef.current[i]
        if (home) {
          pos[0] = home[0]
          pos[1] = home[1]
        }
        vel[0] = 0
        vel[1] = 0
        angles[i] = 0
        angularVelocities[i] = 0
        continue
      }

      const blend = 1 - Math.exp(-FOLLOW_RECOVERY * deltaTime)
      if (following && cursor) {
        // FOLLOW: the cursor owns the heading — turn hard toward it and cruise
        // in, so there's no self-drive momentum left to fight
        const dx = cursor[0] - pos[0]
        const dy = cursor[1] - pos[1]
        const dist = Math.hypot(dx, dy)
        let heading = angles[i] ?? Math.atan2(dy, dx)
        let angleDiff = Math.atan2(dy, dx) - heading
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI
        heading += angleDiff * FOLLOW_TURN
        angles[i] = heading
        const seek =
          dist > FOLLOW_DEAD_ZONE ? Math.min(dist / FOLLOW_RANGE, 1) : 0
        const speed = FOLLOW_THRUST * seek
        vel[0] += (Math.cos(heading) * speed - vel[0]) * blend
        vel[1] += (Math.sin(heading) * speed - vel[1]) * blend
      } else {
        // SELF-DRIVE: run straight, face the way you travel, reorient on a
        // collision (the resolver's impulse just redirects the cruise)
        const heading =
          Math.hypot(vel[0], vel[1]) > 0.0001
            ? Math.atan2(vel[1], vel[0])
            : (angles[i] ?? 0)
        angles[i] = heading
        vel[0] += (Math.cos(heading) * REST_SPEED - vel[0]) * blend
        vel[1] += (Math.sin(heading) * REST_SPEED - vel[1]) * blend
      }

      pos[0] += vel[0] * deltaTime
      pos[1] += vel[1] * deltaTime

      // rotation-aware walls: clamp with the pill's true rotated footprint
      // (the engine's own border pass uses unrotated extents and lets steep
      // pills escape the section)
      const box = boxes[i]
      if (box?.rect) {
        const halfW = box.rect.width / 2
        const halfH = box.rect.height / 2
        const a = angles[i] ?? 0
        const cos = Math.abs(Math.cos(a))
        const sin = Math.abs(Math.sin(a))
        const extX = cos * halfW + sin * halfH
        const extY = sin * halfW + cos * halfH
        if (pos[1] > container.height - extY) {
          pos[1] = container.height - extY
          if (vel[1] > 0) vel[1] = -vel[1] * WALL_DAMP
        } else if (pos[1] < extY) {
          pos[1] = extY
          if (vel[1] < 0) vel[1] = -vel[1] * WALL_DAMP
        }
        if (pos[0] > container.width - extX) {
          pos[0] = container.width - extX
          if (vel[0] > 0) vel[0] = -vel[0] * WALL_DAMP
        } else if (pos[0] < extX) {
          pos[0] = extX
          if (vel[0] < 0) vel[0] = -vel[0] * WALL_DAMP
        }
      }
    }
  }

  return (
    <section
      className={s.pills}
      aria-labelledby="pills-heading"
      ref={(el) => {
        setSectionRectRef(el)
        setIoRef(el)
      }}
    >
      <p className={s.sectionLabel} ref={labelRef}>
        01 — what it is
      </p>
      <h2 id="pills-heading" className={s.sectionHeading} ref={headingRef}>
        Collision as a layout tool.
      </h2>
      <p className={s.sectionStandfirst} ref={standfirstRef}>
        Wrap an element in a boundary box and it becomes a rigid body. The
        engine measures it, gives it mass, and lets the rest of the page find
        out.
      </p>

      {/* real list for readers; the physics pills are presentation */}
      <ul className="sr-only">
        {PILLS.map((pill) => (
          <li key={pill.id}>{pill.label}</li>
        ))}
      </ul>

      <div className={s.simArea} ref={simAreaRef}>
        <DomElastica
          ref={simRef}
          config={{
            useOBB: true,
            collisions: true,
            borders: 'rigid',
            gridSize: 6,
          }}
          initialCondition={initialCondition}
          update={update}
        >
          <div aria-hidden="true" className={s.pillField}>
            {PILLS.map((pill) => (
              <BoundaryBox
                key={pill.id}
                className={cn(s.pillBody, 'accent' in pill && s.pillBodyAccent)}
              >
                {pill.label}
              </BoundaryBox>
            ))}
            {/* invisible static body sized to the heading block — pills bounce
                off it so they never cover the copy (positioned in the sim) */}
            <BoundaryBox className={s.headingGuard} data-state="static" />
          </div>
        </DomElastica>
      </div>
    </section>
  )
}
