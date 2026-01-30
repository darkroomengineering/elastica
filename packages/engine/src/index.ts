// Main class
export { default } from './elastica'

// Types
export * from './types'

// Math utilities
export * from './math'

// Collision modules (for advanced usage)
export * from './collision'

// Border handling (for advanced usage)
export * from './borders'

// Physics accumulator (for frame-rate independent physics)
export * from './accumulator'

// Renderer (for custom rendering implementations)
export { DOMRenderer, NullRenderer, type Renderer } from './renderer'

// Spatial hash (for advanced usage)
export { SpatialHash } from './spatial-hash'

// Object pools (only used ones)
export { cornersPool, axesPool } from './pool'
