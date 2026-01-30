import type { Vector2D } from './types';
export interface SpatialHashContainer {
    width: number;
    height: number;
}
export declare class SpatialHash {
    readonly gridSize: number;
    private buckets;
    private hashArray;
    private container;
    constructor(gridSize: number);
    setContainer(container: SpatialHashContainer): void;
    getHash(): number[];
    getBuckets(): Map<number, number[]>;
    computeCellId(pos: Vector2D): number;
    update(positions: Vector2D[], elementCount: number): void;
    getNeighborIndices(cellId: number): number[];
}
