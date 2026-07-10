/**
 * Unit tests for renderBatched — verifies the custom-draw partition logic.
 *
 * We use a minimal canvas mock (no DOM required) so tests run in bun:test.
 */

import { describe, expect, test, mock } from 'bun:test'
import { renderBatched } from '../src/canvas/renderer'
import type { CanvasParticleData } from '../src/types'
import type { Vector2D } from '@darkroom.engineering/elastica'

// ---------------------------------------------------------------------------
// Minimal canvas 2D context mock
// ---------------------------------------------------------------------------

function makeCtxMock() {
  const calls: string[] = []

  const ctx = {
    save: mock(() => { calls.push('save') }),
    restore: mock(() => { calls.push('restore') }),
    translate: mock((_x: number, _y: number) => { calls.push('translate') }),
    rotate: mock((_a: number) => { calls.push('rotate') }),
    beginPath: mock(() => { calls.push('beginPath') }),
    rect: mock(() => { calls.push('rect') }),
    arc: mock(() => { calls.push('arc') }),
    moveTo: mock(() => {}),
    fill: mock(() => { calls.push('fill') }),
    stroke: mock(() => {}),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    calls,
  }

  return ctx as unknown as CanvasRenderingContext2D & { calls: string[] }
}

// ---------------------------------------------------------------------------
// Particle factory helpers
// ---------------------------------------------------------------------------

function rectParticle(index: number, fill = '#fff'): CanvasParticleData {
  return { index, width: 10, height: 10, shape: 'rect', fill }
}

function customParticle(
  index: number,
  drawFn: CanvasParticleData['draw']
): CanvasParticleData {
  return { index, width: 10, height: 10, shape: 'rect', fill: '#fff', draw: drawFn }
}

function positions(n: number): Vector2D[] {
  return Array.from({ length: n }, (_, i) => [i * 20, 0] as Vector2D)
}

function angles(n: number): number[] {
  return Array.from({ length: n }, () => 0)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('renderBatched — custom draw partition', () => {
  test('calls the custom draw function for particles with draw prop', () => {
    const drawFn = mock((_ctx: CanvasRenderingContext2D, _p: CanvasParticleData, _scale: number) => {})
    const particles: CanvasParticleData[] = [customParticle(0, drawFn)]
    const ctx = makeCtxMock()

    renderBatched(ctx, particles, positions(1), angles(1), 1)

    expect(drawFn).toHaveBeenCalledTimes(1)
    const [, , scale] = drawFn.mock.calls[0] as [CanvasRenderingContext2D, CanvasParticleData, number]
    expect(scale).toBe(1)
  })

  test('does NOT call draw for standard particles', () => {
    const drawFn = mock(() => {})
    const particles: CanvasParticleData[] = [
      rectParticle(0),
      customParticle(1, drawFn),
    ]
    const ctx = makeCtxMock()

    renderBatched(ctx, particles, positions(2), angles(2), 1)

    // drawFn only for the custom particle
    expect(drawFn).toHaveBeenCalledTimes(1)
  })

  test('passes dpr scale to custom draw function', () => {
    const drawFn = mock((_ctx: CanvasRenderingContext2D, _p: CanvasParticleData, _scale: number) => {})
    const particles: CanvasParticleData[] = [customParticle(0, drawFn)]
    const ctx = makeCtxMock()

    renderBatched(ctx, particles, positions(1), angles(1), 2)

    const [, , scale] = drawFn.mock.calls[0] as [CanvasRenderingContext2D, CanvasParticleData, number]
    expect(scale).toBe(2)
  })

  test('wraps custom draw in save/restore', () => {
    const drawFn = mock(() => {})
    const particles: CanvasParticleData[] = [customParticle(0, drawFn)]
    const ctx = makeCtxMock()

    renderBatched(ctx, particles, positions(1), angles(1), 1)

    const saveCount = ctx.calls.filter((c) => c === 'save').length
    const restoreCount = ctx.calls.filter((c) => c === 'restore').length
    expect(saveCount).toBeGreaterThanOrEqual(1)
    expect(restoreCount).toBe(saveCount)
  })

  test('standard particles still use batched fill path', () => {
    const particles: CanvasParticleData[] = [
      rectParticle(0, '#fff'),
      rectParticle(1, '#fff'),
    ]
    const ctx = makeCtxMock()

    renderBatched(ctx, particles, positions(2), angles(2), 1)

    // Only one beginPath + fill for the two same-key particles
    expect(ctx.beginPath).toHaveBeenCalledTimes(1)
    expect(ctx.fill).toHaveBeenCalledTimes(1)
  })

  test('two different fill colors produce two batches', () => {
    const particles: CanvasParticleData[] = [
      rectParticle(0, '#fff'),
      rectParticle(1, '#f00'),
    ]
    const ctx = makeCtxMock()

    renderBatched(ctx, particles, positions(2), angles(2), 1)

    expect(ctx.beginPath).toHaveBeenCalledTimes(2)
    expect(ctx.fill).toHaveBeenCalledTimes(2)
  })

  test('custom particle is not included in any batch', () => {
    const drawFn = mock(() => {})
    const particles: CanvasParticleData[] = [
      rectParticle(0, '#fff'),
      customParticle(1, drawFn), // same fill as above, but has draw
    ]
    const ctx = makeCtxMock()

    renderBatched(ctx, particles, positions(2), angles(2), 1)

    // Only one batch for the standard rect particle
    expect(ctx.beginPath).toHaveBeenCalledTimes(1)
    expect(ctx.fill).toHaveBeenCalledTimes(1)
    // Custom particle draw still called
    expect(drawFn).toHaveBeenCalledTimes(1)
  })

  test('handles empty particle list without throwing', () => {
    const ctx = makeCtxMock()
    expect(() => renderBatched(ctx, [], [], [], 1)).not.toThrow()
  })

  test('passes the particle data object to the draw callback', () => {
    const drawFn = mock((_ctx: CanvasRenderingContext2D, _p: CanvasParticleData, _scale: number) => {})
    const p = customParticle(0, drawFn)
    p.width = 42
    const ctx = makeCtxMock()

    renderBatched(ctx, [p], positions(1), angles(1), 1)

    const [, passedParticle] = drawFn.mock.calls[0] as [CanvasRenderingContext2D, CanvasParticleData, number]
    expect(passedParticle.width).toBe(42)
  })
})
