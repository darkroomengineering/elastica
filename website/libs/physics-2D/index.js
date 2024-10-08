import gsap from 'gsap'

export class ElasticCollision {
  constructor({
    gridSize = 4,
    containerOffsets = { top: 0, bottom: 1, left: 0, right: 1 },
    collisions = true,
    borders = 'rigid',
    collisionRandomness = 0,
  } = {}) {
    this.calculatecCollisions = collisions
    this.calculateBorders = borders
    this.collisionRandomness = collisionRandomness
    this.gridSize = gridSize
    this.containerOffsets = containerOffsets
    this.positions = []
    this.velocities = []
    this.dimensions = []
    this.bounced = []
    this.hash = []
    this.container = {}
    this.collisionsList = []
  }
  //todo pass elements to objects and not to array

  setup(elements, rect, callback = () => {}) {
    this.container = rect
    this.dimensions = elements.map((element) => {
      if (!element) return [0, 0]

      const { rect: elementRect } = element

      return [elementRect.width / 2, elementRect.height / 2]
    })

    callback(this)

    this.positions.forEach((pos, index) => {
      this.hash[index] =
        Math.floor(this.gridSize * (pos[0] / this.container.width)) +
        Math.floor(this.gridSize * (pos[1] / this.container.height)) *
          this.gridSize

      gsap.set(elements[index]?.element, {
        x: pos[0],
        y: pos[1],
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

  rigidBorders(elements) {
    if (this.calculateBorders !== 'rigid') return

    for (let index = 0; index < elements.length; index++) {
      // Particle cinematic properties
      const dimension = this.dimensions[index]
      let velocity = this.velocities[index]
      let position = this.positions[index]

      // Top wall
      if (
        position[1] <
        dimension[1] + this.container.height * this.containerOffsets.top
      ) {
        this.hasBounced(index)
        this.velocities[index][1] = -velocity[1]
        this.positions[index][1] =
          dimension[1] + this.container.height * this.containerOffsets.top
      }

      // Left wall
      if (
        position[0] <
        dimension[0] + this.container.width * this.containerOffsets.left
      ) {
        this.hasBounced(index)
        this.velocities[index][0] = -velocity[0]
        this.positions[index][0] =
          dimension[0] + this.container.width * this.containerOffsets.left
      }

      // Bottom wall
      if (
        position[1] >
        this.container.height * this.containerOffsets.bottom - dimension[1]
      ) {
        this.hasBounced(index)
        this.velocities[index][1] = -velocity[1]
        this.positions[index][1] =
          this.container.height * this.containerOffsets.bottom - dimension[1]
      }

      // Right wall
      if (
        position[0] >
        this.container.width * this.containerOffsets.right - dimension[0]
      ) {
        this.hasBounced(index)
        this.velocities[index][0] = -velocity[0]
        this.positions[index][0] =
          this.container.width * this.containerOffsets.right - dimension[0]
      }
    }
  }

  periodicBorders(elements) {
    if (this.calculateBorders !== 'periodic') return

    for (let index = 0; index < elements.length; index++) {
      // Particle cinematic properties
      const dimension = this.dimensions[index]
      let position = this.positions[index]
      let dir = this.velocities[index].map((v) => Math.sign(v))

      // Top wall
      if (
        dir[1] === -1 &&
        position[1] <
          dimension[1] + this.container.height * this.containerOffsets.top
      ) {
        this.positions[index][1] =
          dimension[1] + this.container.height * this.containerOffsets.bottom
      }

      // Bottom wall
      if (
        dir[1] === 1 &&
        position[1] >
          this.container.height * this.containerOffsets.bottom - dimension[1]
      ) {
        this.positions[index][1] =
          this.container.height * this.containerOffsets.top - dimension[1]
      }

      // Left wall
      if (
        dir[0] === -1 &&
        position[0] <
          dimension[0] + this.container.width * this.containerOffsets.left
      ) {
        this.positions[index][0] =
          dimension[0] + this.container.width * this.containerOffsets.right
      }

      // Right wall
      if (
        dir[0] === 1 &&
        position[0] >
          this.container.width * this.containerOffsets.right - dimension[0]
      ) {
        this.positions[index][0] =
          this.container.width * this.containerOffsets.left - dimension[0]
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

  calculateSuperposition(index, idy) {
    let force = [0, 0]

    const posA = this.positions[index]
    const dimA = this.dimensions[index]
    const posB = this.positions[idy]
    const dimB = this.dimensions[idy]

    const overlaping = posA.map(
      (pos, idx) => dimA[idx] + dimB[idx] - Math.abs(pos - posB[idx]),
    )

    if (overlaping[0] < overlaping[1]) {
      if (posA[0] < posB[0]) {
        force[0] = overlaping[0]
      } else {
        force[0] = -overlaping[0]
      }
    } else {
      if (posA[1] < posB[1]) {
        force[1] = overlaping[1]
      } else {
        force[1] = -overlaping[1]
      }
    }

    return force.map((f) => f + Math.random() * this.collisionRandomness)
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
        const exclusionForce = this.calculateSuperposition(index, idy)

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
