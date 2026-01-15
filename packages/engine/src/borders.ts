import type { Container, ContainerOffsets, Vector2D } from './types'

/**
 * State required for border handling
 */
export type BorderState = {
  positions: Vector2D[]
  velocities: Vector2D[]
  dimensions: Vector2D[]
  container: Container
  containerOffsets: ContainerOffsets
  isStatic: boolean[]
}

/**
 * Handle rigid borders - bodies bounce off container edges
 */
export function handleRigidBorders(
  state: BorderState,
  elementCount: number,
  onBounce?: (index: number) => void
): void {
  const { container, containerOffsets } = state
  const top = containerOffsets.top
  const left = containerOffsets.left
  const right = containerOffsets.right + 1
  const bottom = containerOffsets.bottom + 1

  for (let index = 0; index < elementCount; index++) {
    // Skip static elements
    if (state.isStatic[index]) continue

    const dimension = state.dimensions[index]
    const velocity = state.velocities[index]
    const position = state.positions[index]

    if (!dimension || !velocity || !position) continue

    // Top wall
    if (position[1] < dimension[1] + container.height * top) {
      onBounce?.(index)
      state.velocities[index] = [velocity[0], -velocity[1]]
      state.positions[index] = [position[0], dimension[1] + container.height * top]
    }

    // Left wall
    if (position[0] < dimension[0] + container.width * left) {
      onBounce?.(index)
      state.velocities[index] = [-velocity[0], state.velocities[index]![1]]
      state.positions[index] = [dimension[0] + container.width * left, state.positions[index]![1]]
    }

    // Bottom wall
    if (position[1] > container.height * bottom - dimension[1]) {
      onBounce?.(index)
      state.velocities[index] = [state.velocities[index]![0], -velocity[1]]
      state.positions[index] = [state.positions[index]![0], container.height * bottom - dimension[1]]
    }

    // Right wall
    if (position[0] > container.width * right - dimension[0]) {
      onBounce?.(index)
      state.velocities[index] = [-velocity[0], state.velocities[index]![1]]
      state.positions[index] = [container.width * right - dimension[0], state.positions[index]![1]]
    }
  }
}

/**
 * Handle periodic borders - bodies wrap around container edges
 */
export function handlePeriodicBorders(
  state: BorderState,
  elementCount: number
): void {
  const { container, containerOffsets } = state
  const top = containerOffsets.top
  const left = containerOffsets.left
  const right = containerOffsets.right + 1
  const bottom = containerOffsets.bottom + 1

  for (let index = 0; index < elementCount; index++) {
    // Skip static elements
    if (state.isStatic[index]) continue

    const dimension = state.dimensions[index]
    const position = state.positions[index]
    const velocity = state.velocities[index]

    if (!dimension || !position || !velocity) continue

    const dir: Vector2D = [Math.sign(velocity[0]), Math.sign(velocity[1])]

    // Top wall - wrap to bottom
    if (dir[1] === -1 && position[1] < dimension[1] + container.height * top) {
      state.positions[index] = [position[0], dimension[1] + container.height * bottom]
    }

    // Bottom wall - wrap to top
    if (dir[1] === 1 && position[1] > container.height * bottom - dimension[1]) {
      state.positions[index] = [state.positions[index]![0], container.height * top - dimension[1]]
    }

    // Left wall - wrap to right
    if (dir[0] === -1 && position[0] < dimension[0] + container.width * left) {
      state.positions[index] = [dimension[0] + container.width * right, state.positions[index]![1]]
    }

    // Right wall - wrap to left
    if (dir[0] === 1 && position[0] > container.width * right - dimension[0]) {
      state.positions[index] = [container.width * left - dimension[0], state.positions[index]![1]]
    }
  }
}
