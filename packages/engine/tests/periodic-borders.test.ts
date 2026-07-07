/**
 * Regression tests for the periodic border wrap behavior.
 *
 * Locks in the post-fix contract for `borders: 'periodic'`:
 *   - A body wraps ONLY after it has FULLY exited the container.
 *     The trailing edge must be past the boundary by the rotation-safe
 *     maxExtent margin (sqrt(halfW² + halfH²) for rectangles).
 *   - After wrapping, the body re-enters fully OUTSIDE the opposite edge
 *     (positioned at -margin on the entry side) so it glides into view.
 *   - Static bodies are never wrapped regardless of position.
 *
 * Old bug: the body teleported the moment its leading edge touched the
 * boundary, while still fully visible.
 *
 * Container: 800×600
 * Body: 100×40 → halfWidth=50, halfHeight=20
 *       maxExtent = sqrt(50²+20²) = sqrt(2900) ≈ 53.85
 *
 * Effective container bounds (containerOffsets all zero):
 *   right boundary = container.width * (0 + 1) = 800
 *   left boundary  = container.width * 0        = 0
 *   bottom boundary = container.height * (0 + 1) = 600
 *   top boundary    = container.height * 0        = 0
 */

import { describe, expect, test } from 'bun:test'
import Elastica from '../src/index'
import type { ElementData } from '../src/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function staticEl(width: number, height: number): ElementData {
  return {
    element: { dataset: { state: 'static' } } as unknown as HTMLElement,
    rect: { width, height },
  }
}

function dynamicEl(width: number, height: number): ElementData {
  return { rect: { width, height } }
}

function integrate(e: Elastica): void {
  const dt = e.fixedDeltaTime
  for (let i = 0; i < e.positions.length; i++) {
    if (e.isStatic[i]) continue
    const pos = e.positions[i]
    const vel = e.velocities[i]
    if (pos && vel) {
      pos[0] += vel[0] * dt
      pos[1] += vel[1] * dt
    }
  }
}

const CONTAINER = { width: 800, height: 600 }
const BODY_RECT = { width: 100, height: 40 }

// ---------------------------------------------------------------------------
// Test 1: Right edge — body stays visible until fully off the right edge
// ---------------------------------------------------------------------------

describe('periodic borders: right edge wrap', () => {
  /**
   * Body centre starts at (700, 300), moving right at vx=0.2 px/ms.
   * fixedDeltaTime default = 16.67 ms → dx ≈ 3.334 px per frame.
   *
   * maxExtent ≈ 53.85. Wrap trigger: position[0] > 800 + 53.85 ≈ 853.85.
   * From x=700: (~153.85 / 3.334) ≈ 46 frames before wrap triggers.
   *
   * Old bug: wrap fired when leading edge (centre + halfWidth = x + 50)
   * hit x=800, i.e., centre ≈ 750 — while 50 px of body was still visible.
   *
   * Post-fix contract:
   *   1. Centre x increases monotonically until the wrap — no premature
   *      teleport while any part of the body is still on-screen.
   *   2. Wrap only after centre x > 800 + maxExtent (trailing edge fully past
   *      the right boundary including the rotation-safe margin).
   *   3. Re-entry position ≤ 0 - maxExtent + ε: body placed fully outside
   *      the left edge so it glides into view, not pops.
   *   4. After re-entry, x increases again (body slides right into view).
   */

  test('body stays visible until fully off the right edge', () => {
    const elements: ElementData[] = [dynamicEl(BODY_RECT.width, BODY_RECT.height)]

    const e = new Elastica({
      useOBB: true,
      borders: 'periodic',
      collisions: false,
      gridSize: 4,
    })

    e.initialCondition(elements, CONTAINER, (eng) => {
      eng.positions[0] = [700, 300]
      eng.velocities[0] = [0.2, 0]
    })

    const maxExtent = e.maxExtents[0]!
    const frames: number[] = []

    for (let frame = 0; frame < 60; frame++) {
      e.update(elements, integrate)
      frames.push(e.positions[0]![0])
    }

    // Detect the wrap: first frame where x decreases (teleport to the left)
    let wrapFrame = -1
    for (let i = 1; i < frames.length; i++) {
      if (frames[i]! < frames[i - 1]!) {
        wrapFrame = i
        break
      }
    }

    // Wrap must happen within the 60-frame budget
    expect(wrapFrame).toBeGreaterThan(-1)

    // Before wrap: x is strictly increasing — no premature teleport to the left side
    for (let i = 1; i < wrapFrame; i++) {
      expect(frames[i]).toBeGreaterThan(frames[i - 1]!)
    }

    // Re-entry: body is placed fully outside the left edge (≤ -maxExtent)
    const reentryX = frames[wrapFrame]!
    expect(reentryX).toBeLessThanOrEqual(-maxExtent + 0.01)

    // After re-entry: x increases — body glides into view from the left
    if (wrapFrame + 1 < frames.length) {
      expect(frames[wrapFrame + 1]).toBeGreaterThan(reentryX)
    }
  })
})

