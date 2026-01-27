import type { Vector2D } from '@darkroom.engineering/elastica'
import type { CanvasParticleData, CanvasShape } from '../types'

type BatchKey = string

function getBatchKey(p: CanvasParticleData): BatchKey {
  return `${p.shape}-${p.fill}-${p.stroke ?? 'none'}-${p.strokeWidth ?? 0}`
}

/**
 * Renders particles to canvas using batched draw calls.
 *
 * Particles are grouped by visual properties (shape + fill + stroke + strokeWidth)
 * to minimize context state changes and maximize batching efficiency.
 *
 * Performance:
 * - 200 white rects = 1 draw call
 * - 100 white + 100 red = 2 draw calls
 */
export function renderBatched(
  ctx: CanvasRenderingContext2D,
  particles: CanvasParticleData[],
  positions: Vector2D[],
  angles: number[]
): void {
  if (particles.length === 0) return

  // Group particles by visual properties
  const batches = new Map<BatchKey, CanvasParticleData[]>()

  for (const particle of particles) {
    const key = getBatchKey(particle)
    const batch = batches.get(key)
    if (batch) {
      batch.push(particle)
    } else {
      batches.set(key, [particle])
    }
  }

  // Build index mapping: particle -> array position
  const indexMap = new Map<CanvasParticleData, number>()
  particles.forEach((p, i) => indexMap.set(p, i))

  // Render each batch with minimal state changes
  for (const [, batch] of batches) {
    const sample = batch[0]!
    const hasFill = sample.fill !== 'transparent' && sample.fill !== 'none'
    const hasStroke = sample.stroke !== undefined && sample.stroke !== 'transparent' && sample.stroke !== 'none'

    if (hasFill) {
      ctx.fillStyle = sample.fill
    }
    if (hasStroke) {
      ctx.strokeStyle = sample.stroke!
      ctx.lineWidth = sample.strokeWidth ?? 1
    }

    ctx.beginPath()

    for (const particle of batch) {
      // Use array position, not particle.index (which may be stale)
      const arrayIndex = indexMap.get(particle)!
      const pos = positions[arrayIndex]
      const angle = angles[arrayIndex]

      if (!pos) continue

      const x = pos[0]
      const y = pos[1]
      const halfW = particle.width / 2
      const halfH = particle.height / 2

      // Apply transform for this particle
      ctx.save()
      ctx.translate(x, y)
      if (angle && angle !== 0) {
        ctx.rotate(angle)
      }

      // Add shape to current path
      if (particle.shape === 'rect') {
        ctx.rect(-halfW, -halfH, particle.width, particle.height)
      } else if (particle.shape === 'circle') {
        // Use radius prop if provided, otherwise derive from dimensions
        const r = particle.radius ?? Math.min(particle.width, particle.height) / 2
        ctx.moveTo(r, 0)
        ctx.arc(0, 0, r, 0, Math.PI * 2)
      }

      ctx.restore()
    }

    // Single draw call for entire batch
    if (hasFill) {
      ctx.fill()
    }
    if (hasStroke) {
      ctx.stroke()
    }
  }
}

/**
 * Renders spatial hash grid for debugging.
 */
export function renderHashGrid(
  ctx: CanvasRenderingContext2D,
  gridSize: number,
  container: { width: number; height: number }
): void {
  const cellWidth = container.width / gridSize
  const cellHeight = container.height / gridSize

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
  ctx.lineWidth = 1

  ctx.beginPath()

  // Vertical lines
  for (let i = 1; i < gridSize; i++) {
    const x = i * cellWidth
    ctx.moveTo(x, 0)
    ctx.lineTo(x, container.height)
  }

  // Horizontal lines
  for (let i = 1; i < gridSize; i++) {
    const y = i * cellHeight
    ctx.moveTo(0, y)
    ctx.lineTo(container.width, y)
  }

  ctx.stroke()
}
