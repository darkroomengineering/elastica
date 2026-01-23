import type { Container, ElasticaConfigOBB, ElementData, Vector2D } from '@darkroom.engineering/elastica';
export type { Container, ElasticaConfigOBB, ElementData, Vector2D };
export interface InitialConditionParams {
    boxes: (ElementData | null | undefined)[];
    positions: Vector2D[];
    velocities: Vector2D[];
    container: Container;
    useOBB: boolean;
    angles: number[];
    angularVelocities: number[];
    masses: number[];
    momentsOfInertia: number[];
    restitutions: number[];
    isStatic: boolean[];
    displayScales: number[];
}
export interface UpdateParams extends InitialConditionParams {
    externalForces: Vector2D[];
    deltaTime: number;
    hash: number[];
    gridSize: number;
    bounced: number[];
}
export type CanvasShape = 'rect' | 'circle';
export interface CanvasParticleData {
    index: number;
    width: number;
    height: number;
    shape: CanvasShape;
    fill: string;
    stroke?: string;
    strokeWidth?: number;
    mass?: number;
    restitution?: number;
    isStatic?: boolean;
}
