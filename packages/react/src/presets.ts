import type { Container, ElementData, Vector2D } from '@darkroom.engineering/elastica'

export type { Container, ElementData, Vector2D }

export type InitialConditionParams = {
  boxes: (ElementData | null | undefined)[]
  positions: Vector2D[]
  velocities: Vector2D[]
  container: Container
  // OBB rigid body properties
  useOBB: boolean
  angles: number[]
  angularVelocities: number[]
  masses: number[]
  momentsOfInertia: number[]
  restitutions: number[]
  // Static elements
  isStatic: boolean[]
  // Visual scale (does not affect collision bounds)
  displayScales: number[]
}

export type UpdateParams = {
  boxes: (ElementData | null | undefined)[]
  positions: Vector2D[]
  velocities: Vector2D[]
  externalForces: Vector2D[]
  deltaTime: number
  // OBB rigid body properties
  useOBB: boolean
  angles: number[]
  angularVelocities: number[]
  masses: number[]
  momentsOfInertia: number[]
  restitutions: number[]
  // Spatial hash for efficient neighbor finding
  hash: number[]
  gridSize: number
  // Collision tracking
  bounced: number[]
  // Static elements
  isStatic: boolean[]
  // Visual scale (does not affect collision bounds)
  displayScales: number[]
}

export type InitialConditionPreset = (params: InitialConditionParams) => void
export type UpdatePreset = (params: UpdateParams) => void
export type DragForcePreset = (
  newDir: Vector2D,
  externalForces: Vector2D[],
  index: number
) => void

function randominitialCondition({
  boxes,
  positions,
  velocities,
  container,
  isStatic,
}: InitialConditionParams): void {
  boxes.forEach((_, index) => {
    // Skip static elements
    if (isStatic[index]) {
      // For static elements, initialize them at their current DOM position
      const element = boxes[index]
      if (element?.rect) {
        positions[index] = [
          (element.rect.left ?? 0) + element.rect.width / 2,
          (element.rect.top ?? 0) + element.rect.height / 2,
        ]
      }
      velocities[index] = [0, 0]
      return
    }

    positions[index] = [
      Math.random() * container.width,
      Math.random() * container.height,
    ]
    velocities[index] = [
      0.5 * (Math.random() - 0.5),
      0.5 * (Math.random() - 0.5),
    ]
  })
}

function randomOBBInitialCondition({
  boxes,
  positions,
  velocities,
  container,
  angles,
  angularVelocities,
  isStatic,
}: InitialConditionParams): void {
  boxes.forEach((_, index) => {
    // Skip static elements
    if (isStatic[index]) {
      // For static elements, initialize them at their current DOM position
      const element = boxes[index]
      if (element?.rect) {
        positions[index] = [
          (element.rect.left ?? 0) + element.rect.width / 2,
          (element.rect.top ?? 0) + element.rect.height / 2,
        ]
      }
      velocities[index] = [0, 0]
      angles[index] = 0
      angularVelocities[index] = 0
      return
    }

    positions[index] = [
      Math.random() * container.width,
      Math.random() * container.height,
    ]
    velocities[index] = [
      0.5 * (Math.random() - 0.5),
      0.5 * (Math.random() - 0.5),
    ]
    // Random initial rotation (0 to 2π)
    angles[index] = Math.random() * Math.PI * 2
    // Random initial angular velocity
    angularVelocities[index] = 0.01 * (Math.random() - 0.5)
  })
}

export const initalConditionsPresets: Record<string, InitialConditionPreset> = {
  random: randominitialCondition,
  randomOBB: randomOBBInitialCondition,
}

function dvdScreenSaver({
  boxes,
  positions,
  velocities,
  deltaTime,
}: UpdateParams): void {
  boxes.forEach((_, index) => {
    const position = positions[index]
    const velocity = velocities[index]
    if (!position || !velocity) return

    positions[index] = position.map(
      (pos: number, i: number) => pos + (velocity[i] ?? 0) * deltaTime
    ) as Vector2D
  })
}

function DragAndGravity({
  boxes,
  positions,
  velocities,
  deltaTime,
  externalForces,
}: UpdateParams): void {
  boxes.forEach((_, index) => {
    let velocity = velocities[index]
    let position = positions[index]
    const draggin = externalForces[index]
    if (!velocity || !position || !draggin) return

    const flow: Vector2D = [0, -0.1]

    velocity = velocity.map(
      (v: number, i: number) => v + deltaTime * -0.001 * (v - 4 * (draggin[i] ?? 0) + (flow[i] ?? 0))
    ) as Vector2D

    position = position.map((pos: number, i: number) => pos + (velocity[i] ?? 0) * deltaTime) as Vector2D

    positions[index] = position
    velocities[index] = velocity

    externalForces[index] = [0, 0]
  })
}

function rightFlow({
  boxes,
  positions,
  velocities,
  externalForces,
  deltaTime,
}: UpdateParams): void {
  boxes.forEach((_, index) => {
    let velocity = velocities[index]
    let position = positions[index]
    const draggin = externalForces[index]
    if (!velocity || !position || !draggin) return

    const flow: Vector2D = [0.5 * (Math.random() - 0.5), 0.05 * (Math.random() - 0.5)]

    velocity = velocity.map(
      (v: number, i: number) => v + deltaTime * -0.001 * (v - 4 * (draggin[i] ?? 0) + (flow[i] ?? 0))
    ) as Vector2D

    position = position.map((pos: number, i: number) => pos + (velocity[i] ?? 0) * deltaTime) as Vector2D

    positions[index] = position
    velocities[index] = velocity

    externalForces[index] = [0, 0]
  })
}

function dvdScreenSaverOBB({
  boxes,
  positions,
  velocities,
  angles,
  angularVelocities,
  deltaTime,
}: UpdateParams): void {
  boxes.forEach((_, index) => {
    const position = positions[index]
    const velocity = velocities[index]
    const angle = angles[index]
    const angularVelocity = angularVelocities[index]

    if (!position || !velocity || angle === undefined || angularVelocity === undefined) return

    // Update linear position
    positions[index] = position.map(
      (pos: number, i: number) => pos + (velocity[i] ?? 0) * deltaTime
    ) as Vector2D

    // Update angular position (rotation)
    // Note: angular velocity is already integrated by the engine in OBB mode,
    // but you can add additional angular effects here if needed
  })
}

export const updatePresets: Record<string, UpdatePreset> = {
  dvdScreenSaver,
  dvdScreenSaverOBB,
  DragAndGravity,
  rightFlow,
}

function dragForce(
  newDir: Vector2D,
  externalForces: Vector2D[],
  index: number
): void {
  let norm = newDir.map((pos: number) => pos * pos).reduce((a: number, b: number) => a + b)
  norm = Math.sqrt(norm)

  if (norm === 0) return
  externalForces[index] = newDir.map((pos: number) => pos / norm) as Vector2D
}

export const dragForcePresetsLib: Record<string, DragForcePreset> = {
  default: dragForce,
}
