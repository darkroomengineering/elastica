import type { Vector2D } from './types'

export interface SpatialHashContainer {
  width: number
  height: number
}

export class SpatialHash {
  private _gridSize: number
  private buckets: Map<number, number[]> = new Map()
  private hashArray: number[] = []
  private container: SpatialHashContainer = { width: 0, height: 0 }
  private largestExtent = 0
  private noSizeUpdates = 0

  constructor(gridSize: number) {
    this._gridSize = Number.isFinite(gridSize) && gridSize >= 1 ? Math.floor(gridSize) : 4
  }

  get gridSize(): number {
    return this._gridSize
  }

  set gridSize(v: number) {
    if (Number.isFinite(v) && v >= 1) {
      this._gridSize = Math.floor(v)
    }
  }

  /**
   * Set the largest body half-extent in the scene so effectiveGridSize can
   * auto-scale the cell size to guarantee the 3×3 neighborhood is sufficient.
   */
  setLargestExtent(v: number): void {
    this.largestExtent = Number.isFinite(v) && v >= 0 ? v : 0
  }

  /**
   * The grid size actually used for hashing.
   * When bodies are large relative to the container, the user-configured
   * gridSize is reduced so that a 3×3 cell neighborhood always encompasses
   * the full extent of any body, preventing missed collision pairs.
   */
  get effectiveGridSize(): number {
    const { width, height } = this.container
    if (this.largestExtent > 0 && width > 0 && height > 0) {
      return Math.max(
        1,
        Math.min(
          this._gridSize,
          Math.floor(Math.min(width, height) / this.largestExtent)
        )
      )
    }
    return this._gridSize
  }

  setContainer(container: SpatialHashContainer): void {
    this.container = container
  }

  getHash(): number[] {
    return this.hashArray
  }

  getBuckets(): Map<number, number[]> {
    return this.buckets
  }

  computeCellId(pos: Vector2D): number {
    const gs = this.effectiveGridSize
    const rawCellX = Math.floor((gs * pos[0]) / this.container.width)
    const rawCellY = Math.floor((gs * pos[1]) / this.container.height)
    // NaN-safe: clamp non-finite values to 0 before clamping to grid bounds
    const cellX = Number.isFinite(rawCellX) ? rawCellX : 0
    const cellY = Number.isFinite(rawCellY) ? rawCellY : 0
    const clampedX = Math.max(0, Math.min(gs - 1, cellX))
    const clampedY = Math.max(0, Math.min(gs - 1, cellY))
    return clampedX + clampedY * gs
  }

  update(positions: Vector2D[], elementCount: number): void {
    if (!(this.container.width > 0) || !(this.container.height > 0)) {
      this.buckets.clear()
      this.hashArray.length = 0
      // Warn only after sustained unsized updates (~1s at 60fps): transient
      // pre-measure mounts stay silent, a genuinely missing container surfaces.
      this.noSizeUpdates++
      if (this.noSizeUpdates === 60) {
        console.warn(
          'Elastica: spatial hash disabled — container has no size; collisions are off until a sized container is provided'
        )
      }
      return
    }

    this.noSizeUpdates = 0
    this.buckets.clear()

    for (let index = 0; index < elementCount; index++) {
      const pos = positions[index]
      if (!pos) continue

      const cellId = this.computeCellId(pos)
      this.hashArray[index] = cellId

      const bucket = this.buckets.get(cellId)
      if (bucket) {
        bucket.push(index)
      } else {
        this.buckets.set(cellId, [index])
      }
    }
  }

  getNeighborIndices(cellId: number): number[] {
    const indices: number[] = []
    const gs = this.effectiveGridSize
    const cellX = cellId % gs
    const cellY = Math.floor(cellId / gs)

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = cellX + dx
        const ny = cellY + dy

        if (nx < 0 || nx >= gs || ny < 0 || ny >= gs) {
          continue
        }

        const neighborCellId = nx + ny * gs
        const bucket = this.buckets.get(neighborCellId)
        if (bucket) {
          for (let i = 0; i < bucket.length; i++) {
            indices.push(bucket[i]!)
          }
        }
      }
    }

    return indices
  }
}
