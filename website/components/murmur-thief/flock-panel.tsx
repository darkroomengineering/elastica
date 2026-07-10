'use client'

import {
  BoundaryBox,
  DomElastica,
  type DomElasticaRef,
  type InitialConditionParams,
  type UpdateParams,
} from '@elastica'
import { useIntersectionObserver } from 'hamo'
import { type RefObject, useLayoutEffect, useRef, useState } from 'react'
import s from './murmur-thief.module.css'

// ─── Copy ───────────────────────────────────────────────────────────────────
// The DOM story (COPY.md §4.2) — the panel demonstrates its own claim: these
// words are real DOM nodes flying as bodies. Exported so the reduced-motion
// fallback can show the same text without the sim.
export const FLOCK_COPY =
  'Elastica moves elements with CSS custom properties on a single transform — no canvas, no clones. Text stays selectable. Buttons still click. Screen readers still read. Physics as a layer, not a rewrite.'

const FLOCK_WORDS = FLOCK_COPY.split(/\s+/)

// Lifecycle of the flock, owned by the section's scroll watcher and consumed
// by the sim's update loop. Three phases (not a boolean) because the engine
// pauses off-screen: 'resetPending' survives the pause, so the first frame
// back re-homes the words before the section can re-launch them.
//   home ──(section tops viewport)──▶ flying ──(section fully out)──▶
//   resetPending ──(first engine frame)──▶ home
export type FlockPhase = 'home' | 'flying' | 'resetPending'

// ─── Vicsek flock params — example-4's prod defaults, verbatim ────────────────
// Tight radius + low smoothed noise + strong thrust is what makes the demo
// read as a murmuration: local sub-flocks form, split, and rejoin.
const FLOCK_CONFIG = {
  useOBB: true,
  collisions: true,
  borders: 'periodic',
  gridSize: 5,
} as const
const THRUST = 0.4 // px/ms self-propulsion cruise
const NOISE = 0.025 // Vicsek angular noise strength
const NOISE_SMOOTHING = 0.05 // low-pass filter on the noise
const INTERACTION_RADIUS = 60 // px — local alignment only
const STEERING_RECOVERY = 0.01 // velocity blend rate (keeps collision impulses)
const WARMUP_SPEED = 0.01 // per-ms ramp from readable rest into full flock

type TextPos = { x: number; y: number }

