import { handlePeriodicBorders, handleRigidBorders, type BorderState } from './borders'
import { detectAndResolveAABB } from './collision/aabb'
import { detectAndResolveOBB, integrateAngularMotion } from './collision/obb'
import type { AABBState, OBBState } from './collision/types'
import { SpatialHash } from './spatial-hash'
import type {
  BorderType,
  CollisionRecord,
  Container,
  ContainerOffsets,
  ElasticaConfigOBB,
  ElementData,
  RenderCallback,
  ShapeType,
  Vector2D
} from './types'

export default class Elastica {
  // Spatial hash for collision detection
  private spatialHash: SpatialHash

  // Core properties
  calculateCollisions: boolean
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
  isStatic: boolean[]
  staticPositions: Vector2D[] // Cached positions for static elements
  displayScales: number[] // Visual-only scale (does not affect collision bounds)

  // Public API getters for spatial hash data (preserves backward compatibility)
  get hash(): number[] {
    return this.spatialHash.getHash()
  }

  get buckets(): Map<number, number[]> {
    return this.spatialHash.getBuckets()
  }

  // OBB rigid body properties
  useOBB: boolean
  angles: number[]
  angularVelocities: number[]
  masses: number[]
  momentsOfInertia: number[]
  restitutions: number[]
  maxExtents: number[] // Cached diagonal extent: sqrt(halfWidth² + halfHeight²)
  shapeTypes: ShapeType[] // Shape type for each element ('rectangle' or 'circle')
  defaultMass: number
  defaultRestitution: number
  solverSlop: number
  solverPercent: number
  fixedDeltaTime: number
  substeps: number

  constructor({
    gridSize = 4,
    containerOffsets = { top: 0, bottom: 0, left: 0, right: 0 },
    collisions = true,
    borders = 'rigid',
    useOBB = true,
    defaultMass = 1,
    defaultRestitution = 0.8,
    solver,
  }: ElasticaConfigOBB = {}) {
    this.calculateCollisions = collisions
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

    // Initialize spatial hash
    this.spatialHash = new SpatialHash(gridSize)

    // Per-body arrays
    this.positions = []
    this.velocities = []
    this.externalForces = []
    this.dimensions = []
    this.bounced = []
    this.isStatic = []
    this.staticPositions = []
    this.displayScales = []

    // OBB rigid body properties
    this.useOBB = useOBB
    this.angles = []
    this.angularVelocities = []
    this.masses = []
    this.momentsOfInertia = []
    this.restitutions = []
    this.maxExtents = []
    this.shapeTypes = []
    this.defaultMass = defaultMass
    this.defaultRestitution = defaultRestitution

    // Solver config
    this.solverSlop = solver?.slop ?? 0.5
    this.solverPercent = solver?.percent ?? 0.8
    this.fixedDeltaTime = Math.max(1, solver?.fixedDeltaTime ?? 16.67)
    this.substeps = Math.max(1, Math.floor(solver?.substeps ?? 1))

    // Backward-compatible alias for typo (deprecated)
    Object.defineProperty(this, 'calculatecCollisions', {
      get: () => this.calculateCollisions,
      set: (value: boolean) => { this.calculateCollisions = value },
      enumerable: false,
    })
  }

