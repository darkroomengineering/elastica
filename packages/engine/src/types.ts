export type Vector2D = [number, number]

export type ShapeType = 'rectangle' | 'circle'

export type BorderType = 'rigid' | 'periodic' | false

export type ContainerOffsets = {
  top: number
  bottom: number
  left: number
  right: number
}

export type Container = {
  width: number
  height: number
}

export type ElementData = {
  element?: HTMLElement | null  // Optional for canvas mode
  rect: { width: number; height: number; left?: number; top?: number }  // left/top optional for presets
  shape?: ShapeType  // Optional shape type ('rectangle' or 'circle'), defaults to 'rectangle'
}

export type ElasticaConfig = {
  gridSize?: number
  containerOffsets?: Partial<ContainerOffsets>
  collisions?: boolean
  borders?: BorderType
}

export type CollisionRecord = {
  loop: number
  inHash: number
}

export type PolarCoordinates = {
  speed: number
  angle: number
}

// Rigid body physics types

export type RigidBodyProperties = {
  mass: number
  momentOfInertia: number
  restitution: number
}

export type ContactPoint = {
  point: Vector2D
  normal: Vector2D
  penetration: number
}

export type CollisionResult = {
  collided: boolean
  contact?: ContactPoint
}

export type SolverConfig = {
  /** Allowed penetration before correction (default: 0.5) */
  slop?: number
  /** Position correction strength 0-1 (default: 0.8) */
  percent?: number
  /** Fixed timestep in ms (default: 16.67) */
  fixedDeltaTime?: number
  /** Number of physics substeps per frame (default: 1) */
  substeps?: number
}

export type ElasticaConfigOBB = ElasticaConfig & {
  useOBB?: boolean
  defaultMass?: number
  defaultRestitution?: number
  solver?: SolverConfig
}

/** Callback invoked for each element during render phase */
export type RenderCallback = (
  index: number,
  x: number,
  y: number,
  angle: number,
  scale: number
) => void
