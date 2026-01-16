import { handlePeriodicBorders, handleRigidBorders } from './borders'
import { detectAndResolveAABB, type AABBState } from './collision/aabb'
import { detectAndResolveOBB, integrateAngularMotion, type OBBState } from './collision/obb'
import { toCartesian, toPolar } from './math'
import type {
  BorderType,
  CollisionRecord,
  Container,
  ContainerOffsets,
  ElasticaConfigOBB,
  ElementData,
  PolarCoordinates,
  Vector2D,
} from './types'

export default class Elastica {
  /**
   * Static flag to ensure CSS is injected only once across all Elastica instances.
   * The CSS rule uses [data-elastica] selector to apply transforms via CSS variables,
   * which reduces per-frame string allocations compared to setting cssText directly.
   */
  private static stylesInjected = false

  // Core properties
  calculatecCollisions: boolean
  calculateBorders: BorderType
  gridSize: number
  containerOffsets: ContainerOffsets
  container: Container
  collisionsList: CollisionRecord[]

  // Per-body arrays
  positions: Vector2D[]
  velocities: Vector2D[]
  externalForces: Vector2D[]
  dimensions: Vector2D[]
  bounced: number[]
  hash: number[]
  isStatic: boolean[]
  staticPositions: Vector2D[] // Cached positions for static elements

  // Spatial hash buckets: cellId → element indices
  // This enables O(n×k) collision detection instead of O(n²)
  buckets: Map<number, number[]>

  // OBB rigid body properties
  useOBB: boolean
  angles: number[]
  angularVelocities: number[]
  masses: number[]
  momentsOfInertia: number[]
  restitutions: number[]
  maxExtents: number[] // Cached diagonal extent: sqrt(halfWidth² + halfHeight²)
  defaultMass: number
  defaultRestitution: number

  constructor({
    gridSize = 4,
    containerOffsets = { top: 0, bottom: 0, left: 0, right: 0 },
    collisions = true,
    borders = 'rigid',
    useOBB = true,
    defaultMass = 1,
    defaultRestitution = 0.8,
  }: ElasticaConfigOBB = {}) {
    this.calculatecCollisions = collisions
    this.calculateBorders = borders
    this.gridSize = gridSize
    this.containerOffsets = {
      top: containerOffsets.top ?? 0,
      bottom: containerOffsets.bottom ?? 0,
      left: containerOffsets.left ?? 0,
      right: containerOffsets.right ?? 0,
    }
    this.container = { width: 0, height: 0 }
    this.collisionsList = []

    // Per-body arrays
    this.positions = []
    this.velocities = []
    this.externalForces = []
    this.dimensions = []
    this.bounced = []
    this.hash = []
    this.isStatic = []
    this.staticPositions = []
    this.buckets = new Map()

    // OBB rigid body properties
    this.useOBB = useOBB
    this.angles = []
    this.angularVelocities = []
    this.masses = []
    this.momentsOfInertia = []
    this.restitutions = []
    this.maxExtents = []
    this.defaultMass = defaultMass
    this.defaultRestitution = defaultRestitution
  }

  initialCondition(
    elements: (ElementData | null | undefined)[],
    rect: Container,
    callback: (elastica: Elastica) => void = () => {}
  ): void {
    this.container = rect

    this.dimensions = elements.map((element, index) => {
      if (!element) return [0, 0] as Vector2D

      this.isStatic[index] = element.element?.dataset.state === 'static'

      this.externalForces[index] = [0, 0]
      this.bounced[index] = 0

      // Initialize OBB rigid body properties
      this.angles[index] = 0
      this.angularVelocities[index] = 0
      this.masses[index] = this.defaultMass
      this.restitutions[index] = this.defaultRestitution

      const { rect: elementRect } = element
      const halfWidth = elementRect.width / 2
      const halfHeight = elementRect.height / 2

      // Calculate moment of inertia for rectangle: I = (m/12) * (w² + h²)
      const width = elementRect.width
      const height = elementRect.height
      this.momentsOfInertia[index] =
        (this.defaultMass / 12) * (width * width + height * height)

      // Cache max extent (diagonal) for broad-phase collision checks
      this.maxExtents[index] = Math.sqrt(halfWidth * halfWidth + halfHeight * halfHeight)

      return [halfWidth, halfHeight] as Vector2D
    })

    callback(this)

    const elementCount = elements.length

    // Cache static element positions after initialization
    for (let index = 0; index < elementCount; index++) {
      const pos = this.positions[index]
      if (!pos) continue

      if (this.isStatic[index]) {
        this.staticPositions[index] = [pos[0], pos[1]]
      }

      const element = elements[index]
      const dimension = this.dimensions[index]
      if (element && dimension) {
        this.setPosition(element.element, {
          x: pos[0] - dimension[0],
          y: pos[1] - dimension[1],
        }, index)
      }
    }

    // Build initial spatial hash with buckets
    this.updateSpatialHash(elementCount)
  }

