import type { Vector2D } from './types'

export interface SpatialHashContainer {
  width: number
  height: number
}

export class SpatialHash {
  readonly gridSize: number
  private buckets: Map<number, number[]> = new Map()
  private hashArray: number[] = []
  private container: SpatialHashContainer = { width: 0, height: 0 }

  constructor(gridSize: number) {
    this.gridSize = gridSize
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
    const cellX = Math.floor((this.gridSize * pos[0]) / this.container.width)
    const cellY = Math.floor((this.gridSize * pos[1]) / this.container.height)
    const clampedX = Math.max(0, Math.min(this.gridSize - 1, cellX))
    const clampedY = Math.max(0, Math.min(this.gridSize - 1, cellY))
    return clampedX + clampedY * this.gridSize
  }

  update(positions: Vector2D[], elementCount: number): void {
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
    const cellX = cellId % this.gridSize
    const cellY = Math.floor(cellId / this.gridSize)

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = cellX + dx
        const ny = cellY + dy

        if (nx < 0 || nx >= this.gridSize || ny < 0 || ny >= this.gridSize) {
          continue
        }

        const neighborCellId = nx + ny * this.gridSize
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
