'use client'

import {
  BoundaryBox,
  DomElastica,
  type DomElasticaRef,
  type InitialConditionParams,
  type UpdateParams,
} from '@elastica'
import cn from 'clsx'
import { useEffect, useRef, useState } from 'react'
import s from './int-rollers.module.css'

// ─── Physics constants ────────────────────────────────────────────────────────
// Pure elastic interlude: restitution 1 everywhere, no drag, no scroll kick.
// Horizontal speed is locked so the caption ticker swaps on a steady cadence.

const GRAVITY = 0.001 // px/ms² — low gravity = wide, floaty bounce arcs
const SPEED = 0.32 // px/ms — constant travel speed for every glyph
// Just under a container-width between glyphs: the next one is already
// entering left while the previous is still leaving right — a single-file
// procession with an overlapping handoff
const STAGGER = 0.85

// Each glyph keeps bouncing like a ball: on floor contact the rebound keeps
// the full impact speed (e = 1), floored at `hop` so amplitude never decays —
// hop height = hop² / (2·gravity), and each glyph crosses the screen in
// ~width·gravity / (2·speed·hop) bounces. All glyphs share one box size, so
// hops just add arc variety — every crossing takes ~4 wide arcs without
// clipping the band's ceiling. Labels stay short so the circle collision
// body hugs the text; the caption swaps in as each glyph enters the screen.
const GLYPHS = [
  {
    id: 'dom',
    label: '(dom)',
    className: 'glyphDom',
    hop: 0.62,
    caption: 'real dom nodes as rigid bodies',
  },
  {
    id: '2d',
    label: '(2d)',
    className: 'glyph2d',
    hop: 0.58,
    caption: 'two dimensions — rectangles and circles',
  },
  {
    id: '60',
    label: '(60)',
    className: 'glyphFps',
    hop: 0.55,
    caption: 'fixed 16.67 ms timestep, any refresh rate',
  },
  {
    id: '08',
    label: '(0.8)',
    className: 'glyph08',
    hop: 0.6,
    caption: 'restitution — every bounce keeps 80% of its energy',
  },
  {
    id: 'deps',
    label: '(0)',
    className: 'glyphDeps',
    hop: 0.63,
    caption: 'zero runtime dependencies',
  },
  {
    id: 'hash',
    label: '(3×3)',
    className: 'glyphHash',
    hop: 0.56,
    caption: 'spatial hashing — bodies only check their neighbors',
  },
] as const

// ─── Component ────────────────────────────────────────────────────────────────

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function IntRollers() {
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

  if (prefersReducedMotion || !fontsReady) return <RollersStatic />
  return <RollersSim />
}

// ─── Static fallback (reduced motion / fonts loading) ─────────────────────────

function RollersStatic() {
  return (
    <div className={s.band} aria-hidden="true">
      <div className={s.staticGlyphs}>
        <span className={s.staticGlyph1}>(dom)</span>
        <span className={s.staticGlyph2}>(2d)</span>
        <span className={s.staticGlyph3}>(60)</span>
        <span className={s.staticGlyph4}>(0.8)</span>
      </div>
      <div className={s.floor} />
    </div>
  )
}

// ─── The sim: glyphs file in from the left, bounce across, wrap ───────────────

