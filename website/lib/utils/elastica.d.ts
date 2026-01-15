declare module '@elastica' {
  import type { HTMLAttributes, ReactNode, RefAttributes } from 'react'

  export interface ReactElasticaRef {
    play: () => void
    pause: () => void
  }

  export type Vector2D = [number, number]

  export interface ElementData {
    element: HTMLElement
    rect: DOMRect | null
  }

  export interface UpdateParams {
    boxes: ElementData[]
    positions: Vector2D[]
    velocities: Vector2D[]
    externalForces: Vector2D[]
    dimensions: Vector2D[]
    angles: number[]
    angularVelocities: number[]
    masses: number[]
    momentsOfInertia: number[]
    restitutions: number[]
    deltaTime: number
    bounced: number[]
    hash: number[]
    gridSize: number
    useOBB: boolean
    isStatic: boolean[]
    setPosition: (
      element: HTMLElement | null | undefined,
      pos: { x: number; y: number; angle: number },
      index: number
    ) => void
  }

  export interface InitialConditionParams {
    boxes: ElementData[]
    positions: Vector2D[]
    velocities: Vector2D[]
    container: { width: number; height: number }
    angles: number[]
    angularVelocities: number[]
    isStatic: boolean[]
  }

  export interface ElasticaConfigOBB {
    gridSize?: number
    collisions?: boolean
    borders?: 'rigid' | 'periodic'
    useOBB?: boolean
    containerOffsets?: {
      top?: number
      bottom?: number
      left?: number
      right?: number
    }
  }

  export interface ReactElasticaProps {
    children?: ReactNode
    className?: string
    config?: ElasticaConfigOBB
    initialCondition?: (params: InitialConditionParams) => void
    update?: (params: UpdateParams) => void
    showHashGrid?: boolean
  }

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

  interface Elastica {
    gridSize: number
    externalForces: Vector2D[]
    initialCondition: (
      elements: ElementData[],
      rect: DOMRect | null,
      callback: (params: InitialConditionParams) => void
    ) => void
    update: (
      elements: ElementData[],
      callback: (params: UpdateParams) => void
    ) => void
  }

  export interface ElasticaContextValue {
    addBox: (element: HTMLElement, data: ElementData) => void
    removeBox: (element: HTMLElement) => void
    elastica: Elastica
  }

  export function useElastica(): ElasticaContextValue

  export type AxisAlignedBoundaryBoxProps = HTMLAttributes<HTMLDivElement>

  export function AxisAlignedBoundaryBox(
    props: AxisAlignedBoundaryBoxProps
  ): JSX.Element

  const ReactElastica: React.ForwardRefExoticComponent<
    ReactElasticaProps & RefAttributes<ReactElasticaRef>
  >

  export default ReactElastica
}
