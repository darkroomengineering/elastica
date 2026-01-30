import type { BorderType, CollisionRecord, Container, ContainerOffsets, ElasticaConfigOBB, ElementData, ShapeType, Vector2D } from './types';
export default class Elastica {
    private renderer;
    private spatialHash;
    calculateCollisions: boolean;
    calculateBorders: BorderType;
    gridSize: number;
    containerOffsets: ContainerOffsets;
    container: Container;
    collisionsList: CollisionRecord[];
    positions: Vector2D[];
    velocities: Vector2D[];
    externalForces: Vector2D[];
    dimensions: Vector2D[];
    bounced: number[];
    isStatic: boolean[];
    staticPositions: Vector2D[];
    displayScales: number[];
    get hash(): number[];
    get buckets(): Map<number, number[]>;
    useOBB: boolean;
    angles: number[];
    angularVelocities: number[];
    masses: number[];
    momentsOfInertia: number[];
    restitutions: number[];
    maxExtents: number[];
    shapeTypes: ShapeType[];
    defaultMass: number;
    defaultRestitution: number;
    solverSlop: number;
    solverPercent: number;
    fixedDeltaTime: number;
    substeps: number;
    constructor({ gridSize, containerOffsets, collisions, borders, useOBB, defaultMass, defaultRestitution, solver, }?: ElasticaConfigOBB);
    initialCondition(elements: (ElementData | null | undefined)[], rect: Container, callback?: (elastica: Elastica) => void): void;
    updateSpatialHash(elementCount: number): void;
    getNeighborIndices(cellId: number): number[];
    hasBounced(index: number): number;
    /**
     * Initializes an element for CSS variable-based positioning.
     * Should be called once per element when it's added to the simulation.
     *
     * This marks the element with data-elastica attribute which:
     * - Applies the CSS transform rule using variables
     * - Sets will-change: transform once (not every frame)
     *
     * For canvas mode, this is a no-op when element is null/undefined.
     */
    initializeElement(element: HTMLElement | null | undefined): void;
    /**
     * Updates element position using CSS custom properties.
     *
     * Why setProperty over cssText:
     * - Shorter strings reduce GC pressure (~10 chars vs ~80 chars per update)
     * - No CSS parsing - just variable value updates
     * - Browser batches variable updates efficiently
     */
    setPosition(element: HTMLElement | null | undefined, { x, y, angle }: {
        x?: number;
        y?: number;
        angle?: number;
    }, index: number): void;
    setAngle(index: number, angle: number): void;
    setAngularVelocity(index: number, angularVelocity: number): void;
    setMass(index: number, mass: number): void;
    setRestitution(index: number, restitution: number): void;
    private getAABBState;
    private getOBBState;
    private getBorderState;
    update(elements: (ElementData | null | undefined)[], callback: (elastica: Elastica) => void): void;
}
