/**
 * Resolver rework specs — issue #7.
 *
 * ALL THREE describe blocks are SKIPPED (describe.skip).
 * They will be unskipped commit-by-commit as the resolver is rewritten.
 *
 * These tests specify the PHYSICS CONTRACT the new resolver must satisfy.
 * They do not constrain implementation details (impulse formulation, warm-starting,
 * etc.) — only the observable outcomes enumerated below.
 *
 * Assertions use physical invariants:
 *   • Momentum conservation (|Δp| < ε) — verifiable without knowing internal state.
 *   • Velocity ratio equals mass ratio (from p = mv).
 *   • Exit speed proportional to entry speed (linear response, coefficient = e).
 */

import { describe, expect, test } from 'bun:test'
import Elastica from '../src/index'
import type { ElementData } from '../src/types'

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

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

function linearKE(e: Elastica, index: number): number {
  const vel = e.velocities[index]
  const mass = e.masses[index] ?? 1
  if (!vel) return 0
  return 0.5 * mass * (vel[0] ** 2 + vel[1] ** 2)
}

function totalLinearMomentum(e: Elastica): [number, number] {
  let px = 0
  let py = 0
  for (let i = 0; i < e.velocities.length; i++) {
    const vel = e.velocities[i]
    const mass = e.masses[i] ?? 1
    if (vel) {
      px += mass * vel[0]
      py += mass * vel[1]
    }
  }
  return [px, py]
}

// ---------------------------------------------------------------------------
// 1. Mass-weighted impulse split
// ---------------------------------------------------------------------------

describe('mass-weighted impulse split', () => {
  /**
   * Physical law: in a 1-D elastic/inelastic collision, the impulse J is shared
   * inversely proportional to mass.  A light body (m=1) receives 3× the velocity
   * change of a heavy body (m=3) because J = m·Δv.
   *
   * Current resolver ignores mass: it applies the same repulsion to both bodies,
   * violating momentum conservation whenever masses differ.
   */

  test('total linear momentum is conserved (|Δp| < 1e-6 normalised)', () => {
    const container = { width: 600, height: 600 }
    const elements: ElementData[] = [
      dynamicEl(20, 20),  // light  — index 0, mass will be set to 1
      dynamicEl(20, 20),  // heavy  — index 1, mass will be set to 3
    ]

    const e = new Elastica({
      gridSize: 4,
      useOBB: true,
      borders: false,
      collisions: true,
      defaultRestitution: 0.8,
    })

    e.initialCondition(elements, container, (eng) => {
      eng.positions[0] = [270, 300]  // left body
      eng.positions[1] = [330, 300]  // right body — 20px gap, will close fast
      eng.velocities[0] = [0.2, 0]  // approaching
      eng.velocities[1] = [-0.2, 0]
    })

    // Set masses AFTER initialCondition (setMass recalculates moment of inertia)
    e.setMass(0, 1)
    e.setMass(1, 3)

    const [px0, py0] = totalLinearMomentum(e)

    // Run until collision and a few frames after
    for (let frame = 0; frame < 30; frame++) {
      e.update(elements, integrate)
    }

    const [px1, py1] = totalLinearMomentum(e)
    const totalMagnitude = Math.abs(px0) + Math.abs(py0) + 1  // +1 avoids div-by-zero

    // Momentum conserved to 1e-6 (normalised)
    expect(Math.abs(px1 - px0) / totalMagnitude).toBeLessThan(1e-6)
    expect(Math.abs(py1 - py0) / totalMagnitude).toBeLessThan(1e-6)
  })

  test('velocity change of light body is ≈ 3× velocity change of heavy body', () => {
    const container = { width: 600, height: 600 }
    const elements: ElementData[] = [dynamicEl(20, 20), dynamicEl(20, 20)]

    const e = new Elastica({
      gridSize: 4,
      useOBB: true,
      borders: false,
      collisions: true,
      defaultRestitution: 0.8,
    })

    e.initialCondition(elements, container, (eng) => {
      eng.positions[0] = [270, 300]
      eng.positions[1] = [330, 300]
      eng.velocities[0] = [0.2, 0]
      eng.velocities[1] = [-0.2, 0]
    })

    e.setMass(0, 1)  // light
    e.setMass(1, 3)  // heavy

    const vx0Before = e.velocities[0]![0]
    const vx1Before = e.velocities[1]![0]

    // Step until collision fires (first sign change in approach velocity)
    let collisionFrame = -1
    for (let frame = 0; frame < 30; frame++) {
      e.update(elements, integrate)
      if (collisionFrame === -1 && e.collisionsList.length > 0) {
        collisionFrame = frame
        break
      }
    }

    const dvLight = Math.abs(e.velocities[0]![0] - vx0Before)  // Δv of mass-1 body
    const dvHeavy = Math.abs(e.velocities[1]![0] - vx1Before)  // Δv of mass-3 body

    expect(dvLight).toBeGreaterThan(0)
    expect(dvHeavy).toBeGreaterThan(0)

    // From p = m·Δv: 1·dvLight = 3·dvHeavy → dvLight/dvHeavy ≈ 3
    const ratio = dvLight / dvHeavy
    expect(ratio).toBeGreaterThan(2.7)  // within 10% of 3
    expect(ratio).toBeLessThan(3.3)
  })
})

// ---------------------------------------------------------------------------
// 2. Approach-velocity gate: no vibration at resting contact
// ---------------------------------------------------------------------------

