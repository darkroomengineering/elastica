function randomInitialConditions({ boxes, positions, velocities, container }) {
  boxes.forEach((_, index) => {
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

export const initalConditionsPresets = {
  random: randomInitialConditions,
}

function dvdAnimation({ boxes, positions, velocities, deltaTime }) {
  boxes.forEach((_, index) => {
    positions[index] = positions[index].map(
      (pos, i) => pos + velocities[index][i] * deltaTime
    )
  })
}

function DragAndGravity({
  boxes,
  positions,
  velocities,
  deltaTime,
  externalForces,
}) {
  boxes.forEach((_, index) => {
    let velocity = velocities[index]
    let position = positions[index]
    let draggin = externalForces[index]
    const flow = [0, -0.1]

    velocity = velocity.map(
      (v, i) => v + deltaTime * -0.001 * (v - 4 * draggin[i] + flow[i])
    )

    position = position.map((pos, i) => pos + velocity[i] * deltaTime)

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
}) {
  boxes.forEach((_, index) => {
    let velocity = velocities[index]
    let position = positions[index]
    let draggin = externalForces[index]
    const flow = [0.05, 0]

    velocity = velocity.map(
      (v, i) => v + deltaTime * -0.001 * (v - 4 * draggin[i] + flow[i])
    )

    positions[index] = position = position.map(
      (pos, i) => pos + velocity[i] * deltaTime
    )

    positions[index] = position
    velocities[index] = velocity

    externalForces[index] = [0, 0]
  })
}

export const updatePresets = {
  dvdAnimation,
  DragAndGravity,
  rightFlow,
}

function dragForce(newDir, externalForces, index) {
  let norm = newDir.map((pos) => pos * pos).reduce((a, b) => a + b)
  norm = Math.sqrt(norm)

  if (norm === 0) return
  externalForces[index] = newDir.map((pos) => pos / norm)
}

export const dragForcePresetsLib = {
  default: dragForce,
}
