'use client'

import {
  CanvasBox,
  CanvasElastica,
  type CanvasElasticaRef,
  type InitialConditionParams,
  type UpdateParams,
} from '@elastica'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

// ---------------------------------------------------------------------------
// Constants — a field of eyes watching the ELASTICA block drift DVD-style
// (example-1 motion: constant velocity, engine rigid borders bounce it).
// The block plows through the field; eyes part, watch it pass, re-knit.
// ---------------------------------------------------------------------------

// Field composition
const TOP_BAND = 76 // clear strip for the top chrome text (homes only)
const BOTTOM_BAND = 76 // clear strip for the bottom chrome text (homes only)
const SPACING_X = 2.06 // × radius — neighbors overlap along the lozenge axis (shingle)
const SPACING_Y = 1.78 // × radius — hex row pitch
const REMOVED_EYES = 100 // random gaps punched into the full grid
const HOME_JITTER = 5 // px of home-position noise
const WAVE_AMP = 0.35 // × radius — shared row undulation (breaks the ruler lines)
const WAVE_FREQ = 0.0052 // rad/px — ~1200px wavelength
const RED_PUPILS = 0.15 // fraction of eyes with the accent pupil
const ANGLE_JITTER = 0.2 // rad — per-eye offset from the field angle
// Sprite-only size variance: collision radii stay uniform so the packing
// physics never fights itself; only the drawn leaf varies
const SIZE_SCALES = [0.85, 1, 1.15] as const
const SCATTER = 80 // spawn offset — the field knits itself on first view

// DVD block (example-1 pattern: the engine's rigid borders do the bouncing)
const BLOCK_SPEED = 1.5 // px/frame — renormalized so collisions never slow it
const BLOCK_MASS = 1e9 // eyes can't deflect it
const BLOCK_INERTIA = 1e15 // …or spin it

// Physics (per-frame convention, matching example-6: pos += vel each frame)
const SPRING = 0.018 // pull back to the home grid — the field heals itself
// The spring lets go when the block occupies an eye's home — otherwise it
// grinds the eye against the block flank all the way through the pass
const SPRING_FADE_R = 60 // px of home→block distance over which it re-engages
const DRAG = 0.9
const SPEED_CAP = 26 // headroom for the startle blast (drag reins it in fast)
const BORE_RADIUS = 180
const BORE_FORCE = 2.2
const BREATH = 0.02
// Wide anticipatory cushion: eyes are eased aside well before hard contact,
// so the OBB solver almost never has to snap them (that snap was the chunk)
const VOID_MARGIN = 100
const VOID_FORCE = 0.5 // peak radial push at the surface (squared falloff)
const SLIDE_FORCE = 0.5 // tangential slip — eyes streamline around the capsule
// Startle — click or scroll scatters the field radially AWAY from the
// block (every pupil points at it, so the dispersal reads as the eyes
// fleeing the thing they're watching); the home springs re-knit after
const STARTLE_CLICK = 42
const STARTLE_WHEEL = 0.15 // × |deltaY| (clamped) per wheel tick
const STARTLE_DECAY = 420 // px — eyes near the block blast, far eyes nudge
const SHAKE_SCALE = 0.18
const PARTICLE_RESTITUTION = 0.35 // mushy contacts pack smoother
const BLOCK_RESTITUTION = 1 // perfect wall bounce, DVD-style

// Orientation field — eyes wrap the block tangentially, relaxing to
// horizontal rows with distance (iron filings around a magnet)
const FIELD_R = 240 // px over which the wrap decays to rows
const ANGLE_LERP = 0.09

// Leaf sprite geometry (× collision radius). The leaf is much longer than
// its collision circle, so combed neighbors shingle like scales; the ink
// keyline keeps each eye legible through the overlap (poster imbrication).
const LEAF_RX = 1.45 // half-length along the flow
const LEAF_RY = 0.82 // half-height
// Googly pupil: drawn per frame, aimed at the block, sliding inside the
// sclera on an elliptical travel that matches the leaf shape
const PUPIL_R = 0.3
const PUPIL_TRAVEL_X = 0.55
const PUPIL_TRAVEL_Y = 0.28

// Canvas needs literal colors — these mirror lib/styles/css/root.css
const BODY_COLOR = '#F2EFE9' // --color-field
const PUPIL_INK = '#16140F' // --color-ink
const PUPIL_RED = '#E30613' // --color-red

