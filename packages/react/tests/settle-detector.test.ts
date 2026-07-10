/**
 * Unit tests for createSettleDetector — pure helper, no React / canvas harness needed.
 */

import { describe, expect, test, mock } from 'bun:test'
import { createSettleDetector } from '../src/utils'
import type { Vector2D } from '@darkroom.engineering/elastica'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a simple velocity array with one non-static body at the given speed. */
function velOf(speed: number): [Vector2D[], boolean[]] {
  const vx = speed / Math.SQRT2
  const vy = speed / Math.SQRT2
  return [[[vx, vy]], [false]]
}

/** Build a velocity array with one static + one dynamic body. */
function velWithStatic(dynamicSpeed: number): [Vector2D[], boolean[]] {
  return [
    [[100, 100], [dynamicSpeed / Math.SQRT2, dynamicSpeed / Math.SQRT2]],
    [true, false],
  ]
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createSettleDetector', () => {
  test('does not fire before frameCount consecutive sub-threshold frames', () => {
    const cb = mock(() => {})
    const det = createSettleDetector(cb, 0.05, 10)
    const [v, s] = velOf(0.01) // below threshold

    for (let i = 0; i < 9; i++) {
      det.check(v, s)
    }
    expect(cb).toHaveBeenCalledTimes(0)
  })

  test('fires exactly once after frameCount consecutive sub-threshold frames', () => {
    const cb = mock(() => {})
    const det = createSettleDetector(cb, 0.05, 10)
    const [v, s] = velOf(0.01)

    for (let i = 0; i < 10; i++) {
      det.check(v, s)
    }
    expect(cb).toHaveBeenCalledTimes(1)
  })

  test('does not fire again while still settled', () => {
    const cb = mock(() => {})
    const det = createSettleDetector(cb, 0.05, 10)
    const [v, s] = velOf(0.01)

    for (let i = 0; i < 30; i++) {
      det.check(v, s)
    }
    expect(cb).toHaveBeenCalledTimes(1)
  })

  test('resets counter if speed spikes above threshold before frameCount', () => {
    const cb = mock(() => {})
    const det = createSettleDetector(cb, 0.05, 10)

    // 5 slow frames
    const [slow, s] = velOf(0.01)
    for (let i = 0; i < 5; i++) det.check(slow, s)

    // spike interrupts
    const [fast] = velOf(0.1)
    det.check(fast, s)

    // 10 more slow frames — counter restarted from 0
    for (let i = 0; i < 9; i++) det.check(slow, s)
    expect(cb).toHaveBeenCalledTimes(0)

    det.check(slow, s) // 10th frame from restart
    expect(cb).toHaveBeenCalledTimes(1)
  })

  test('re-arms and fires again after speed exceeds 2x threshold', () => {
    const cb = mock(() => {})
    const det = createSettleDetector(cb, 0.05, 10)

    // First settle
    const [slow, s] = velOf(0.01)
    for (let i = 0; i < 10; i++) det.check(slow, s)
    expect(cb).toHaveBeenCalledTimes(1)

    // Impulse re-arms (2× threshold = 0.1)
    const [impulse] = velOf(0.11)
    det.check(impulse, s)

    // Second settle
    for (let i = 0; i < 10; i++) det.check(slow, s)
    expect(cb).toHaveBeenCalledTimes(2)
  })

  test('does not re-arm on speed between threshold and 2x threshold', () => {
    const cb = mock(() => {})
    const det = createSettleDetector(cb, 0.05, 10)

    // First settle
    const [slow, s] = velOf(0.01)
    for (let i = 0; i < 10; i++) det.check(slow, s)
    expect(cb).toHaveBeenCalledTimes(1)

    // Speed just above threshold but below 2×  (0.08 < 0.10)
    const [mid] = velOf(0.08)
    for (let i = 0; i < 20; i++) det.check(mid, s)

    // Should NOT fire again
    expect(cb).toHaveBeenCalledTimes(1)
  })

  test('ignores static bodies when computing max speed', () => {
    const cb = mock(() => {})
    const det = createSettleDetector(cb, 0.05, 10)

    // Static body at very high speed, dynamic body at low speed
    const [v, s] = velWithStatic(0.01)

    for (let i = 0; i < 10; i++) det.check(v, s)
    expect(cb).toHaveBeenCalledTimes(1)
  })

  test('reset() clears state and allows fresh settle detection', () => {
    const cb = mock(() => {})
    const det = createSettleDetector(cb, 0.05, 10)
    const [slow, s] = velOf(0.01)

    // Settle once
    for (let i = 0; i < 10; i++) det.check(slow, s)
    expect(cb).toHaveBeenCalledTimes(1)

    // Reset then settle again — counter restarts from scratch
    det.reset()
    for (let i = 0; i < 9; i++) det.check(slow, s)
    expect(cb).toHaveBeenCalledTimes(1) // not yet

    det.check(slow, s)
    expect(cb).toHaveBeenCalledTimes(2) // fires again after fresh 10
  })

  test('handles empty velocity array without throwing', () => {
    const cb = mock(() => {})
    const det = createSettleDetector(cb, 0.05, 10)
    expect(() => det.check([], [])).not.toThrow()
  })
})