  initialCondition(
    elements: (ElementData | null | undefined)[],
    rect: Container,
    callback: (elastica: Elastica) => void = () => {}
  ): void {
    this.container = rect

    // Update spatial hash container
    this.spatialHash.setContainer(rect)

    this.dimensions = elements.map((element, index) => {
      if (!element) return [0, 0] as Vector2D

      // Check for static state - handle both DOM and canvas modes
      this.isStatic[index] = element.element?.dataset?.state === 'static'

      // Pre-allocate positions and velocities so callback can use .length
      this.positions[index] = [0, 0]
      this.velocities[index] = [0, 0]
      this.externalForces[index] = [0, 0]
      this.bounced[index] = 0
      this.displayScales[index] = 1

      // Initialize OBB rigid body properties
      this.angles[index] = 0
      this.angularVelocities[index] = 0
      this.masses[index] = this.defaultMass
      this.restitutions[index] = this.defaultRestitution

      const { rect: elementRect } = element
      const shapeType = element.shape ?? 'rectangle'
      this.shapeTypes[index] = shapeType

      if (shapeType === 'circle') {
        // For circles: use the smaller dimension as diameter, store radius in both slots
        const radius = Math.min(elementRect.width, elementRect.height) / 2

        // Moment of inertia for circle: I = 0.5 * m * r²
        this.momentsOfInertia[index] = 0.5 * this.defaultMass * radius * radius

        // For circles, maxExtent is just the radius
        this.maxExtents[index] = radius

        // Store [radius, radius] for compatibility with existing code
        return [radius, radius] as Vector2D
      }

      // Rectangle handling (default)
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
    }

    // Build initial spatial hash with buckets
    this.updateSpatialHash(elementCount)
  }

  // Spatial hash utilities - delegated to SpatialHash class
  updateSpatialHash(elementCount: number): void {
    this.spatialHash.update(this.positions, elementCount)
  }

  // Get indices of elements in neighboring cells (3x3 grid around cell)
  getNeighborIndices(cellId: number): number[] {
    return this.spatialHash.getNeighborIndices(cellId)
  }

  // Bounce tracking
  hasBounced(index: number): number {
    const current = this.bounced[index] ?? 0
    this.bounced[index] = current + 1
    return this.bounced[index]!
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

      // Recalculate moment of inertia based on shape type
      const dimension = this.dimensions[index]
      const shapeType = this.shapeTypes[index] ?? 'rectangle'

      if (dimension) {
        if (shapeType === 'circle') {
          // Circle: I = 0.5 * m * r²
          const radius = dimension[0]
          this.momentsOfInertia[index] = 0.5 * mass * radius * radius
        } else {
          // Rectangle: I = (m/12) * (w² + h²)
          const width = dimension[0] * 2
          const height = dimension[1] * 2
          this.momentsOfInertia[index] = (mass / 12) * (width * width + height * height)
        }
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

  private getOBBState(deltaTime: number): OBBState {
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
      shapeTypes: this.shapeTypes,
      hash: this.hash,
      gridSize: this.gridSize,
      buckets: this.buckets,
      slop: this.solverSlop,
      percent: this.solverPercent,
      deltaTime,
    }
  }

  private getBorderState(): BorderState {
    return {
      positions: this.positions,
      velocities: this.velocities,
      dimensions: this.dimensions,
      container: this.container,
      containerOffsets: this.containerOffsets,
      isStatic: this.isStatic,
    }
  }

  // Main update loop with substepping support
  update(
    elements: (ElementData | null | undefined)[],
    callback: (elastica: Elastica) => void,
    onRender?: RenderCallback
  ): void {
    const elementCount = elements.length

    // Cache original deltaTime and compute substep deltaTime
    const originalDeltaTime = this.fixedDeltaTime
    const substepDeltaTime = originalDeltaTime / this.substeps

    // Substep loop: smaller integration steps with collision checks between each
    for (let step = 0; step < this.substeps; step++) {
      // Set scaled deltaTime for this substep (user callback reads this)
      this.fixedDeltaTime = substepDeltaTime

      // User callback (applies forces, integrates positions with scaled dt)
      callback(this)

      // Reset static elements after user callback
      for (let index = 0; index < elementCount; index++) {
        if (this.isStatic[index]) {
          const cachedPos = this.staticPositions[index]
          if (cachedPos) {
            this.positions[index] = cachedPos
          }
          this.velocities[index] = [0, 0]
          this.angularVelocities[index] = 0
        }
      }

      // Handle borders (using cached state object)
      const borderState = this.getBorderState()
      if (this.calculateBorders === 'rigid') {
        handleRigidBorders(borderState, elementCount, (index) => this.hasBounced(index))
      } else if (this.calculateBorders === 'periodic') {
        handlePeriodicBorders(borderState, elementCount)
      }

      // Handle collisions
      if (this.calculateCollisions) {
        if (this.useOBB) {
          const obbState = this.getOBBState(substepDeltaTime)
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

      // Update spatial hash for next substep's collision detection
      this.updateSpatialHash(elementCount)
    }

    // Restore original deltaTime
    this.fixedDeltaTime = originalDeltaTime

    // Render callback (once per frame, after all physics substeps)
    if (onRender) {
      for (let index = 0; index < elementCount; index++) {
        if (this.isStatic[index]) continue

        const position = this.positions[index]
        const dimension = this.dimensions[index]
        if (!position || !dimension) continue

        const x = position[0] - dimension[0]
        const y = position[1] - dimension[1]
        const angle = this.useOBB ? (this.angles[index] ?? 0) : 0
        const scale = this.displayScales[index] ?? 1

        onRender(index, x, y, angle, scale)
      }
    }
  }
}