// ---------------------------------------------------------------------------
// SDF of the block — a capsule (rounded rect, corner radius = half height)
// so the field wraps an organic contour, not machine corners. Distance +
// outward normal in a shared scratch (single sim instance; avoids a
// per-particle allocation every frame).
// ---------------------------------------------------------------------------

interface VoidRect {
  cx: number
  cy: number
  hx: number
  hy: number
  rad: number // corner radius (= min(hx, hy) for a full capsule)
}

const field = { d: 0, nx: 0, ny: 0 }

function measureField(x: number, y: number, rect: VoidRect) {
  const dx = x - rect.cx
  const dy = y - rect.cy
  // rounded SDF: measure against the radius-shrunken box, subtract rad
  const qx = Math.abs(dx) - (rect.hx - rect.rad)
  const qy = Math.abs(dy) - (rect.hy - rect.rad)
  const ox = Math.max(qx, 0)
  const oy = Math.max(qy, 0)
  const outside = Math.hypot(ox, oy)
  field.d = outside + Math.min(Math.max(qx, qy), 0) - rect.rad
  if (outside > 0.0001) {
    field.nx = (ox * Math.sign(dx)) / outside
    field.ny = (oy * Math.sign(dy)) / outside
  } else if (qx > qy) {
    // deep inside — push along the closest face
    field.nx = Math.sign(dx) || 1
    field.ny = 0
  } else {
    field.nx = 0
    field.ny = Math.sign(dy) || 1
  }
}

/**
 * Desired eye orientation at SDF distance d with outward normal (nx, ny):
 * the tangent of the SDF isoline near the block (wrapping the contour),
 * blending to horizontal rows as d grows.
 */
function fieldAngle(d: number, nx: number, ny: number): number {
  let tx = -ny
  let ty = nx
  // keep the flow left→right so neighboring rows comb the same way
  if (tx < 0) {
    tx = -tx
    ty = -ty
  }
  const t = Math.min(1, Math.max(0, 1 - d / FIELD_R))
  const bx = tx * t + (1 - t)
  const by = ty * t
  return Math.atan2(by, bx)
}

// ---------------------------------------------------------------------------
// Sprite factory — leaf body + keyline only; the pupil is dynamic (it
// tracks the block), so it's drawn per frame on top of the cached sprite
// ---------------------------------------------------------------------------

function paintLeaf(ctx: CanvasRenderingContext2D, r: number) {
  const rx = r * LEAF_RX
  const ry = r * LEAF_RY
  // Almond/leaf: two quadratics meeting at pointed tips
  ctx.beginPath()
  ctx.moveTo(-rx, 0)
  ctx.quadraticCurveTo(0, -2 * ry, rx, 0)
  ctx.quadraticCurveTo(0, 2 * ry, -rx, 0)
  ctx.closePath()
  ctx.fillStyle = BODY_COLOR
  ctx.fill()
  // Ink keyline — reads as the gap between shingled neighbors
  ctx.lineWidth = Math.max(2, r * 0.08)
  ctx.strokeStyle = PUPIL_INK
  ctx.stroke()
}

const spriteCache = new Map<number, HTMLCanvasElement>()

function getSprite(r: number): HTMLCanvasElement {
  const cached = spriteCache.get(r)
  if (cached) return cached

  const scale = 2
  const rx = r * LEAF_RX
  const ry = r * LEAF_RY
  const w = Math.ceil(rx * 2 * scale) + 8
  const h = Math.ceil(ry * 2 * scale) + 8
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.save()
  ctx.scale(scale, scale)
  ctx.translate(w / (2 * scale), h / (2 * scale))
  paintLeaf(ctx, r)
  ctx.restore()

  spriteCache.set(r, canvas)
  return canvas
}

type DrawFn = (
  ctx: CanvasRenderingContext2D,
  particle: { width: number; height: number; radius?: number },
  scale: number
) => void

// ---------------------------------------------------------------------------
// Field layout — measured once on mount from the footer + wordmark rects
// ---------------------------------------------------------------------------

interface Eye {
  id: string
  home: [number, number]
  pupil: string
  /** Drawn leaf size (px) — collision radius stays uniform */
  spriteR: number
  angleJitter: number
  draw: DrawFn
}

