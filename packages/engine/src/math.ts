import type { PolarCoordinates, Vector2D } from './types'

/**
 * Convert a vector to polar coordinates (speed and angle)
 */
export function toPolar(vector: Vector2D): PolarCoordinates {
  const speed = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1])
  const angle = Math.atan2(vector[1], vector[0])
  return { speed, angle }
}

/**
 * Convert polar coordinates to a cartesian vector
 */
export function toCartesian(speed: number, angle: number): Vector2D {
  return [speed * Math.cos(angle), speed * Math.sin(angle)]
}

/**
 * Calculate dot product of two vectors
 */
export function dot(a: Vector2D, b: Vector2D): number {
  return a[0] * b[0] + a[1] * b[1]
}

/**
 * Calculate 2D cross product (returns scalar)
 * Result is the z-component of the 3D cross product
 */
export function cross(a: Vector2D, b: Vector2D): number {
  return a[0] * b[1] - a[1] * b[0]
}

/**
 * Calculate the magnitude (length) of a vector
 */
export function magnitude(v: Vector2D): number {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1])
}

/**
 * Calculate squared magnitude (avoids sqrt for comparisons)
 */
export function magnitudeSquared(v: Vector2D): number {
  return v[0] * v[0] + v[1] * v[1]
}

/**
 * Normalize a vector to unit length
 */
export function normalize(v: Vector2D): Vector2D {
  const mag = magnitude(v)
  if (mag === 0) return [0, 0]
  return [v[0] / mag, v[1] / mag]
}

/**
 * Add two vectors
 */
export function add(a: Vector2D, b: Vector2D): Vector2D {
  return [a[0] + b[0], a[1] + b[1]]
}

/**
 * Subtract vector b from vector a
 */
export function subtract(a: Vector2D, b: Vector2D): Vector2D {
  return [a[0] - b[0], a[1] - b[1]]
}

/**
 * Scale a vector by a scalar
 */
export function scale(v: Vector2D, s: number): Vector2D {
  return [v[0] * s, v[1] * s]
}

/**
 * Negate a vector
 */
export function negate(v: Vector2D): Vector2D {
  return [-v[0], -v[1]]
}

/**
 * Rotate a point around the origin by an angle (radians)
 */
export function rotate(point: Vector2D, angle: number): Vector2D {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return [
    point[0] * cos - point[1] * sin,
    point[0] * sin + point[1] * cos,
  ]
}

/**
 * Rotate a point around a center by an angle (radians)
 */
export function rotateAround(point: Vector2D, center: Vector2D, angle: number): Vector2D {
  const translated: Vector2D = [point[0] - center[0], point[1] - center[1]]
  const rotated = rotate(translated, angle)
  return [rotated[0] + center[0], rotated[1] + center[1]]
}

/**
 * Calculate perpendicular vector (rotate 90 degrees counter-clockwise)
 */
export function perpendicular(v: Vector2D): Vector2D {
  return [-v[1], v[0]]
}

/**
 * Linear interpolation between two vectors
 */
export function lerp(a: Vector2D, b: Vector2D, t: number): Vector2D {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
  ]
}

/**
 * Calculate distance between two points
 */
export function distance(a: Vector2D, b: Vector2D): number {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Calculate squared distance between two points (avoids sqrt)
 */
export function distanceSquared(a: Vector2D, b: Vector2D): number {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  return dx * dx + dy * dy
}
