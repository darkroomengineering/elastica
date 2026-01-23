import { distanceSquared } from '../math'
import type { CollisionResult, ContactPoint, Vector2D } from '../types'
import type { OBBState } from './obb'

/**
 * Circle vs Circle collision detection
 * Uses squared distance comparison to avoid sqrt in the common (non-colliding) case
 *
 * @returns CollisionResult with contact point on circle A's surface toward B
 */
export function circleVsCircle(
  state: OBBState,
  indexA: number,
  indexB: number
): CollisionResult {
  const posA = state.positions[indexA]
  const posB = state.positions[indexB]
  const dimA = state.dimensions[indexA]
  const dimB = state.dimensions[indexB]

  if (!posA || !posB || !dimA || !dimB) {
    return { collided: false }
  }

  // For circles, dimensions[0] stores the radius
  const radiusA = dimA[0]
  const radiusB = dimB[0]
  const radiusSum = radiusA + radiusB
  const radiusSumSq = radiusSum * radiusSum

  const distSq = distanceSquared(posA, posB)

  // No collision if distance squared is greater than combined radii squared
  if (distSq > radiusSumSq) {
    return { collided: false }
  }

  // Calculate actual distance only when collision detected
  const dist = Math.sqrt(distSq)

  // Handle degenerate case: circles at same position
  if (dist < 0.0001) {
    // Use arbitrary direction (positive X) when centers coincide
    const normal: Vector2D = [1, 0]
    const contactPoint: Vector2D = [posA[0] + radiusA, posA[1]]
    const penetration = radiusSum

    const contact: ContactPoint = {
      point: contactPoint,
      normal: normal,
      penetration: penetration,
    }

    return { collided: true, contact }
  }

  // Normal pointing from A to B
  const nx = (posB[0] - posA[0]) / dist
  const ny = (posB[1] - posA[1]) / dist
  const normal: Vector2D = [nx, ny]

  // Contact point on circle A's surface (toward B)
  const contactPoint: Vector2D = [
    posA[0] + nx * radiusA,
    posA[1] + ny * radiusA,
  ]

  // Penetration depth
  const penetration = radiusSum - dist

  const contact: ContactPoint = {
    point: contactPoint,
    normal: normal,
    penetration: penetration,
  }

  return { collided: true, contact }
}

/**
 * Circle vs AABB (Axis-Aligned Bounding Box) collision detection
 * Used when the rectangle has no rotation (angle === 0)
 *
 * Algorithm:
 * 1. Find closest point on AABB to circle center
 * 2. Check if distance from closest point to center is less than radius
 *
 * @returns CollisionResult with contact point and normal
 */
export function circleVsAABB(
  state: OBBState,
  circleIndex: number,
  rectIndex: number
): CollisionResult {
  const circlePos = state.positions[circleIndex]
  const rectPos = state.positions[rectIndex]
  const circleDim = state.dimensions[circleIndex]
  const rectDim = state.dimensions[rectIndex]

  if (!circlePos || !rectPos || !circleDim || !rectDim) {
    return { collided: false }
  }

  const radius = circleDim[0]
  const halfWidth = rectDim[0]
  const halfHeight = rectDim[1]

  // AABB bounds
  const rectLeft = rectPos[0] - halfWidth
  const rectRight = rectPos[0] + halfWidth
  const rectTop = rectPos[1] - halfHeight
  const rectBottom = rectPos[1] + halfHeight

  // Find closest point on AABB to circle center (clamp circle center to AABB bounds)
  const closestX = Math.max(rectLeft, Math.min(circlePos[0], rectRight))
  const closestY = Math.max(rectTop, Math.min(circlePos[1], rectBottom))

  // Calculate distance from closest point to circle center
  const dx = circlePos[0] - closestX
  const dy = circlePos[1] - closestY
  const distSq = dx * dx + dy * dy
  const radiusSq = radius * radius

  // Check if circle center is inside AABB
  const centerInside =
    circlePos[0] >= rectLeft &&
    circlePos[0] <= rectRight &&
    circlePos[1] >= rectTop &&
    circlePos[1] <= rectBottom

  // No collision if distance is greater than radius and center is outside
  if (distSq > radiusSq && !centerInside) {
    return { collided: false }
  }

  let normal: Vector2D
  let penetration: number
  let contactPoint: Vector2D

  if (centerInside) {
    // Circle center is inside AABB - find closest edge
    const distToLeft = circlePos[0] - rectLeft
    const distToRight = rectRight - circlePos[0]
    const distToTop = circlePos[1] - rectTop
    const distToBottom = rectBottom - circlePos[1]

    const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom)

    if (minDist === distToLeft) {
      normal = [-1, 0]
      penetration = radius + distToLeft
      contactPoint = [rectLeft, circlePos[1]]
    } else if (minDist === distToRight) {
      normal = [1, 0]
      penetration = radius + distToRight
      contactPoint = [rectRight, circlePos[1]]
    } else if (minDist === distToTop) {
      normal = [0, -1]
      penetration = radius + distToTop
      contactPoint = [circlePos[0], rectTop]
    } else {
      normal = [0, 1]
      penetration = radius + distToBottom
      contactPoint = [circlePos[0], rectBottom]
    }
  } else {
    // Circle center is outside AABB
    const dist = Math.sqrt(distSq)

    // Handle edge case: closest point is exactly at circle center
    if (dist < 0.0001) {
      normal = [1, 0]
      penetration = radius
      contactPoint = [closestX, closestY]
    } else {
      // Normal points from closest point to circle center (outward from rect)
      normal = [dx / dist, dy / dist]
      penetration = radius - dist
      contactPoint = [closestX, closestY]
    }
  }

  const contact: ContactPoint = {
    point: contactPoint,
    normal: normal,
    penetration: penetration,
  }

  return { collided: true, contact }
}