function RollersSim() {
  const simRef = useRef<DomElasticaRef>(null)
  const bandRef = useRef<HTMLDivElement | null>(null)
  // caption ticker: whichever glyph last crossed the center line owns the label
  const labelRef = useRef<HTMLParagraphElement | null>(null)
  const prevXRef = useRef<number[]>([])
  const lastGlyphRef = useRef(-1)

  // Pause off-screen; the sim starting = the glyphs rolling in on entry
  useEffect(() => {
    const band = bandRef.current
    if (!band) return
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry) return
      if (entry.isIntersecting) simRef.current?.play()
      else simRef.current?.pause()
    })
    observer.observe(band)
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
    // single file off-screen left, slightly above the floor: they arrive
    // bouncing rightward, one container-width apart
    let maxR = 0
    for (const box of boxes) {
      if (!box?.rect) continue
      maxR = Math.max(maxR, Math.min(box.rect.width, box.rect.height) / 2)
    }
    boxes.forEach((box, i) => {
      if (!box?.rect) return
      const r = Math.min(box.rect.width, box.rect.height) / 2
      positions[i] = [
        // the extra 60px lead-in puts even the first glyph behind the entry
        // line, so its caption crossing fires like everyone else's
        -maxR - 60 - i * (container.width * STAGGER),
        container.height - r - 60 - Math.random() * 80,
      ]
      velocities[i] = [SPEED, 0]
      angles[i] = 0
      angularVelocities[i] = 0
    })
  }

  const update = ({
    boxes,
    positions,
    velocities,
    angles,
    container,
    deltaTime,
  }: UpdateParams) => {
    // shared exit margin: a glyph leaves the loop only once even the widest
    // one would be fully off-screen left
    let maxR = 0
    for (const box of boxes) {
      if (!box?.rect) continue
      maxR = Math.max(maxR, Math.min(box.rect.width, box.rect.height) / 2)
    }

    for (let i = 0; i < GLYPHS.length; i++) {
      const pos = positions[i]
      const vel = velocities[i]
      const box = boxes[i]
      if (!(pos && vel && box?.rect)) continue
      const r = Math.min(box.rect.width, box.rect.height) / 2

      // gravity only — horizontal speed is locked below
      vel[1] += GRAVITY * deltaTime

      // floor: every rebound launches at exactly the glyph's hop speed —
      // the forever-bouncing-ball look, with deterministic arc widths
      // (keeping the raw impact speed instead lets one energetic collision
      // grow the arcs until they slam the ceiling)
      const floorY = container.height - r
      if (pos[1] > floorY) {
        pos[1] = floorY
        if (vel[1] > 0) {
          const glyph = GLYPHS[i]
          if (glyph) vel[1] = -glyph.hop
        }
      }

      // ceiling: elastic reflect, keeps them inside the band
      if (pos[1] < r) {
        pos[1] = r
        if (vel[1] < 0) vel[1] = -vel[1]
      }

      // one direction only: left to right, always — the unconditional lock
      // means a collision can never flip a glyph into oncoming traffic
      vel[0] = SPEED

      // horizontal wrap: fully out right → rejoin the back of the line, one
      // full file-length (6 glyphs × stagger) away. Jumping any shorter
      // distance would re-enter the glyph off-phase and bunch the file.
      if (pos[0] > container.width + maxR) {
        pos[0] -= GLYPHS.length * container.width * STAGGER
      }

      // rolling without slipping: rotation follows horizontal travel
      angles[i] = (angles[i] ?? 0) + (vel[0] / r) * deltaTime

      // integrate
      pos[0] += vel[0] * deltaTime
      pos[1] += vel[1] * deltaTime

      // caption ticker: swap the band label the moment this glyph's leading
      // edge enters the screen — the title announces the incoming element.
      // A wrap teleport jumps backward, so it can never fake this forward
      // crossing.
      const enterX = -r
      const prevX = prevXRef.current[i]
      if (
        prevX !== undefined &&
        prevX < enterX &&
        pos[0] >= enterX &&
        lastGlyphRef.current !== i
      ) {
        lastGlyphRef.current = i
        const label = labelRef.current
        const caption = GLYPHS[i]?.caption
        if (label && caption) {
          label.textContent = caption
          label.animate(
            [
              { opacity: 0, transform: 'translateY(6px)' },
              { opacity: 1, transform: 'translateY(0)' },
            ],
            { duration: 350, easing: 'ease-out' },
          )
        }
      }
      prevXRef.current[i] = pos[0]
    }
  }

  return (
    <div
      className={s.band}
      aria-hidden="true"
      ref={(el) => {
        bandRef.current = el
      }}
    >
      {/* before the sim area so passing glyphs roll over it */}
      <p
        className={s.bandLabel}
        ref={(el) => {
          labelRef.current = el
        }}
      />
      <div className={s.simArea}>
        <DomElastica
          ref={simRef}
          config={{
            useOBB: true,
            collisions: true,
            borders: false,
            gridSize: 4,
            defaultRestitution: 1,
          }}
          initialCondition={initialCondition}
          update={update}
        >
          <div className={s.glyphField}>
            {GLYPHS.map((glyph) => (
              <BoundaryBox
                key={glyph.id}
                shape="circle"
                className={cn(s.glyphBody, s[glyph.className])}
              >
                {glyph.label}
              </BoundaryBox>
            ))}
          </div>
        </DomElastica>
      </div>

      <div className={s.floor} />
    </div>
  )
}
