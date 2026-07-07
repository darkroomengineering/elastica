/**
 * Regression test for issue #5 (C2):
 * When a circle's center is inside a rectangle, the contact normal must point
 * OUTWARD through the nearest face so the resolver EXPELS the circle.
 *
 * Pre-fix bug: the centerInside branch in circleVsAABB returned a normal that
 * pointed inward (toward the center of the rect), causing the circle to oscillate
 * trapped around the rect midline instead of being pushed out.
 *
 * Post-fix contract: circle exits through the nearest face; it never tunnels
 * across to the opposite side.
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

function circleEl(diameter: number): ElementData {
  return {
    rect: { width: diameter, height: diameter },
    shape: 'circle',
  }
}

/**
 * Euler-integrate velocities into positions.
 * Static bodies are skipped — the engine resets them anyway after this callback.
 */
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

// ---------------------------------------------------------------------------
// Scenario
// Container 600×600, no borders (to avoid border effects masking the result).
// Index 0: static rectangle 200×200 centred at (300, 300) → spans x:[200,400], y:[200,400].
// Index 1: dynamic circle radius=10 centred at (220, 300).
//          • Inside the rect (220 ∈ [200,400], 300 ∈ [200,400]).
//          • Distance to LEFT face  = 220 - 200 =  20  ← nearest face.
//          • Distance to RIGHT face = 400 - 220 = 180.
//          • Distance to TOP face   = 300 - 200 = 100.
//          • Distance to BOTTOM face= 400 - 300 = 100.
//          Post-fix: normal = [-1, 0] → circle is pushed LEFT → exits at x < 200.
//          Pre-fix bug: normal = [+1, 0] → circle is pushed RIGHT → oscillates.
// ---------------------------------------------------------------------------

describe('circle center inside rect', () => {
  test('circle exits through the nearest (left) face — not trapped inside', () => {
    const container = { width: 600, height: 600 }
    const elements: ElementData[] = [
      staticEl(200, 200),   // index 0 — rect
      circleEl(20),          // index 1 — circle (radius = min(20,20)/2 = 10)
    ]

    const e = new Elastica({
      gridSize: 4,
      useOBB: true,
      borders: false,
      collisions: true,
      defaultRestitution: 0.8,
    })

    e.initialCondition(elements, container, (eng) => {
      eng.positions[0] = [300, 300]  // rect centre
      eng.positions[1] = [220, 300]  // circle centre — inside rect, nearest to left face
      eng.velocities[1] = [0, 0]    // zero initial velocity; position correction does the work
    })

    // Verify the circle IS inside the rect at start
    expect(e.positions[1]![0]).toBeGreaterThan(200)
    expect(e.positions[1]![0]).toBeLessThan(400)

    // Run 300 frames at the engine's default fixed timestep (≈16.67 ms)
    for (let frame = 0; frame < 300; frame++) {
      e.update(elements, integrate)
    }

    const cx = e.positions[1]![0]
    const cy = e.positions[1]![1]

    // Positions must always be finite
    expect(Number.isFinite(cx)).toBe(true)
    expect(Number.isFinite(cy)).toBe(true)

    // Post-fix: circle exited through the LEFT face (nearest), so its centre is
    // now west of the rect's left edge (x < 200).
    // If the bug is present the circle oscillates inside the rect and this fails.
    expect(cx).toBeLessThan(200)

    // Guard: circle must NOT have tunnelled to the right side.
    // The right face is at x=400; any x > 300 implies the wrong direction.
    expect(cx).toBeLessThan(300)
  })

  test('all state stays finite throughout 300-frame run', () => {
    const container = { width: 600, height: 600 }
    const elements: ElementData[] = [staticEl(200, 200), circleEl(20)]

    const e = new Elastica({ gridSize: 4, useOBB: true, borders: false })

    e.initialCondition(elements, container, (eng) => {
      eng.positions[0] = [300, 300]
      eng.positions[1] = [220, 300]
    })

    for (let frame = 0; frame < 300; frame++) {
      e.update(elements, integrate)

      const pos = e.positions[1]!
      const vel = e.velocities[1]!
      expect(Number.isFinite(pos[0])).toBe(true)
      expect(Number.isFinite(pos[1])).toBe(true)
      expect(Number.isFinite(vel[0])).toBe(true)
      expect(Number.isFinite(vel[1])).toBe(true)
    }
  })
})
