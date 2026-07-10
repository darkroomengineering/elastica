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
    radius?: number;
    shape: CanvasShape;
    fill: string;
    stroke?: string;
    strokeWidth?: number;
    mass?: number;
    restitution?: number;
    isStatic?: boolean;
    /**
     * Custom per-particle draw function. When provided, this particle is rendered
     * individually after the batched default pass (custom particles appear on top).
     *
     * The canvas transform has already been applied when this is called:
     * - Origin (0, 0) = body center
     * - Rotation already applied (body angle)
     * - ctx.save() / ctx.restore() wrap each call
     *
     * @param ctx   The 2D rendering context (already translated + rotated)
     * @param particle  The full particle data (width, height, radius, etc.)
     * @param scale Device pixel ratio / DPR scale factor in effect
     */
    draw?: (ctx: CanvasRenderingContext2D, particle: CanvasParticleData, scale: number) => void;
}