/**
 * Circle vs OBB (Oriented Bounding Box) collision detection
 * Handles rotated rectangles by transforming to local space
 *
 * Algorithm:
 * 1. Transform circle center to OBB's local coordinate space (rotate by -angle)
 * 2. Perform AABB check in local space
 * 3. Transform contact normal back to world space
 *
 * @returns CollisionResult with contact point and normal in world space
 */
export function circleVsOBB(
  state: OBBState,
  circleIndex: number,
  rectIndex: number
): CollisionResult {
  const circlePos = state.positions[circleIndex]
  const rectPos = state.positions[rectIndex]
  const circleDim = state.dimensions[circleIndex]
  const rectDim = state.dimensions[rectIndex]
  const rectAngle = state.angles[rectIndex]

  if (!circlePos || !rectPos || !circleDim || !rectDim || rectAngle === undefined) {
    return { collided: false }
  }

  // If no rotation, use simpler AABB check
  if (rectAngle === 0) {
    return circleVsAABB(state, circleIndex, rectIndex)
  }

  const radius = circleDim[0]
  const halfWidth = rectDim[0]
  const halfHeight = rectDim[1]

  // Transform circle center to OBB local space
  // Translate to OBB center, then rotate by -angle
  const relX = circlePos[0] - rectPos[0]
  const relY = circlePos[1] - rectPos[1]

  const cos = Math.cos(-rectAngle)
  const sin = Math.sin(-rectAngle)

  // Circle center in local space (OBB is now axis-aligned)
  const localX = relX * cos - relY * sin
  const localY = relX * sin + relY * cos

  // Find closest point on local AABB to local circle center
  const closestX = Math.max(-halfWidth, Math.min(localX, halfWidth))
  const closestY = Math.max(-halfHeight, Math.min(localY, halfHeight))

  // Calculate distance from closest point to circle center in local space
  const dx = localX - closestX
  const dy = localY - closestY
  const distSq = dx * dx + dy * dy
  const radiusSq = radius * radius

  // Check if circle center is inside local AABB
  const centerInside =
    localX >= -halfWidth &&
    localX <= halfWidth &&
    localY >= -halfHeight &&
    localY <= halfHeight

  // No collision if distance is greater than radius and center is outside
  if (distSq > radiusSq && !centerInside) {
    return { collided: false }
  }

  let localNormal: Vector2D
  let penetration: number
  let localContact: Vector2D

  if (centerInside) {
    // Circle center is inside OBB - find closest edge in local space
    const distToLeft = localX - (-halfWidth)
    const distToRight = halfWidth - localX
    const distToTop = localY - (-halfHeight)
    const distToBottom = halfHeight - localY

    const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom)

    if (minDist === distToLeft) {
      localNormal = [-1, 0]
      penetration = radius + distToLeft
      localContact = [-halfWidth, localY]
    } else if (minDist === distToRight) {
      localNormal = [1, 0]
      penetration = radius + distToRight
      localContact = [halfWidth, localY]
    } else if (minDist === distToTop) {
      localNormal = [0, -1]
      penetration = radius + distToTop
      localContact = [localX, -halfHeight]
    } else {
      localNormal = [0, 1]
      penetration = radius + distToBottom
      localContact = [localX, halfHeight]
    }
  } else {
    // Circle center is outside local AABB
    const dist = Math.sqrt(distSq)

    if (dist < 0.0001) {
      localNormal = [1, 0]
      penetration = radius
      localContact = [closestX, closestY]
    } else {
      localNormal = [dx / dist, dy / dist]
      penetration = radius - dist
      localContact = [closestX, closestY]
    }
  }

  // Transform normal back to world space (rotate by +angle)
  const cosWorld = Math.cos(rectAngle)
  const sinWorld = Math.sin(rectAngle)

  const worldNormal: Vector2D = [
    localNormal[0] * cosWorld - localNormal[1] * sinWorld,
    localNormal[0] * sinWorld + localNormal[1] * cosWorld,
  ]

  // Transform contact point back to world space
  const worldContact: Vector2D = [
    rectPos[0] + localContact[0] * cosWorld - localContact[1] * sinWorld,
    rectPos[1] + localContact[0] * sinWorld + localContact[1] * cosWorld,
  ]

  const contact: ContactPoint = {
    point: worldContact,
    normal: worldNormal,
    penetration: penetration,
  }

  return { collided: true, contact }
}
