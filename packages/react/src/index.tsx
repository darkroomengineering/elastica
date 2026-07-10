'use client'

// Re-export types
export type {
  Container,
  ElasticaConfigOBB,
  ElementData,
  Vector2D,
} from '@darkroom.engineering/elastica'

export type {
  CanvasParticleData,
  CanvasShape,
  InitialConditionParams,
  UpdateParams,
} from './types'

// Context and hooks
export {
  ElasticaContext,
  useElastica,
  useDomElastica,
  useCanvasElastica,
  type AnyElasticaContextValue,
  type CanvasElasticaContextValue,
  type DomElasticaContextValue,
  type ElasticaContextValue,
} from './context'

// DOM components
export { DomElastica, type DomElasticaProps, type DomElasticaRef } from './dom/dom-elastica'
export { BoundaryBox, type BoundaryBoxProps } from './dom/boundary-box'

// Canvas components
export { CanvasElastica, type CanvasElasticaProps, type CanvasElasticaRef } from './canvas/canvas-elastica'
export { CanvasBox, type CanvasBoxProps } from './canvas/canvas-box'

// Presets
export {
  dragForcePresetsLib,
  initalConditionsPresets,
  updatePresets,
} from './presets'

// Utilities
export { HashGrid, isEmptyArray, useJavascriptEnable, createSettleDetector } from './utils'

// Deprecated aliases for backwards compatibility
export { DomElastica as ReactElastica } from './dom/dom-elastica'
export { BoundaryBox as AxisAlignedBoundaryBox } from './dom/boundary-box'

/** @deprecated Use DomElasticaRef instead */
export type ReactElasticaRef = import('./dom/dom-elastica').DomElasticaRef

/** @deprecated Use DomElasticaProps instead */
export type ReactElasticaProps = import('./dom/dom-elastica').DomElasticaProps

/** @deprecated Use BoundaryBoxProps instead */
export type AxisAlignedBoundaryBoxProps = import('./dom/boundary-box').BoundaryBoxProps

// Default export for convenience
export { DomElastica as default } from './dom/dom-elastica'
