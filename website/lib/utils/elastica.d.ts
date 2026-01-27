declare module '@elastica' {
  import type { HTMLAttributes, ReactNode, RefAttributes } from 'react'

  // =============================================================================
  // Core Types
  // =============================================================================

  export type Vector2D = [number, number]

  export interface Container {
    width: number
    height: number
  }

  export interface ElementData {
    element?: HTMLElement | null
    rect: { width: number; height: number; left?: number; top?: number }
  }

  export interface SolverConfig {
    /** Allowed penetration before correction (default: 0.5) */
    slop?: number
    /** Position correction strength 0-1 (default: 0.8) */
    percent?: number
    /** Fixed timestep in ms (default: 16.67) */
    fixedDeltaTime?: number
  }

  export interface ElasticaConfigOBB {
    gridSize?: number
    collisions?: boolean
    borders?: 'rigid' | 'periodic' | false
    useOBB?: boolean
    defaultMass?: number
    defaultRestitution?: number
    solver?: SolverConfig
    containerOffsets?: {
      top?: number
      bottom?: number
      left?: number
      right?: number
    }
  }

  // =============================================================================
  // Callback Parameter Types
  // =============================================================================

  export interface InitialConditionParams {
    boxes: ElementData[]
    positions: Vector2D[]
    velocities: Vector2D[]
    container: Container
    useOBB: boolean
    angles: number[]
    angularVelocities: number[]
    masses: number[]
    momentsOfInertia: number[]
    restitutions: number[]
    isStatic: boolean[]
    displayScales: number[]
  }

  export interface UpdateParams extends InitialConditionParams {
    externalForces: Vector2D[]
    deltaTime: number
    hash: number[]
    gridSize: number
    bounced: number[]
  }

  // =============================================================================
  // DomElastica (formerly ReactElastica)
  // =============================================================================

  export interface DomElasticaRef {
    play: () => void
    pause: () => void
  }

  export interface DomElasticaProps {
    children?: ReactNode
    className?: string
    config?: ElasticaConfigOBB
    initialCondition?: (params: InitialConditionParams) => void
    update?: (params: UpdateParams) => void
    showHashGrid?: boolean
    ref?: React.Ref<DomElasticaRef>
  }

  export function DomElastica(props: DomElasticaProps): JSX.Element

  export type BoundaryBoxProps = HTMLAttributes<HTMLDivElement>

  export function BoundaryBox(props: BoundaryBoxProps): JSX.Element

  // =============================================================================
  // CanvasElastica
  // =============================================================================

  export type CanvasShape = 'rect' | 'circle'

  export interface CanvasElasticaProps {
    children?: ReactNode
    className?: string
    style?: React.CSSProperties
    config?: ElasticaConfigOBB
    initialCondition?: (params: InitialConditionParams) => void
    update?: (params: UpdateParams) => void
    dpr?: number
    showHashGrid?: boolean
  }

  export function CanvasElastica(props: CanvasElasticaProps): JSX.Element

  export interface CanvasBoxProps {
    /** Width in pixels (required for 'rect', ignored for 'circle' if radius is set) */
    width?: number
    /** Height in pixels (required for 'rect', ignored for 'circle' if radius is set) */
    height?: number
    /** Radius in pixels (for 'circle' shape only) */
    radius?: number
    shape?: CanvasShape
    fill?: string
    stroke?: string
    strokeWidth?: number
    mass?: number
    restitution?: number
    static?: boolean
  }

  export function CanvasBox(props: CanvasBoxProps): null

  // =============================================================================
  // Context and Hooks
  // =============================================================================

  interface Elastica {
    gridSize: number
    positions: Vector2D[]
    velocities: Vector2D[]
    externalForces: Vector2D[]
    angles: number[]
    angularVelocities: number[]
    masses: number[]
    restitutions: number[]
    isStatic: boolean[]
    bounced: number[]
    initialCondition: (
      elements: ElementData[],
      rect: Container,
      callback: (params: InitialConditionParams) => void
    ) => void
    update: (
      elements: ElementData[],
      callback: (params: UpdateParams) => void
    ) => void
    initializeElement: (element: HTMLElement | null | undefined) => void
    setMass: (index: number, mass: number) => void
    setRestitution: (index: number, restitution: number) => void
  }

  export interface ElasticaContextValue {
    elastica: Elastica
    container: Container | null
    mode: 'dom' | 'canvas'
  }

  export interface DomElasticaContextValue extends ElasticaContextValue {
    mode: 'dom'
    addBox: (element: HTMLElement, data: ElementData) => void
    removeBox: (element: HTMLElement) => void
  }

  export interface CanvasElasticaContextValue extends ElasticaContextValue {
    mode: 'canvas'
    registerParticle: (data: Omit<CanvasParticleData, 'index'>) => number
    unregisterParticle: (index: number) => void
    updateParticle: (index: number, data: Partial<CanvasParticleData>) => void
  }

  export interface CanvasParticleData {
    index: number
    width: number
    height: number
    radius?: number
    shape: CanvasShape
    fill: string
    stroke?: string
    strokeWidth?: number
    mass?: number
    restitution?: number
    isStatic?: boolean
  }

  export function useElastica(): ElasticaContextValue
  export function useDomElastica(): DomElasticaContextValue
  export function useCanvasElastica(): CanvasElasticaContextValue

  // =============================================================================
  // Presets
  // =============================================================================

  export const initalConditionsPresets: {
    random: (params: InitialConditionParams) => void
    randomOBB: (params: InitialConditionParams) => void
  }

  export const updatePresets: {
    dvdScreenSaver: (params: UpdateParams) => void
    dvdScreenSaverOBB: (params: UpdateParams) => void
    DragAndGravity: (params: UpdateParams) => void
    rightFlow: (params: UpdateParams) => void
  }

  export const dragForcePresetsLib: {
    default: (
      direction: number[],
      externalForces: Vector2D[],
      index: number
    ) => void
  }

  // =============================================================================
  // Deprecated Aliases
  // =============================================================================

  /** @deprecated Use DomElasticaRef instead */
  export type ReactElasticaRef = DomElasticaRef

  /** @deprecated Use DomElasticaProps instead */
  export type ReactElasticaProps = DomElasticaProps

  /** @deprecated Use DomElastica instead */
  export const ReactElastica: typeof DomElastica

  /** @deprecated Use BoundaryBoxProps instead */
  export type AxisAlignedBoundaryBoxProps = BoundaryBoxProps

  /** @deprecated Use BoundaryBox instead */
  export const AxisAlignedBoundaryBox: typeof BoundaryBox

  // Default export
  export default DomElastica
}