// ---------------------------------------------------------------------------
// Test 2: Left edge — symmetric wrap (mirror of test 1)
// ---------------------------------------------------------------------------

describe('periodic borders: left edge wrap', () => {
  /**
   * Body centre starts at (100, 300), moving left at vx=-0.2 px/ms.
   *
   * Wrap trigger: position[0] < 0 - maxExtent = -53.85.
   * From x=100: (~153.85 / 3.334) ≈ 46 frames before wrap triggers.
   *
   * Post-fix contract (mirrored):
   *   1. Centre x decreases monotonically until the wrap — no premature
   *      teleport to the right while any part of the body is still on-screen.
   *   2. Wrap only after centre x < 0 - maxExtent (trailing edge past left).
   *   3. Re-entry position ≥ 800 + maxExtent - ε: placed fully outside
   *      the right edge so it glides in from the right.
   *   4. After re-entry, x decreases (body slides left into view).
   */

  test('wrap works on the left edge symmetric', () => {
    const elements: ElementData[] = [dynamicEl(BODY_RECT.width, BODY_RECT.height)]

    const e = new Elastica({
      useOBB: true,
      borders: 'periodic',
      collisions: false,
      gridSize: 4,
    })

    e.initialCondition(elements, CONTAINER, (eng) => {
      eng.positions[0] = [100, 300]
      eng.velocities[0] = [-0.2, 0]
    })

    const maxExtent = e.maxExtents[0]!
    const frames: number[] = []

    for (let frame = 0; frame < 60; frame++) {
      e.update(elements, integrate)
      frames.push(e.positions[0]![0])
    }

    // Detect the wrap: first frame where x jumps right (teleport from near
    // -maxExtent to 800+maxExtent)
    let wrapFrame = -1
    for (let i = 1; i < frames.length; i++) {
      if (frames[i]! > frames[i - 1]!) {
        wrapFrame = i
        break
      }
    }

    // Wrap must happen within the 60-frame budget
    expect(wrapFrame).toBeGreaterThan(-1)

    // Before wrap: x is strictly decreasing — no premature teleport to the right
    for (let i = 1; i < wrapFrame; i++) {
      expect(frames[i]).toBeLessThan(frames[i - 1]!)
    }

    // Re-entry: body is placed fully outside the right edge (≥ 800 + maxExtent)
    const reentryX = frames[wrapFrame]!
    expect(reentryX).toBeGreaterThanOrEqual(800 + maxExtent - 0.01)

    // After re-entry: x decreases — body glides into view from the right
    if (wrapFrame + 1 < frames.length) {
      expect(frames[wrapFrame + 1]).toBeLessThan(reentryX)
    }
  })
})

// ---------------------------------------------------------------------------
// Test 3: Vertical wrap — bottom exit
// ---------------------------------------------------------------------------