interface FieldLayout {
  radius: number
  rect: VoidRect
  /** Block spawn center — DOM transform deltas are relative to this */
  origin: [number, number]
  eyes: Eye[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface FooterClutchProps {
  footerRef: React.RefObject<HTMLElement | null>
  rectRef: React.RefObject<HTMLDivElement | null>
}

export function FooterClutch({ footerRef, rectRef }: FooterClutchProps) {
  const simRef = useRef<CanvasElasticaRef>(null)
  const pointerRef = useRef({ x: -9999, y: -9999 })
  const pendingStartleRef = useRef(0)
  const shakeRef = useRef({ lastX: 0, lastY: 0, initialized: false })
  const motionRef = useRef({ lastAx: 0, lastAy: 0, initialized: false })

  // Live engine arrays for the pupil gaze — refreshed every update tick
  const arraysRef = useRef<{
    positions: InitialConditionParams['positions']
    angles: number[]
  } | null>(null)

  const [layout, setLayout] = useState<FieldLayout | null>(null)
  const layoutRef = useRef<FieldLayout | null>(null)
  layoutRef.current = layout

  // Measure once and build the packed home grid: hex rows across the FULL
  // footer (the block travels, so no region is carved out permanently —
  // eyes part around it wherever it is and re-knit behind it).
  useLayoutEffect(() => {
    const footer = footerRef.current
    const rectEl = rectRef.current
    if (!(footer && rectEl)) return

    const fb = footer.getBoundingClientRect()
    const rb = rectEl.getBoundingClientRect()
    const W = fb.width
    const H = fb.height

    const radius = Math.round(Math.min(30, Math.max(14, W * 0.021)))
    const hxHalf = rb.width / 2
    const hyHalf = rb.height / 2
    const cx = rb.left - fb.left + hxHalf
    const cy = rb.top - fb.top + hyHalf
    const rect: VoidRect = {
      cx,
      cy,
      hx: hxHalf,
      hy: hyHalf,
      rad: Math.min(hxHalf, hyHalf), // full capsule
    }

    const sx = radius * SPACING_X
    const sy = radius * SPACING_Y
    // Shared undulation: every row rides the same wave so vertical pitch
    // (and therefore the collision packing) is preserved
    const wavePhase = Math.random() * Math.PI * 2
    const homes: [number, number][] = []
    let row = 0
    for (let y = TOP_BAND + radius; y <= H - BOTTOM_BAND - radius; y += sy) {
      for (let x = radius + (row % 2) * (sx / 2); x <= W - radius; x += sx) {
        const wave = Math.sin(x * WAVE_FREQ + wavePhase) * WAVE_AMP * radius
        const hx = Math.min(
          W - radius,
          Math.max(radius, x + (Math.random() - 0.5) * HOME_JITTER * 2)
        )
        const hy = Math.min(
          H - radius,
          Math.max(radius, y + wave + (Math.random() - 0.5) * HOME_JITTER * 2)
        )
        homes.push([hx, hy])
      }
      row++
    }

    // Punch random gaps: drop homes BEFORE building eyes so every draw
    // closure captures its final body index
    for (let n = 0; n < REMOVED_EYES && homes.length > 1; n++) {
      homes.splice(Math.floor(Math.random() * homes.length), 1)
    }

    const eyes: Eye[] = homes.map((home, i) => {
      const scale =
        SIZE_SCALES[Math.floor(Math.random() * SIZE_SCALES.length)] ?? 1
      const spriteR = Math.round(radius * scale)
      const pupil = Math.random() < RED_PUPILS ? PUPIL_RED : PUPIL_INK
      const bodyIndex = i + 1 // index 0 is the block

      // Googly draw: cached leaf + a live pupil aimed at the block center.
      // ctx arrives translated + rotated to the body, so the world gaze is
      // rotated into local space before the offset is applied.
      const draw: DrawFn = (ctx) => {
        const sprite = getSprite(spriteR)
        const w = sprite.width / 2
        const h = sprite.height / 2
        ctx.drawImage(sprite, -w / 2, -h / 2, w, h)

        let px = 0
        let py = 0
        const arrs = arraysRef.current
        const pos = arrs?.positions[bodyIndex]
        const block = arrs?.positions[0]
        if (arrs && pos && block) {
          let gx = block[0] - pos[0]
          let gy = block[1] - pos[1]
          const gd = Math.hypot(gx, gy)
          if (gd > 1) {
            gx /= gd
            gy /= gd
            const a = -(arrs.angles[bodyIndex] ?? 0)
            const cos = Math.cos(a)
            const sin = Math.sin(a)
            px = (gx * cos - gy * sin) * spriteR * PUPIL_TRAVEL_X
            py = (gx * sin + gy * cos) * spriteR * PUPIL_TRAVEL_Y
          }
        }
        ctx.beginPath()
        ctx.arc(px, py, spriteR * PUPIL_R, 0, Math.PI * 2)
        ctx.fillStyle = pupil
        ctx.fill()
      }

      return {
        id: `eye-${i}`,
        home,
        pupil,
        spriteR,
        angleJitter: (Math.random() - 0.5) * ANGLE_JITTER,
        draw,
      }
    })

    setLayout({ radius, rect, origin: [cx, cy], eyes })
  }, [footerRef, rectRef])

  // -------------------------------------------------------------------------
  // initialCondition
  // -------------------------------------------------------------------------
  const initialCondition = ({
    positions,
    velocities,
    angles,
    masses,
    momentsOfInertia,
    restitutions,
    isStatic,
  }: InitialConditionParams) => {
    const l = layoutRef.current
    if (!l) return

    arraysRef.current = { positions, angles }

    // Index 0 — the DVD block: constant-speed diagonal, engine borders
    // bounce it (example-1 motion). Effectively immovable to the eyes.
    isStatic[0] = false
    positions[0] = [l.origin[0], l.origin[1]]
    const heading = 0.3 + Math.random() * 0.4 // ~17–40° off horizontal
    velocities[0] = [
      Math.cos(heading) * BLOCK_SPEED * (Math.random() < 0.5 ? -1 : 1),
      Math.sin(heading) * BLOCK_SPEED * (Math.random() < 0.5 ? -1 : 1),
    ]
    angles[0] = 0
    masses[0] = BLOCK_MASS
    momentsOfInertia[0] = BLOCK_INERTIA
    restitutions[0] = BLOCK_RESTITUTION

    for (let i = 1; i <= l.eyes.length; i++) {
      const eye = l.eyes[i - 1]
      if (!eye) continue
      // Scatter around home so the field visibly knits itself together on
      // first view; anything landing inside the block is pushed to its rim
      let x = eye.home[0] + (Math.random() - 0.5) * SCATTER * 2
      let y = eye.home[1] + (Math.random() - 0.5) * SCATTER * 2
      measureField(x, y, l.rect)
      if (field.d < l.radius + 4) {
        const push = l.radius + 4 - field.d
        x += field.nx * push
        y += field.ny * push
      }
      positions[i] = [x, y]
      velocities[i] = [0, 0]
      measureField(eye.home[0], eye.home[1], l.rect)
      angles[i] = fieldAngle(field.d, field.nx, field.ny) + eye.angleJitter
    }
  }

  // -------------------------------------------------------------------------
  // update callback
  // -------------------------------------------------------------------------
  const update = ({
    positions,
    velocities,
    angles,
    angularVelocities,
    isStatic,
  }: UpdateParams) => {
    const l = layoutRef.current
    if (!l) return

    arraysRef.current = { positions, angles }

    const { rect, eyes } = l

    // ── The block: DVD motion ────────────────────────────────────────────
    // Renormalize speed (grazing eye contacts bleed a hair of velocity),
    // keep it from spinning, integrate; the engine's rigid borders reflect
    // it off the footer walls after this callback.
    const bp = positions[0]
    const bv = velocities[0]
    if (bp && bv) {
      const spd = Math.hypot(bv[0], bv[1])
      if (spd > 0.01) {
        const k = BLOCK_SPEED / spd
        bv[0] *= k
        bv[1] *= k
      }
      angles[0] = 0
      angularVelocities[0] = 0
      bp[0] += bv[0]
      bp[1] += bv[1]

      // The SDF field follows the block
      rect.cx = bp[0]
      rect.cy = bp[1]

      // Sync the DOM wordmark to the physics body
      const rectEl = rectRef.current
      if (rectEl) {
        rectEl.style.transform = `translate(${bp[0] - l.origin[0]}px, ${bp[1] - l.origin[1]}px)`
      }
    }

    const ptr = pointerRef.current
    const startle = pendingStartleRef.current
    pendingStartleRef.current = 0

    // Window shake
    const shake = shakeRef.current
    const sx = window.screenX
    const sy = window.screenY
    let sdx = 0
    let sdy = 0
    if (!shake.initialized) {
      shake.initialized = true
    } else {
      sdx = Math.max(-60, Math.min(60, sx - shake.lastX))
      sdy = Math.max(-60, Math.min(60, sy - shake.lastY))
    }
    shake.lastX = sx
    shake.lastY = sy

    // devicemotion
    const motion = motionRef.current
    let mdx = 0
    let mdy = 0
    if (motion.initialized) {
      mdx = motion.lastAx
      mdy = motion.lastAy
      motion.lastAx = 0
      motion.lastAy = 0
    }

    for (let i = 1; i <= eyes.length; i++) {
      if (isStatic[i]) continue
      const pos = positions[i]
      const vel = velocities[i]
      const eye = eyes[i - 1]
      if (!(pos && vel && eye)) continue

      const x = pos[0]
      const y = pos[1]

      // 1. Home spring — the field re-knits behind the block. Faded out
      // while the block occupies the home so the eye waits nearby instead
      // of grinding against the block's flank for the whole pass.
      measureField(eye.home[0], eye.home[1], rect)
      let springScale = Math.max(0, Math.min(1, field.d / SPRING_FADE_R))
      springScale *= springScale
      vel[0] += (eye.home[0] - x) * SPRING * springScale
      vel[1] += (eye.home[1] - y) * SPRING * springScale

      // 2. Cursor bore
      const cdx = x - ptr.x
      const cdy = y - ptr.y
      const cd = Math.hypot(cdx, cdy)
      if (cd < BORE_RADIUS && cd > 0.01) {
        const f = BORE_FORCE * (1 - cd / BORE_RADIUS)
        vel[0] += (cdx / cd) * f
        vel[1] += (cdy / cd) * f
      }

      // 3. Block bow wave + orientation field (one SDF evaluation per eye)
      measureField(x, y, rect)
      const d = field.d
      const nx = field.nx
      const ny = field.ny
      if (d < VOID_MARGIN) {
        const w = (1 - Math.max(0, d) / VOID_MARGIN) ** 2
        vel[0] += nx * VOID_FORCE * w
        vel[1] += ny * VOID_FORCE * w
        // Tangential slip for eyes AHEAD of the block: they streamline
        // around the capsule toward its rear instead of being bulldozed
        if (bv && nx * bv[0] + ny * bv[1] > 0) {
          let tx = -ny
          let ty = nx
          if (tx * bv[0] + ty * bv[1] > 0) {
            tx = -tx
            ty = -ty
          }
          vel[0] += tx * SLIDE_FORCE * w
          vel[1] += ty * SLIDE_FORCE * w
        }
      }

      // 4. Breath
      vel[0] += (Math.random() - 0.5) * BREATH
      vel[1] += (Math.random() - 0.5) * BREATH

      // 5. Drag
      vel[0] *= DRAG
      vel[1] *= DRAG

      // 6. Speed cap
      const sp = Math.hypot(vel[0], vel[1])
      if (sp > SPEED_CAP) {
        const inv = SPEED_CAP / sp
        vel[0] *= inv
        vel[1] *= inv
      }

      // 7. Integrate (matches example-6 pattern: pos += vel * 1)
      pos[0] += vel[0]
      pos[1] += vel[1]

      // 8. Startle (click / scroll) — disperse radially away from the
      // block: every pupil points at it, so the field flees the thing
      // it's watching, in all directions at once
      if (startle > 0 && bp) {
        const rdx = x - bp[0]
        const rdy = y - bp[1]
        const rd = Math.hypot(rdx, rdy) || 1
        const f = startle * Math.exp(-rd / STARTLE_DECAY)
        vel[0] += (rdx / rd) * f
        vel[1] += (rdy / rd) * f
      }

      // 10. Window shake
      if (sdx !== 0 || sdy !== 0) {
        vel[0] -= sdx * SHAKE_SCALE * (0.7 + Math.random() * 0.6)
        vel[1] -= sdy * SHAKE_SCALE * (0.7 + Math.random() * 0.6)
      }

      // 11. devicemotion
      if (mdx !== 0 || mdy !== 0) {
        vel[0] -= mdx * SHAKE_SCALE * (0.7 + Math.random() * 0.6)
        vel[1] -= mdy * SHAKE_SCALE * (0.7 + Math.random() * 0.6)
      }

      // 12. Comb along the orientation field — displaced eyes re-align as
      // they flow back, wrapping the passing block, settling into rows
      const desired = fieldAngle(d, nx, ny) + eye.angleJitter
      const curAngle = angles[i] ?? 0
      let delta = desired - curAngle
      delta = ((delta + Math.PI * 3) % (Math.PI * 2)) - Math.PI
      angles[i] = curAngle + delta * ANGLE_LERP
    }
  }

  // -------------------------------------------------------------------------
  // Event listeners
  // -------------------------------------------------------------------------
  useEffect(() => {
    const footer = footerRef.current
    if (!footer) return

    const onPointerMove = (e: PointerEvent) => {
      const b = footer.getBoundingClientRect()
      pointerRef.current = { x: e.clientX - b.left, y: e.clientY - b.top }
    }
    const onPointerLeave = () => {
      pointerRef.current = { x: -9999, y: -9999 }
    }
    const onPointerDown = () => {
      pendingStartleRef.current += STARTLE_CLICK
    }
    const onWheel = (e: WheelEvent) => {
      // NEVER preventDefault — Lenis owns scroll
      pendingStartleRef.current +=
        Math.min(100, Math.abs(e.deltaY)) * STARTLE_WHEEL
    }

    footer.addEventListener('pointermove', onPointerMove)
    footer.addEventListener('pointerleave', onPointerLeave)
    footer.addEventListener('pointerdown', onPointerDown)
    footer.addEventListener('wheel', onWheel, { passive: true })

    return () => {
      footer.removeEventListener('pointermove', onPointerMove)
      footer.removeEventListener('pointerleave', onPointerLeave)
      footer.removeEventListener('pointerdown', onPointerDown)
      footer.removeEventListener('wheel', onWheel)
    }
  }, [footerRef])

  // devicemotion — best-effort, no iOS permission prompt
  useEffect(() => {
    const onMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity
      if (!acc) return
      const m = motionRef.current
      m.initialized = true
      m.lastAx += (acc.x ?? 0) * 0.5
      m.lastAy += (acc.y ?? 0) * 0.5
    }
    window.addEventListener('devicemotion', onMotion)
    return () => window.removeEventListener('devicemotion', onMotion)
  }, [])

  // IntersectionObserver — pause when off-screen
  useEffect(() => {
    const footer = footerRef.current
    if (!footer) return

    let hasEntered = false
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        if (entry.isIntersecting) {
          hasEntered = true
          simRef.current?.play()
        } else if (hasEntered) {
          simRef.current?.pause()
        }
      },
      { threshold: 0 }
    )

    observer.observe(footer)
    return () => observer.disconnect()
  }, [footerRef])

  // -------------------------------------------------------------------------
  // Render — don't mount until the field layout is measured
  // -------------------------------------------------------------------------
  const dpr =
    typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1

  if (!layout || layout.eyes.length === 0) return null

  return (
    <CanvasElastica
      ref={simRef}
      config={{
        collisions: true,
        borders: 'rigid' as const,
        // gridSize ~2× radius across container width; 12 cells works well
        gridSize: 12,
        defaultRestitution: PARTICLE_RESTITUTION,
        solver: {
          slop: 0,
          percent: 0.8,
          fixedDeltaTime: 12,
        },
      }}
      initialCondition={initialCondition}
      update={update}
      dpr={dpr}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        width: '100%',
        height: '100%',
      }}
    >
      {/* Index 0 — the DVD block: hard body the eyes bounce off. Invisible
          on canvas; the DOM wordmark is synced to it every frame */}
      <CanvasBox
        width={layout.rect.hx * 2}
        height={layout.rect.hy * 2}
        shape="rect"
        fill="transparent"
        restitution={BLOCK_RESTITUTION}
      />

      {/* Indices 1…N — the eye field (uniform collision, varied sprites) */}
      {layout.eyes.map((eye) => (
        <CanvasBox
          key={eye.id}
          radius={layout.radius}
          shape="circle"
          fill={BODY_COLOR}
          restitution={PARTICLE_RESTITUTION}
          draw={eye.draw}
        />
      ))}
    </CanvasElastica>
  )
}
