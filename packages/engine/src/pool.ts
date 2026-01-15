import type { Vector2D } from './types'

/**
 * Simple object pool for Vector2D arrays to reduce GC pressure in hot paths.
 *
 * USAGE:
 *   const vec = vectorPool.acquire()   // Get a [0, 0] vector
 *   vec[0] = x; vec[1] = y             // Use it
 *   vectorPool.release(vec)            // Return it when done
 *
 * IMPORTANT: Only use for temporary calculations within a single function.
 * Do not store pooled vectors in state - they will be reused!
 */
class VectorPool {
  private pool: Vector2D[] = []
  private maxSize: number

  constructor(initialSize = 64, maxSize = 256) {
    this.maxSize = maxSize
    // Pre-allocate initial vectors
    for (let i = 0; i < initialSize; i++) {
      this.pool.push([0, 0])
    }
  }

  /**
   * Get a vector from the pool (or create a new one if empty)
   * Vector is reset to [0, 0]
   */
  acquire(): Vector2D {
    if (this.pool.length > 0) {
      const vec = this.pool.pop()!
      vec[0] = 0
      vec[1] = 0
      return vec
    }
    return [0, 0]
  }

  /**
   * Return a vector to the pool for reuse
   */
  release(vec: Vector2D): void {
    if (this.pool.length < this.maxSize) {
      this.pool.push(vec)
    }
    // If pool is full, let GC collect it
  }

  /**
   * Get current pool size (for debugging)
   */
  get size(): number {
    return this.pool.length
  }
}

/**
 * Pool for 4-corner arrays used in OBB collision detection
 */
class CornersPool {
  private pool: [Vector2D, Vector2D, Vector2D, Vector2D][] = []
  private maxSize: number

  constructor(initialSize = 32, maxSize = 128) {
    this.maxSize = maxSize
    for (let i = 0; i < initialSize; i++) {
      this.pool.push([[0, 0], [0, 0], [0, 0], [0, 0]])
    }
  }

  acquire(): [Vector2D, Vector2D, Vector2D, Vector2D] {
    if (this.pool.length > 0) {
      const corners = this.pool.pop()!
      // Reset all corners
      for (let i = 0; i < 4; i++) {
        corners[i]![0] = 0
        corners[i]![1] = 0
      }
      return corners
    }
    return [[0, 0], [0, 0], [0, 0], [0, 0]]
  }

  release(corners: [Vector2D, Vector2D, Vector2D, Vector2D]): void {
    if (this.pool.length < this.maxSize) {
      this.pool.push(corners)
    }
  }

  get size(): number {
    return this.pool.length
  }
}

/**
 * Pool for axes arrays used in SAT collision test
 * Each axes array holds 4 Vector2D (2 from each OBB)
 */
class AxesPool {
  private pool: Vector2D[][] = []
  private maxSize: number

  constructor(initialSize = 32, maxSize = 128) {
    this.maxSize = maxSize
    for (let i = 0; i < initialSize; i++) {
      this.pool.push([[0, 0], [0, 0], [0, 0], [0, 0]])
    }
  }

  acquire(): Vector2D[] {
    if (this.pool.length > 0) {
      const axes = this.pool.pop()!
      // Reset axes
      for (let i = 0; i < 4; i++) {
        axes[i]![0] = 0
        axes[i]![1] = 0
      }
      return axes
    }
    return [[0, 0], [0, 0], [0, 0], [0, 0]]
  }

  release(axes: Vector2D[]): void {
    if (this.pool.length < this.maxSize && axes.length === 4) {
      this.pool.push(axes)
    }
  }

  get size(): number {
    return this.pool.length
  }
}

// Global pool instances
export const vectorPool = new VectorPool()
export const cornersPool = new CornersPool()
export const axesPool = new AxesPool()