describe('periodic borders: bottom edge wrap', () => {
  /**
   * Body centre starts at (400, 500), moving down at vy=0.2 px/ms.
   *
   * Wrap trigger: position[1] > 600 + maxExtent = 653.85.
   * From y=500: (~153.85 / 3.334) ≈ 46 frames before wrap triggers.
   *
   * Post-fix contract:
   *   1. Centre y increases monotonically until the wrap — no premature
   *      teleport while any part of the body is still on-screen.
   *   2. Wrap only after centre y > 600 + maxExtent.
   *   3. Re-entry position ≤ 0 - maxExtent + ε: placed fully above the
   *      top edge so it glides down into view.
   *   4. After re-entry, y increases (body moves down into view from top).
   */

  test('vertical wrap (bottom exit)', () => {
    const elements: ElementData[] = [dynamicEl(BODY_RECT.width, BODY_RECT.height)]

    const e = new Elastica({
      useOBB: true,
      borders: 'periodic',
      collisions: false,
      gridSize: 4,
    })

    e.initialCondition(elements, CONTAINER, (eng) => {
      eng.positions[0] = [400, 500]
      eng.velocities[0] = [0, 0.2]
    })

    const maxExtent = e.maxExtents[0]!
    const frames: number[] = []

    for (let frame = 0; frame < 60; frame++) {
      e.update(elements, integrate)
      frames.push(e.positions[0]![1]) // track y
    }

    // Detect the wrap: first frame where y decreases (teleport to above top edge)
    let wrapFrame = -1
    for (let i = 1; i < frames.length; i++) {
      if (frames[i]! < frames[i - 1]!) {
        wrapFrame = i
        break
      }
    }

    // Wrap must happen within the 60-frame budget
    expect(wrapFrame).toBeGreaterThan(-1)

    // Before wrap: y is strictly increasing — no premature teleport to the top
    for (let i = 1; i < wrapFrame; i++) {
      expect(frames[i]).toBeGreaterThan(frames[i - 1]!)
    }

    // Re-entry: body is placed fully outside the top edge (≤ -maxExtent)
    const reentryY = frames[wrapFrame]!
    expect(reentryY).toBeLessThanOrEqual(-maxExtent + 0.01)

    // After re-entry: y increases — body glides down into view from the top
    if (wrapFrame + 1 < frames.length) {
      expect(frames[wrapFrame + 1]).toBeGreaterThan(reentryY)
    }
  })
})

// ---------------------------------------------------------------------------
// Test 4: Static bodies never wrap
// ---------------------------------------------------------------------------

describe('periodic borders: static bodies never wrap', () => {
  /**
   * A static body near the right edge (centre x=790, y=300) must never be
   * wrapped by the periodic border handler.
   *
   * Two engine-level mechanisms enforce this:
   *   a. handlePeriodicBorders checks `isStatic[index]` and skips the body.
   *   b. The update loop resets every static body's position back to its
   *      cached staticPositions entry after each user callback.
   *
   * If either guard were removed, a bug that gave the static body non-zero
   * velocity (or if the border handler ignored the isStatic flag) would cause
   * the position to drift or teleport. This test locks in both guards.
   *
   * After 100 frames the position must be exactly the initialised value.
   */

  test('static bodies never wrap', () => {
    const elements: ElementData[] = [staticEl(BODY_RECT.width, BODY_RECT.height)]

    const e = new Elastica({
      useOBB: true,
      borders: 'periodic',
      collisions: false,
      gridSize: 4,
    })

    e.initialCondition(elements, CONTAINER, (eng) => {
      eng.positions[0] = [790, 300]
    })

    const initialX = e.positions[0]![0]
    const initialY = e.positions[0]![1]

    for (let frame = 0; frame < 100; frame++) {
      e.update(elements, integrate)
    }

    // Position must be exactly unchanged — static bodies are never wrapped
    expect(e.positions[0]![0]).toBe(initialX)
    expect(e.positions[0]![1]).toBe(initialY)
  })
})
