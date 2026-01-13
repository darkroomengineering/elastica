import type { PolarCoordinates, Vector2D } from './types';
/**
 * Convert a vector to polar coordinates (speed and angle)
 */
export declare function toPolar(vector: Vector2D): PolarCoordinates;
/**
 * Convert polar coordinates to a cartesian vector
 */
export declare function toCartesian(speed: number, angle: number): Vector2D;
/**
 * Calculate dot product of two vectors
 */
export declare function dot(a: Vector2D, b: Vector2D): number;
/**
 * Calculate 2D cross product (returns scalar)
 * Result is the z-component of the 3D cross product
 */
export declare function cross(a: Vector2D, b: Vector2D): number;
/**
 * Calculate the magnitude (length) of a vector
 */
export declare function magnitude(v: Vector2D): number;
/**
 * Calculate squared magnitude (avoids sqrt for comparisons)
 */
export declare function magnitudeSquared(v: Vector2D): number;
/**
 * Normalize a vector to unit length
 */
export declare function normalize(v: Vector2D): Vector2D;
/**
 * Add two vectors
 */
export declare function add(a: Vector2D, b: Vector2D): Vector2D;
/**
 * Subtract vector b from vector a
 */
export declare function subtract(a: Vector2D, b: Vector2D): Vector2D;
/**
 * Scale a vector by a scalar
 */
export declare function scale(v: Vector2D, s: number): Vector2D;
/**
 * Negate a vector
 */
export declare function negate(v: Vector2D): Vector2D;
/**
 * Rotate a point around the origin by an angle (radians)
 */
export declare function rotate(point: Vector2D, angle: number): Vector2D;
/**
 * Rotate a point around a center by an angle (radians)
 */
export declare function rotateAround(point: Vector2D, center: Vector2D, angle: number): Vector2D;
/**
 * Calculate perpendicular vector (rotate 90 degrees counter-clockwise)
 */
export declare function perpendicular(v: Vector2D): Vector2D;
/**
 * Linear interpolation between two vectors
 */
export declare function lerp(a: Vector2D, b: Vector2D, t: number): Vector2D;
/**
 * Calculate distance between two points
 */
export declare function distance(a: Vector2D, b: Vector2D): number;
/**
 * Calculate squared distance between two points (avoids sqrt)
 */
export declare function distanceSquared(a: Vector2D, b: Vector2D): number;