// ─── Panel ────────────────────────────────────────────────────────────────────
// A bottom-right demo: the copy sits as a readable paragraph until the section
// top passes the top of the viewport (flockRef flips), then its words lift off
// and flock (Vicsek alignment) around the panel.
export function FlockPanel({ flockRef }: { flockRef: RefObject<FlockPhase> }) {
  const simRef = useRef<DomElasticaRef>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const measureRef = useRef<HTMLParagraphElement | null>(null)

  const warmupRef = useRef(0)
  const initAnglesRef = useRef(false)
  const smoothedNoiseRef = useRef<number[]>([])

  // measured word centers, in panel coordinates — the words' readable home
  const [measured, setMeasured] = useState<TextPos[]>([])

  // hamo: pause the flock while the panel is off-screen
  const [setIoRef] = useIntersectionObserver({
    callback: (entry) => {
      if (!entry) return
      if (entry.isIntersecting) simRef.current?.play()
      else simRef.current?.pause()
    },
  })

  // Measure each word's center once, in panel coordinates. Gating the sim on a
  // populated measurement (below) means the bodies are always placed at their
  // readable spots on the engine's first init — no dependence on effect order.
  useLayoutEffect(() => {
    const panel = panelRef.current
    const measure = measureRef.current
    if (!(panel && measure)) return
    const base = panel.getBoundingClientRect()
    const spans = measure.querySelectorAll('span')
    setMeasured(
      Array.from(spans).map((span) => {
        const r = span.getBoundingClientRect()
        return {
          x: r.left - base.left + r.width / 2,
          y: r.top - base.top + r.height / 2,
        }
      })
    )
  }, [])

  const initialCondition = ({
    positions,
    velocities,
    angles,
    angularVelocities,
  }: InitialConditionParams) => {
    measured.forEach((p, i) => {
      positions[i] = [p.x, p.y]
      velocities[i] = [0, 0]
      angles[i] = 0
      angularVelocities[i] = 0
    })
  }

  const update = ({
    positions,
    velocities,
    angles,
    deltaTime,
    hash,
    gridSize,
  }: UpdateParams) => {
    // held as readable copy until the scroll trigger fires
    if (flockRef.current !== 'flying') {
      // the section scrolled fully out mid-flight: put every word back on
      // its readable spot and re-arm the ramp, so the next pass reads the
      // paragraph first and lifts off fresh
      if (flockRef.current === 'resetPending') {
        warmupRef.current = 0
        initAnglesRef.current = false
        smoothedNoiseRef.current = []
        measured.forEach((p, i) => {
          positions[i] = [p.x, p.y]
          velocities[i] = [0, 0]
          angles[i] = 0
        })
        flockRef.current = 'home'
      }
      return
    }

    // ramp the whole flock up over ~1s so it lifts off, never snaps
    warmupRef.current = Math.min(1, warmupRef.current + WARMUP_SPEED * deltaTime)
    const warmup = warmupRef.current * warmupRef.current

    // break the perfectly-aligned rest symmetry on the first flocking frame
    if (!initAnglesRef.current) {
      initAnglesRef.current = true
      for (let i = 0; i < angles.length; i++) {
        angles[i] = (Math.random() - 0.5) * 0.01
      }
    }

    // Vicsek: θᵢ(t+1) = ⟨θⱼ⟩neighbors + η — averaged heading of neighbors + noise
    const nextAngles = angles.map((current, i) => {
      if (current === undefined) return 0
      const targetNoise = (Math.random() - 0.5) * 2 * NOISE
      const prevNoise = smoothedNoiseRef.current[i] ?? 0
      const noise = prevNoise + (targetNoise - prevNoise) * NOISE_SMOOTHING
      smoothedNoiseRef.current[i] = noise

      const neighbors = neighborsInRadius(
        i,
        positions,
        hash,
        gridSize,
        INTERACTION_RADIUS
      )
      let vicsek: number
      if (neighbors.length === 0) {
        vicsek = current + noise
      } else {
        // circular mean (avoids the 0/2π discontinuity)
        let sumSin = Math.sin(current)
        let sumCos = Math.cos(current)
        for (const j of neighbors) {
          const na = angles[j]
          if (na !== undefined) {
            sumSin += Math.sin(na)
            sumCos += Math.cos(na)
          }
        }
        vicsek = Math.atan2(sumSin, sumCos) + noise
      }
      return current + (vicsek - current) * warmup
    })

    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i]
      const angle = nextAngles[i]
      if (!pos || angle === undefined) continue
      angles[i] = angle

      // steering as a force: blend velocity toward the cruise velocity so the
      // resolver's collision impulses persist and boids visibly bounce apart
      const vel = velocities[i] ?? [0, 0]
      const desiredVx = Math.cos(angle) * THRUST * warmup
      const desiredVy = Math.sin(angle) * THRUST * warmup
      const blend = 1 - Math.exp(-STEERING_RECOVERY * deltaTime)
      const vx = vel[0] + (desiredVx - vel[0]) * blend
      const vy = vel[1] + (desiredVy - vel[1]) * blend
      velocities[i] = [vx, vy]
      positions[i] = [pos[0] + vx * deltaTime, pos[1] + vy * deltaTime]
    }
  }

  return (
    <div
      className={s.flockPanel}
      aria-hidden="true"
      ref={(el) => {
        panelRef.current = el
        setIoRef(el)
      }}
    >
      {/* hidden metrics layer: the words are measured here, then the physics
          twins take over at the same spots */}
      <p className={s.flockMeasure} ref={measureRef}>
        {FLOCK_WORDS.map((word, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static word list
          <span key={i}>{word} </span>
        ))}
      </p>

      {measured.length > 0 && (
        <DomElastica
          ref={simRef}
          className={s.flockSim}
          config={FLOCK_CONFIG}
          initialCondition={initialCondition}
          update={update}
        >
          <div className={s.flockField}>
            {FLOCK_WORDS.map((word, i) => (
              <BoundaryBox
                // biome-ignore lint/suspicious/noArrayIndexKey: static word list
                key={i}
                className={s.flockWord}
              >
                {word}
              </BoundaryBox>
            ))}
          </div>
        </DomElastica>
      )}
    </div>
  )
}

// ─── Spatial-hash neighborhood (example-4) ────────────────────────────────────
function isNeighbor(hashA: number, hashB: number, gridSize: number): boolean {
  for (let i = -1; i < 2; i++) {
    for (let j = -1; j < 2; j++) {
      const box = hashA + gridSize * i + j
      if (box < 0 || box > gridSize * gridSize) continue
      if (box === hashB) return true
    }
  }
  return false
}

function neighborsInRadius(
  index: number,
  positions: [number, number][],
  hash: number[],
  gridSize: number,
  radius: number
): number[] {
  const neighbors: number[] = []
  const position = positions[index]
  const myHash = hash[index]
  if (!position || myHash === undefined) return neighbors

  const radiusSquared = radius * radius
  for (let i = 0; i < positions.length; i++) {
    if (i === index) continue
    const otherHash = hash[i]
    if (otherHash === undefined) continue
    if (!isNeighbor(myHash, otherHash, gridSize)) continue
    const other = positions[i]
    if (!other) continue
    const dx = other[0] - position[0]
    const dy = other[1] - position[1]
    if (dx * dx + dy * dy < radiusSquared) neighbors.push(i)
  }
  return neighbors
}