describe('approach-velocity gate: resting contact does not harvest energy', () => {
  /**
   * When two bodies overlap but have ZERO relative velocity (resting contact),
   * the resolver must NOT inject kinetic energy. The current resolver applies
   * a repulsion impulse proportional to penetration depth regardless of
   * approach speed, causing the bodies to vibrate indefinitely ("jitter").
   *
   * Post-fix contract:
   *   • If |v_rel · n̂| ≤ ε (bodies not approaching), skip the velocity impulse.
   *   • Positional correction (slop/percent) may still drain overlap.
   *   • After 100 frames, max |v| across all bodies stays below a small threshold.
   */

  test('zero-relative-velocity contact: kinetic energy stays near 0 after 100 frames', () => {
    const container = { width: 600, height: 600 }
    const elements: ElementData[] = [dynamicEl(20, 20), dynamicEl(20, 20)]

    const e = new Elastica({
      gridSize: 4,
      useOBB: true,
      borders: false,
      collisions: true,
      defaultRestitution: 0.8,
    })

    e.initialCondition(elements, container, (eng) => {
      // Slightly overlapping (12 px gap < 10+10 = 20 px half-sum)
      eng.positions[0] = [294, 300]
      eng.positions[1] = [306, 300]
      // Both at rest — zero relative velocity
      eng.velocities[0] = [0, 0]
      eng.velocities[1] = [0, 0]
    })

    for (let frame = 0; frame < 100; frame++) {
      e.update(elements, integrate)
    }

    const totalKE = linearKE(e, 0) + linearKE(e, 1)

    // Post-fix: KE stays near 0 (positional correction drains overlap, no
    // spurious velocity injected).  Bug: KE grows each frame as resolver
    // injects impulse at each tick.
    expect(totalKE).toBeLessThan(1e-4)

    // Velocities must be tiny
    const maxSpeed = Math.max(
      Math.hypot(e.velocities[0]![0], e.velocities[0]![1]),
      Math.hypot(e.velocities[1]![0], e.velocities[1]![1])
    )
    expect(maxSpeed).toBeLessThan(0.01)
  })
})

// ---------------------------------------------------------------------------
// 3. Kick proportional to approach speed (linear response)
// ---------------------------------------------------------------------------

describe('kick proportional to approach speed: exit speed ≈ e × entry speed', () => {
  /**
   * For a perfectly symmetric head-on collision between equal masses with
   * coefficient of restitution e, the relative exit speed should equal e times
   * the relative entry speed.
   *
   * Current resolver applies a fixed repulsion strength = 1/max(penetration,1),
   * which is NOT proportional to approach speed. Doubling the approach speed
   * does not double the exit speed → non-linear, energy-leaking response.
   *
   * Post-fix contract:
   *   exit_v_rel ≈ e × entry_v_rel  (within ±5%)
   *   linear response: (exit_v_rel at 2× entry) / (exit_v_rel at 1× entry) ≈ 2
   */

  function runCollision(entrySpeed: number): { entryVRel: number; exitVRel: number } {
    const container = { width: 600, height: 600 }
    const elements: ElementData[] = [dynamicEl(20, 20), dynamicEl(20, 20)]

    const e = new Elastica({
      gridSize: 4,
      useOBB: true,
      borders: false,
      collisions: true,
      defaultRestitution: 0.8,
    })

    e.initialCondition(elements, container, (eng) => {
      // Start bodies 22 px apart (just touching / barely overlapping)
      eng.positions[0] = [289, 300]
      eng.positions[1] = [311, 300]
      eng.velocities[0] = [entrySpeed, 0]
      eng.velocities[1] = [-entrySpeed, 0]
    })

    // entry_v_rel = relative approach speed along x (positive = approaching)
    const entryVRel = e.velocities[0]![0] - e.velocities[1]![0]  // = 2 * entrySpeed

    // Run until collision resolves
    for (let frame = 0; frame < 20; frame++) {
      e.update(elements, integrate)
      if (e.velocities[0]![0] < 0 && e.velocities[1]![0] > 0) break // separated
    }

    // exit_v_rel = relative speed after collision (now separating → negative)
    const exitVRel = -(e.velocities[0]![0] - e.velocities[1]![0])  // positive when separating

    return { entryVRel, exitVRel }
  }

  test('exit relative speed ≈ e × entry relative speed (within ±5%) at low entry speed', () => {
    const e_coeff = 0.8
    const { entryVRel, exitVRel } = runCollision(0.2)  // entry approach = 0.4 px/ms

    expect(exitVRel).toBeGreaterThan(0)   // bodies separated
    // Within 5% of e × entryVRel
    const expected = e_coeff * entryVRel
    expect(Math.abs(exitVRel - expected) / expected).toBeLessThan(0.05)
  })

  test('exit relative speed ≈ e × entry relative speed (within ±5%) at double entry speed', () => {
    const e_coeff = 0.8
    const { entryVRel, exitVRel } = runCollision(0.4)  // entry approach = 0.8 px/ms

    expect(exitVRel).toBeGreaterThan(0)
    const expected = e_coeff * entryVRel
    expect(Math.abs(exitVRel - expected) / expected).toBeLessThan(0.05)
  })

  test('doubling entry speed doubles exit speed (linear response)', () => {
    const { exitVRel: exitLow }  = runCollision(0.2)  // slow run
    const { exitVRel: exitHigh } = runCollision(0.4)  // fast run (2×)

    expect(exitLow).toBeGreaterThan(0)
    expect(exitHigh).toBeGreaterThan(0)

    const responseRatio = exitHigh / exitLow
    // Should be ≈ 2 (linear response) — allow 10% tolerance for float drift
    expect(responseRatio).toBeGreaterThan(1.8)
    expect(responseRatio).toBeLessThan(2.2)
  })
})
