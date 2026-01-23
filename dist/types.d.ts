export type Vector2D = [number, number];
export type ShapeType = 'rectangle' | 'circle';
export type BorderType = 'rigid' | 'periodic' | false;
export type ContainerOffsets = {
    top: number;
    bottom: number;
    left: number;
    right: number;
};
export type Container = {
    width: number;
    height: number;
};
export type ElementData = {
    element?: HTMLElement | null;
    rect: {
        width: number;
        height: number;
        left?: number;
        top?: number;
    };
    shape?: ShapeType;
};
export type ElasticaConfig = {
    gridSize?: number;
    containerOffsets?: Partial<ContainerOffsets>;
    collisions?: boolean;
    borders?: BorderType;
};
export type CollisionRecord = {
    loop: number;
    inHash: number;
};
export type PolarCoordinates = {
    speed: number;
    angle: number;
};
export type RigidBodyProperties = {
    mass: number;
    momentOfInertia: number;
    restitution: number;
};
export type ContactPoint = {
    point: Vector2D;
    normal: Vector2D;
    penetration: number;
};
export type CollisionResult = {
    collided: boolean;
    contact?: ContactPoint;
};
export type ElasticaConfigOBB = ElasticaConfig & {
    useOBB?: boolean;
    defaultMass?: number;
    defaultRestitution?: number;
};
