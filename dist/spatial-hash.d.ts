import type { Vector2D } from './types';
export interface SpatialHashContainer {
    width: number;
    height: number;
}
export declare class SpatialHash {
    private _gridSize;
    private buckets;
    private hashArray;
    private container;
    private largestExtent;
    private noSizeUpdates;
    constructor(gridSize: number);
    get gridSize(): number;
    set gridSize(v: number);
    /**
     * Set the largest body half-extent in the scene so effectiveGridSize can
     * auto-scale the cell size to guarantee the 3×3 neighborhood is sufficient.
     */
    setLargestExtent(v: number): void;
    /**
     * The grid size actually used for hashing.
     * When bodies are large relative to the container, the user-configured
     * gridSize is reduced so that a 3×3 cell neighborhood always encompasses
     * the full extent of any body, preventing missed collision pairs.
     */
    get effectiveGridSize(): number;
    setContainer(container: SpatialHashContainer): void;
    getHash(): number[];
    getBuckets(): Map<number, number[]>;
    computeCellId(pos: Vector2D): number;
    update(positions: Vector2D[], elementCount: number): void;
    getNeighborIndices(cellId: number): number[];
}
