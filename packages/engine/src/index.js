export default class Elastica {
  constructor({
    gridSize = 4,
    containerOffsets = { top: 0, bottom: 0, left: 0, right: 0 },
    collisions = true,
    borders = 'rigid',
  } = {}) {
    this.calculatecCollisions = collisions
    this.calculateBorders = borders
    this.gridSize = gridSize
    this.containerOffsets = containerOffsets
    this.positions = []
    this.velocities = []
    this.externalForces = []
    this.dimensions = []
    this.bounced = []
    this.hash = []
    this.container = {}
    this.collisionsList = []
  }
  //TODO pass elements to objects and not to array

  initialCondition(elements, rect, callback = () => {}) {
    this.container = rect

    this.dimensions = elements.map((element, index) => {
      if (!element) return [0, 0]

      this.externalForces[index] = [0, 0]
      this.bounced[index] = 0

      const { rect: elementRect } = element

      return [elementRect.width / 2, elementRect.height / 2]
    })

    callback(this)

    this.positions.forEach((pos, index) => {
      this.hash[index] =
        Math.floor(this.gridSize * (pos[0] / this.container.width)) +
        Math.floor(this.gridSize * (pos[1] / this.container.height)) *
          this.gridSize

      this.setPosition(elements[index]?.element, {
        x: pos[0] - this.dimensions[index][0],
        y: pos[1] - this.dimensions[index][1],
      })
    })
  }

  polarCoordinates(vector) {
    let speed = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1])
    const angle = Math.atan2(vector[1], vector[0])

    return { speed, angle }
  }

  cartesianCoordinates(speed, angle) {
    return [speed * Math.cos(angle), speed * Math.sin(angle)]
  }

  hasBounced(index) {
    return (this.bounced[index] += 1)
  }

  setPosition(element, { x = 0, y = 0, z = 0 }) {
    if (element) {
      element.style.cssText = `transform: translate3d(${x}px, ${y}px, ${z}px); will-change: transform;`
    }
  }

  rigidBorders(elements) {
    if (this.calculateBorders !== 'rigid') return

    const top = this.containerOffsets.top
    const left = this.containerOffsets.left
    const right = this.containerOffsets.right + 1
    const bottom = this.containerOffsets.bottom + 1

    for (let index = 0; index < elements.length; index++) {
      // Particle cinematic properties
      const dimension = this.dimensions[index]
      let velocity = this.velocities[index]
      let position = this.positions[index]

      // Top wall
      if (position[1] < dimension[1] + this.container.height * top) {
        this.hasBounced(index)
        this.velocities[index][1] = -velocity[1]
        this.positions[index][1] = dimension[1] + this.container.height * top
      }

      // Left wall
      if (position[0] < dimension[0] + this.container.width * left) {
        this.hasBounced(index)
        this.velocities[index][0] = -velocity[0]
        this.positions[index][0] = dimension[0] + this.container.width * left
      }

      // Bottom wall
      if (position[1] > this.container.height * bottom - dimension[1]) {
        this.hasBounced(index)
        this.velocities[index][1] = -velocity[1]
        this.positions[index][1] = this.container.height * bottom - dimension[1]
      }

      // Right wall
      if (position[0] > this.container.width * right - dimension[0]) {
        this.hasBounced(index)
        this.velocities[index][0] = -velocity[0]
        this.positions[index][0] = this.container.width * right - dimension[0]
      }
    }
  }

  periodicBorders(elements) {
    if (this.calculateBorders !== 'periodic') return

    const top = this.containerOffsets.top
    const left = this.containerOffsets.left
    const right = this.containerOffsets.right + 1
    const bottom = this.containerOffsets.bottom + 1

    for (let index = 0; index < elements.length; index++) {
      // Particle cinematic properties
      const dimension = this.dimensions[index]
      let position = this.positions[index]
      let dir = this.velocities[index].map((v) => Math.sign(v))

      // Top wall
      if (
        dir[1] === -1 &&
        position[1] < dimension[1] + this.container.height * top
      ) {
        this.positions[index][1] = dimension[1] + this.container.height * bottom
      }

      // Bottom wall
      if (
        dir[1] === 1 &&
        position[1] > this.container.height * bottom - dimension[1]
      ) {
        this.positions[index][1] = this.container.height * top - dimension[1]
      }

      // Left wall
      if (
        dir[0] === -1 &&
        position[0] < dimension[0] + this.container.width * left
      ) {
        this.positions[index][0] = dimension[0] + this.container.width * right
      }

      // Right wall
      if (
        dir[0] === 1 &&
        position[0] > this.container.width * right - dimension[0]
      ) {
        this.positions[index][0] = this.container.width * left - dimension[0]
      }
    }
  }

  isNeighboor(current, index) {
    const neighboorHash = this.hash[index]
    let hashItem = this.hash[current]
    let isNeighboor = false

    for (let i = -1; i < 2; i++) {
      for (let j = -1; j < 2; j++) {
        let box = hashItem + this.gridSize * i + j

        if (box < 0 || box > this.gridSize * this.gridSize) {
          continue
        }

        if (box === neighboorHash) {
          isNeighboor = true
          break
        }
      }
    }

    return isNeighboor
  }

  axisAlignedBoundaryBoxes(index, idy) {
    const dimension = this.dimensions[index]
    const position = this.positions[index]

    const neighboorDimension = this.dimensions[idy]
    const neighboorPosition = this.positions[idy]

    const overlaping = position.map(
      (pos, idx) =>
        Math.abs(pos - neighboorPosition[idx]) <
        dimension[idx] + neighboorDimension[idx],
    )

    return overlaping.every((overlap) => overlap)
  }

  //TODO improve this function
  calculateSuperposition(index, idy) {
    const posA = this.positions[index]
    const dimA = this.dimensions[index]
    const posB = this.positions[idy]
    const dimB = this.dimensions[idy]

    const overlaping = posA.map(
      (pos, idx) => dimA[idx] + dimB[idx] - Math.abs(pos - posB[idx]),
    )

    const overlapDir = posA.map((pos, idx) => -Math.sign(pos - posB[idx]))

    return overlaping.map((v, i) => overlapDir[i] * Math.max(1 / v, 0.5))
  }

  collisions(elements) {
    if (!this.calculatecCollisions) return
    this.collisionsList = []

    for (let index = 0; index < elements.length; index++) {
      let velocity = this.velocities[index]

      // Collisions from particle X to all other
      this.hash.forEach((neighboorHash, idy) => {
        //Discard same element
        if (idy === index) return

        let neighboorVelocity = this.velocities[idy]

        // Collisions are pairwise so need to check if already collided
        if (
          this.collisionsList.some(
            ({ loop, inHash }) => loop === idy && inHash === index,
          )
        )
          return

        // Discard if not a neighboor
        if (!this.isNeighboor(index, idy)) return

        const hasCollision = this.axisAlignedBoundaryBoxes(index, idy)

        //no colisions
        if (!hasCollision) {
          return
        }

        // Add to collision list
        this.collisionsList.push({ loop: index, inHash: idy })

        // Calculate initial kinetic energy
        const initialKE =
          0.5 *
          (velocity.reduce((sum, v) => sum + v * v, 0) +
            neighboorVelocity.reduce((sum, v) => sum + v * v, 0))

        // Resolve superpositions
        let exclusionForce = this.calculateSuperposition(index, idy)

        // Apply superposition forces
        let collisonVelocity = velocity.map((v, idx) => v + exclusionForce[idx])
        let neighboorCollisionVelocity = neighboorVelocity.map(
          (v, idx) => v - exclusionForce[idx],
        )

        // Calculate new kinetic energy
        const finalKE =
          0.5 *
          (collisonVelocity.reduce((sum, v) => sum + v * v, 0) +
            neighboorCollisionVelocity.reduce((sum, v) => sum + v * v, 0))

        // Scale velocities to conserve energy
        if (finalKE !== 0) {
          const scale = Math.sqrt(initialKE / finalKE)
          collisonVelocity = collisonVelocity.map((v) => v * scale)
          neighboorCollisionVelocity = neighboorCollisionVelocity.map(
            (v) => v * scale,
          )
        }

        // Swap velocities
        this.velocities[index] = neighboorCollisionVelocity
        this.velocities[idy] = collisonVelocity
      })
    }
  }

  update(elements, callback) {
    this.rigidBorders(elements)
    this.periodicBorders(elements)
    this.collisions(elements)
    callback(this)

    this.positions.forEach((pos, index) => {
      this.hash[index] =
        Math.floor((this.gridSize * pos[0]) / this.container.width) +
        Math.floor((this.gridSize * pos[1]) / this.container.height) *
          this.gridSize
    })
  }
}