  // Spatial hash utilities
  private computeCellId(pos: Vector2D): number {
    const cellX = Math.floor((this.gridSize * pos[0]) / this.container.width)
    const cellY = Math.floor((this.gridSize * pos[1]) / this.container.height)
    // Clamp to valid range to handle edge cases
    const clampedX = Math.max(0, Math.min(this.gridSize - 1, cellX))
    const clampedY = Math.max(0, Math.min(this.gridSize - 1, cellY))
    return clampedX + clampedY * this.gridSize
  }

  updateSpatialHash(elementCount: number): void {
    // Clear all buckets
    this.buckets.clear()

    // Populate hash and buckets in single pass
    for (let index = 0; index < elementCount; index++) {
      const pos = this.positions[index]
      if (!pos) continue

      const cellId = this.computeCellId(pos)
      this.hash[index] = cellId

      // Add to bucket
      const bucket = this.buckets.get(cellId)
      if (bucket) {
        bucket.push(index)
      } else {
        this.buckets.set(cellId, [index])
      }
    }
  }

  // Get indices of elements in neighboring cells (3x3 grid around cell)
  getNeighborIndices(cellId: number): number[] {
    const indices: number[] = []
    const cellX = cellId % this.gridSize
    const cellY = Math.floor(cellId / this.gridSize)

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = cellX + dx
        const ny = cellY + dy

        // Skip out-of-bounds cells
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

  // Math utilities (delegated)
  polarCoordinates(vector: Vector2D): PolarCoordinates {
    return toPolar(vector)
  }

  cartesianCoordinates(speed: number, angle: number): Vector2D {
    return toCartesian(speed, angle)
  }

  // Bounce tracking
  hasBounced(index: number): number {
    const current = this.bounced[index] ?? 0
    this.bounced[index] = current + 1
    return this.bounced[index]!
  }

  /**
   * Lazily injects the CSS rule that enables CSS variable-based transforms.
   * Called once on first element initialization.
   *
   * Why CSS variables instead of cssText:
   * - cssText creates ~80 char strings every frame (e.g., "transform: translate3d(...)") 
   * - setProperty creates ~10 char strings (e.g., "123.45px")
   * - Avoids CSS parsing overhead on every frame
   * - will-change is set once via CSS, not reassigned every frame
   */
  private injectStyles(): void {
    if (Elastica.stylesInjected) return

    const style = document.createElement('style')
    style.id = 'elastica-css'
    // Using CSS variables --ex (x), --ey (y), --er (rotation) for transform
    // The [data-elastica] attribute marks elements managed by the engine
    style.textContent = '[data-elastica]{transform:translate3d(var(--ex,0),var(--ey,0),0)rotate(var(--er,0));will-change:transform}'
    document.head.appendChild(style)
    Elastica.stylesInjected = true
  }

  /**
   * Initializes an element for CSS variable-based positioning.
   * Should be called once per element when it's added to the simulation.
   *
   * This marks the element with data-elastica attribute which:
   * - Applies the CSS transform rule using variables
   * - Sets will-change: transform once (not every frame)
   */
  initializeElement(element: HTMLElement): void {
    this.injectStyles()
    element.dataset.elastica = ''
  }

  /**
   * Updates element position using CSS custom properties.
   * 
   * Why setProperty over cssText:
   * - Shorter strings reduce GC pressure (~10 chars vs ~80 chars per update)
   * - No CSS parsing - just variable value updates
   * - Browser batches variable updates efficiently
   */
  setPosition(
    element: HTMLElement | null | undefined,
    { x = 0, y = 0, angle = 0 }: { x?: number; y?: number; angle?: number },
    index: number
  ): void {
    if (element && !this.isStatic[index]) {
      // Update CSS variables - shorter strings than full cssText, no CSS parsing
      element.style.setProperty('--ex', x + 'px')
      element.style.setProperty('--ey', y + 'px')
      // Only set rotation if non-zero to avoid unnecessary updates
      if (angle !== 0) {
        element.style.setProperty('--er', angle + 'rad')
      }
    }
  }

  // Property setters
  setAngle(index: number, angle: number): void {
    if (index >= 0 && index < this.angles.length) {
      this.angles[index] = angle
    }
  }

  setAngularVelocity(index: number, angularVelocity: number): void {
    if (index >= 0 && index < this.angularVelocities.length) {
      this.angularVelocities[index] = angularVelocity
    }
  }

  setMass(index: number, mass: number): void {
    if (index >= 0 && index < this.masses.length) {
      this.masses[index] = mass

      // Recalculate moment of inertia
      const dimension = this.dimensions[index]
      if (dimension) {
        const width = dimension[0] * 2
        const height = dimension[1] * 2
        this.momentsOfInertia[index] = (mass / 12) * (width * width + height * height)
      }
    }
  }

  setRestitution(index: number, restitution: number): void {
    if (index >= 0 && index < this.restitutions.length) {
      this.restitutions[index] = Math.max(0, Math.min(1, restitution))
    }
  }

  // Get state objects for collision modules
  private getAABBState(): AABBState {
    return {
      positions: this.positions,
      velocities: this.velocities,
      dimensions: this.dimensions,
      hash: this.hash,
      gridSize: this.gridSize,
      isStatic: this.isStatic,
      buckets: this.buckets,
    }
  }

  private getOBBState(): OBBState {
    return {
      positions: this.positions,
      velocities: this.velocities,
      dimensions: this.dimensions,
      angles: this.angles,
      angularVelocities: this.angularVelocities,
      masses: this.masses,
      momentsOfInertia: this.momentsOfInertia,
      restitutions: this.restitutions,
      maxExtents: this.maxExtents,
      isStatic: this.isStatic,
      hash: this.hash,
      gridSize: this.gridSize,
      buckets: this.buckets,
    }
  }

  // Main update loop
  update(
    elements: (ElementData | null | undefined)[],
    callback: (elastica: Elastica) => void
  ): void {
    const elementCount = elements.length

    // User callback runs first (allows modification of velocities/positions)
    callback(this)

    // Reset static elements after user callback (single pass, minimal overhead)
    for (let index = 0; index < elementCount; index++) {
      if (this.isStatic[index]) {
        const cachedPos = this.staticPositions[index]
        if (cachedPos) {
          // Restore position from cache (in case user modified it)
          this.positions[index] = cachedPos
        }
        // Reset velocities to zero (static elements don't move)
        this.velocities[index] = [0, 0]
        this.angularVelocities[index] = 0
      }
    }

    const borderState = {
      positions: this.positions,
      velocities: this.velocities,
      dimensions: this.dimensions,
      container: this.container,
      containerOffsets: this.containerOffsets,
      isStatic: this.isStatic,
    }

    // Handle borders
    if (this.calculateBorders === 'rigid') {
      handleRigidBorders(borderState, elementCount, (index) => this.hasBounced(index))
    } else if (this.calculateBorders === 'periodic') {
      handlePeriodicBorders(borderState, elementCount)
    }

    // Handle collisions
    if (this.calculatecCollisions) {
      if (this.useOBB) {
        const obbState = this.getOBBState()
        this.collisionsList = detectAndResolveOBB(
          obbState,
          elementCount,
          (indexA, indexB) => {
            this.hasBounced(indexA)
            this.hasBounced(indexB)
          }
        )
        integrateAngularMotion(obbState)
      } else {
        const aabbState = this.getAABBState()
        this.collisionsList = detectAndResolveAABB(
          aabbState,
          elementCount,
          (indexA, indexB) => {
            this.hasBounced(indexA)
            this.hasBounced(indexB)
          }
        )
      }
    }

    // Update DOM positions
    for (let index = 0; index < elementCount; index++) {
      const element = elements[index]
      const position = this.positions[index]
      const dimension = this.dimensions[index]
      const angle = this.useOBB ? this.angles[index] : 0

      if (element && position && dimension) {
        this.setPosition(element.element, {
          x: position[0] - dimension[0],
          y: position[1] - dimension[1],
          angle: angle ?? 0,
        }, index)
      }
    }

    // Update spatial hash with buckets for next frame
    this.updateSpatialHash(elementCount)
  }
}
