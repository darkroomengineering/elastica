'use client'

import { useRect } from 'hamo'
import { useLenis } from 'lenis/react'
import { useRef } from 'react'
import { useTempus } from 'tempus/react'
import s from './roller-progress.module.css'

// ─── A progress bar where "down" is scroll progress ──────────────────────────
// The wall (a tick on the track) sits at the exact scroll progress — that's
// the honest indicator. The ball treats the wall as its floor: gravity pulls
// it toward the wall, and every bounce keeps 80% of its energy — the engine's
// own restitution pitch — so it always settles back onto the wall, never
// drifts to the start. Scroll down and the floor drops away ahead of it: it
// free-falls after it and bounces out. Scroll up and the retreating wall
// carries it back.

const GRAVITY = 0.003 // px/ms² toward the wall
const RESTITUTION = 0.8
const REST_SPEED = 0.05 // px/ms — slower rebounds than this ride the wall
// impact-speed ceiling: a jump to the footer drops the ball the whole track,
// and an uncapped rebound would swing it back most of the way — same policy
// as the engine's resolver: never exploding beats physically exact
const MAX_APPROACH = 1.2 // px/ms
const WALL_WIDTH = 2 // px — matches the CSS tick
const MAX_DT = 32 // ms — tab-back frames don't teleport the ball

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function RollerProgress() {
  const wallRef = useRef<HTMLDivElement>(null)
  const ballRef = useRef<HTMLDivElement>(null)

  // lazy hamo rects: stable getters for the raf loop, resize-aware widths
  const [setTrackRectRef, getTrackRect] = useRect({ lazy: true })
  const [setBallRectRef, getBallRect] = useRect({ lazy: true })

  const progressRef = useRef(0)
  useLenis(({ scroll, limit }) => {
    progressRef.current = limit > 0 ? scroll / limit : 0
  })

  // 1D physics along the track (px)
  const ballXRef = useRef(0)
  const velRef = useRef(0)
  const prevWallXRef = useRef<number | null>(null)

  useTempus((_, deltaTime) => {
    const wall = wallRef.current
    const ball = ballRef.current
    const trackWidth = getTrackRect()?.width
    const ballWidth = getBallRect()?.width
    if (!(wall && ball && trackWidth && ballWidth)) return

    const dt = Math.min(deltaTime, MAX_DT)

    // the wall is the truth: its left edge maps scroll progress across the
    // track, leaving room for the resting ball at 0 and the tick at 1
    const wallX =
      ballWidth + progressRef.current * (trackWidth - ballWidth - WALL_WIDTH)
    const wallVel =
      prevWallXRef.current === null ? 0 : (wallX - prevWallXRef.current) / dt
    prevWallXRef.current = wallX

    // the ball rests with its right edge against the wall's left edge
    const floorX = wallX - ballWidth

    let x = ballXRef.current
    let v = velRef.current

    if (prefersReducedMotion) {
      // no bouncing: the ball just sits on the wall
      x = floorX
      v = 0
    } else {
      v += GRAVITY * dt
      x += v * dt

      // wall contact — elastic bounce in the wall's reference frame, so a
      // retreating wall (scrolling up) carries the ball instead of launching it
      if (x >= floorX) {
        x = floorX
        const approach = Math.min(v - wallVel, MAX_APPROACH)
        if (approach > 0) {
          const rebound = RESTITUTION * approach
          // spent rebounds ride the wall — no sub-pixel jitter at rest
          v = rebound < REST_SPEED ? wallVel : wallVel - rebound
        }
      }

      // the track start is a wall too
      if (x < 0) {
        x = 0
        if (v < 0) v = -RESTITUTION * v
      }
    }

    ballXRef.current = x
    velRef.current = v

    wall.style.setProperty('--x', `${wallX}px`)
    ball.style.setProperty('--x', `${x}px`)
  })

  return (
    <div className={s.track} aria-hidden="true" ref={setTrackRectRef}>
      <div ref={wallRef} className={s.wall} />
      <div
        ref={(el) => {
          ballRef.current = el
          setBallRectRef(el)
        }}
        className={s.dot}
      />
    </div>
  )
}
