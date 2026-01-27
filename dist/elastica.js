(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Elastica = {}));
})(this, (function (exports) { 'use strict';

    /**
     * Handle rigid borders - bodies bounce off container edges
     */
    function handleRigidBorders(state, elementCount, onBounce) {
        const { container, containerOffsets } = state;
        const top = containerOffsets.top;
        const left = containerOffsets.left;
        const right = containerOffsets.right + 1;
        const bottom = containerOffsets.bottom + 1;
        for (let index = 0; index < elementCount; index++) {
            // Skip static elements
            if (state.isStatic[index])
                continue;
            const dimension = state.dimensions[index];
            const velocity = state.velocities[index];
            const position = state.positions[index];
            if (!dimension || !velocity || !position)
                continue;
            // Top wall
            if (position[1] < dimension[1] + container.height * top) {
                onBounce?.(index);
                state.velocities[index] = [velocity[0], -velocity[1]];
                state.positions[index] = [position[0], dimension[1] + container.height * top];
            }
            // Left wall
            if (position[0] < dimension[0] + container.width * left) {
                onBounce?.(index);
                state.velocities[index] = [-velocity[0], state.velocities[index][1]];
                state.positions[index] = [dimension[0] + container.width * left, state.positions[index][1]];
            }
            // Bottom wall
            if (position[1] > container.height * bottom - dimension[1]) {
                onBounce?.(index);
                state.velocities[index] = [state.velocities[index][0], -velocity[1]];
                state.positions[index] = [state.positions[index][0], container.height * bottom - dimension[1]];
            }
            // Right wall
            if (position[0] > container.width * right - dimension[0]) {
                onBounce?.(index);
                state.velocities[index] = [-velocity[0], state.velocities[index][1]];
                state.positions[index] = [container.width * right - dimension[0], state.positions[index][1]];
            }
        }
    }
    /**
     * Handle periodic borders - bodies wrap around container edges
     */
    function handlePeriodicBorders(state, elementCount) {
        const { container, containerOffsets } = state;
        const top = containerOffsets.top;
        const left = containerOffsets.left;
        const right = containerOffsets.right + 1;
        const bottom = containerOffsets.bottom + 1;
        for (let index = 0; index < elementCount; index++) {
            // Skip static elements
            if (state.isStatic[index])
                continue;
            const dimension = state.dimensions[index];
            const position = state.positions[index];
            const velocity = state.velocities[index];
            if (!dimension || !position || !velocity)
                continue;
            const dir = [Math.sign(velocity[0]), Math.sign(velocity[1])];
            // Top wall - wrap to bottom
            if (dir[1] === -1 && position[1] < dimension[1] + container.height * top) {
                state.positions[index] = [position[0], dimension[1] + container.height * bottom];
            }
            // Bottom wall - wrap to top
            if (dir[1] === 1 && position[1] > container.height * bottom - dimension[1]) {
                state.positions[index] = [state.positions[index][0], container.height * top - dimension[1]];
            }
            // Left wall - wrap to right
            if (dir[0] === -1 && position[0] < dimension[0] + container.width * left) {
                state.positions[index] = [dimension[0] + container.width * right, state.positions[index][1]];
            }
            // Right wall - wrap to left
            if (dir[0] === 1 && position[0] > container.width * right - dimension[0]) {
                state.positions[index] = [container.width * left - dimension[0], state.positions[index][1]];
            }
        }
    }

    /**
     * Threshold for using sort-and-sweep in dense buckets
     * Buckets with more elements than this will use sweep algorithm
     */
    const DENSE_BUCKET_THRESHOLD$1 = 16;
    /**
     * Sort-and-sweep algorithm for dense buckets
     * Sorts bodies by X-axis and uses early-exit to reduce pair checks
     * Returns pairs that potentially overlap on the X-axis
     */
    function sweepBucket(bucket, positions, dimensions) {
        if (bucket.length < 2)
            return [];
        // Build sortable entries with left edge position
        const entries = [];
        for (const idx of bucket) {
            const pos = positions[idx];
            const dim = dimensions[idx];
            if (pos && dim) {
                entries.push({
                    idx,
                    left: pos[0] - dim[0],
                    right: pos[0] + dim[0],
                });
            }
        }
        // Sort by left edge
        entries.sort((a, b) => a.left - b.left);
        const pairs = [];
        for (let i = 0; i < entries.length; i++) {
            const a = entries[i];
            const rightA = a.right;
            // Only check subsequent bodies until their left edge is past our right edge
            for (let j = i + 1; j < entries.length; j++) {
                const b = entries[j];
                // Early exit: if b's left edge is past a's right edge, no more overlaps possible
                if (b.left > rightA)
                    break;
                // Ensure consistent pair ordering (lower index first)
                if (a.idx < b.idx) {
                    pairs.push([a.idx, b.idx]);
                }
                else {
                    pairs.push([b.idx, a.idx]);
                }
            }
        }
        return pairs;
    }
    /**
     * Get neighbor cell IDs for a given cell (3x3 grid)
     * Returns array of valid cell IDs including the cell itself
     */
    function getNeighborCellIds(cellId, gridSize) {
        const cellX = cellId % gridSize;
        const cellY = Math.floor(cellId / gridSize);
        const neighbors = [];
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const nx = cellX + dx;
                const ny = cellY + dy;
                // Skip out-of-bounds cells
                if (nx < 0 || nx >= gridSize || ny < 0 || ny >= gridSize) {
                    continue;
                }
                neighbors.push(nx + ny * gridSize);
            }
        }
        return neighbors;
    }
    /**
     * Check if two AABBs are overlapping
     */
    function testAABB(state, indexA, indexB) {
        const dimA = state.dimensions[indexA];
        const posA = state.positions[indexA];
        const dimB = state.dimensions[indexB];
        const posB = state.positions[indexB];
        if (!dimA || !posA || !dimB || !posB) {
            return false;
        }
        const overlapX = Math.abs(posA[0] - posB[0]) < dimA[0] + dimB[0];
        const overlapY = Math.abs(posA[1] - posB[1]) < dimA[1] + dimB[1];
        return overlapX && overlapY;
    }
    /**
     * Calculate the superposition/exclusion force between two overlapping AABBs
     * Returns a force vector to push bodies apart
     */
    function calculateSuperposition(state, indexA, indexB) {
        const posA = state.positions[indexA];
        const dimA = state.dimensions[indexA];
        const posB = state.positions[indexB];
        const dimB = state.dimensions[indexB];
        if (!posA || !dimA || !posB || !dimB) {
            return [0, 0];
        }
        const overlapX = dimA[0] + dimB[0] - Math.abs(posA[0] - posB[0]);
        const overlapY = dimA[1] + dimB[1] - Math.abs(posA[1] - posB[1]);
        const dirX = -Math.sign(posA[0] - posB[0]);
        const dirY = -Math.sign(posA[1] - posB[1]);
        return [
            dirX * Math.max(1 / overlapX, 0.5),
            dirY * Math.max(1 / overlapY, 0.5),
        ];
    }
    /**
     * Resolve AABB collision with energy conservation
     * Swaps velocities and scales to conserve kinetic energy
     */
    function resolveAABBCollision(state, indexA, indexB) {
        const velA = state.velocities[indexA];
        const velB = state.velocities[indexB];
        if (!velA || !velB)
            return;
        const isStaticA = state.isStatic[indexA] ?? false;
        const isStaticB = state.isStatic[indexB] ?? false;
        // Skip if both are static
        if (isStaticA && isStaticB)
            return;
        // Calculate exclusion force
        const exclusionForce = calculateSuperposition(state, indexA, indexB);
        // Handle static-dynamic collision
        if (isStaticA || isStaticB) {
            if (isStaticA) {
                // A is static, B is dynamic - apply double force to B and reverse it
                const newVelB = [
                    velB[0] - exclusionForce[0] * 2,
                    velB[1] - exclusionForce[1] * 2,
                ];
                state.velocities[indexB] = newVelB;
                // Keep A's velocity unchanged (it's static)
            }
            else {
                // B is static, A is dynamic - apply double force to A
                const newVelA = [
                    velA[0] + exclusionForce[0] * 2,
                    velA[1] + exclusionForce[1] * 2,
                ];
                state.velocities[indexA] = newVelA;
                // Keep B's velocity unchanged (it's static)
            }
            return;
        }
        // Both are dynamic - original behavior
        // Calculate initial kinetic energy (assuming equal masses)
        const initialKE = 0.5 * (velA[0] * velA[0] + velA[1] * velA[1] + velB[0] * velB[0] + velB[1] * velB[1]);
        // Apply exclusion force to velocities
        let newVelA = [
            velA[0] + exclusionForce[0],
            velA[1] + exclusionForce[1],
        ];
        let newVelB = [
            velB[0] - exclusionForce[0],
            velB[1] - exclusionForce[1],
        ];
        // Calculate final kinetic energy
        const finalKE = 0.5 * (newVelA[0] * newVelA[0] + newVelA[1] * newVelA[1] +
            newVelB[0] * newVelB[0] + newVelB[1] * newVelB[1]);
        // Scale to conserve energy
        if (finalKE !== 0) {
            const scale = Math.sqrt(initialKE / finalKE);
            newVelA = [newVelA[0] * scale, newVelA[1] * scale];
            newVelB = [newVelB[0] * scale, newVelB[1] * scale];
        }
        // Swap velocities (this creates the "bouncing" effect)
        state.velocities[indexA] = newVelB;
        state.velocities[indexB] = newVelA;
    }
    /**
     * Process a collision pair - test, record, and resolve
     */
    function processCollisionPair(state, indexA, indexB, checkedPairs, collisionsList, onCollision) {
        const velA = state.velocities[indexA];
        const velB = state.velocities[indexB];
        if (!velA || !velB)
            return;
        // Create pair key to avoid duplicate checks (bitwise encoding, no allocation)
        const pairKey = (indexA << 16) | indexB;
        if (checkedPairs.has(pairKey))
            return;
        checkedPairs.add(pairKey);
        // Test for collision
        if (!testAABB(state, indexA, indexB))
            return;
        // Record collision
        collisionsList.push({ loop: indexA, inHash: indexB });
        // Callback for bounce tracking
        onCollision?.(indexA, indexB);
        // Resolve collision
        resolveAABBCollision(state, indexA, indexB);
    }
    /**
     * Detect and resolve all AABB collisions
     * Uses spatial hash buckets for O(n×k) complexity instead of O(n²)
     * Dense buckets use sort-and-sweep for additional optimization
     */
    function detectAndResolveAABB(state, elementCount, onCollision) {
        const collisionsList = [];
        // Track checked pairs to avoid duplicate checks
        // Uses bitwise encoding: (indexA << 16) | indexB for zero-allocation pair keys
        const checkedPairs = new Set();
        // Track which buckets we've already processed with sweep
        const sweptBuckets = new Set();
        for (let indexA = 0; indexA < elementCount; indexA++) {
            const velA = state.velocities[indexA];
            if (!velA)
                continue;
            const cellIdA = state.hash[indexA];
            if (cellIdA === undefined)
                continue;
            // Get all neighbor cell IDs
            const neighborCells = getNeighborCellIds(cellIdA, state.gridSize);
            // Check elements in neighboring cells only
            for (const neighborCellId of neighborCells) {
                const bucket = state.buckets.get(neighborCellId);
                if (!bucket)
                    continue;
                // Dense bucket: use sort-and-sweep algorithm
                if (bucket.length > DENSE_BUCKET_THRESHOLD$1) {
                    // Only sweep each dense bucket once
                    if (sweptBuckets.has(neighborCellId))
                        continue;
                    sweptBuckets.add(neighborCellId);
                    const sweepPairs = sweepBucket(bucket, state.positions, state.dimensions);
                    for (const [idxA, idxB] of sweepPairs) {
                        processCollisionPair(state, idxA, idxB, checkedPairs, collisionsList, onCollision);
                    }
                    continue;
                }
                // Sparse bucket: simple iteration
                for (const indexB of bucket) {
                    // Skip self and ensure we only check each pair once (lower index first)
                    if (indexA >= indexB)
                        continue;
                    processCollisionPair(state, indexA, indexB, checkedPairs, collisionsList, onCollision);
                }
            }
        }
        return collisionsList;
    }

    /**
     * Convert a vector to polar coordinates (speed and angle)
     */
    function toPolar(vector) {
        const speed = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
        const angle = Math.atan2(vector[1], vector[0]);
        return { speed, angle };
    }
    /**
     * Convert polar coordinates to a cartesian vector
     */
    function toCartesian(speed, angle) {
        return [speed * Math.cos(angle), speed * Math.sin(angle)];
    }
    /**
     * Calculate dot product of two vectors
     */
    function dot(a, b) {
        return a[0] * b[0] + a[1] * b[1];
    }
    /**
     * Calculate 2D cross product (returns scalar)
     * Result is the z-component of the 3D cross product
     */
    function cross(a, b) {
        return a[0] * b[1] - a[1] * b[0];
    }
    /**
     * Calculate the magnitude (length) of a vector
     */
    function magnitude(v) {
        return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
    }
    /**
     * Calculate squared magnitude (avoids sqrt for comparisons)
     */
    function magnitudeSquared(v) {
        return v[0] * v[0] + v[1] * v[1];
    }
    /**
     * Normalize a vector to unit length
     */
    function normalize(v) {
        const mag = magnitude(v);
        if (mag === 0)
            return [0, 0];
        return [v[0] / mag, v[1] / mag];
    }
    /**
     * Add two vectors
     */
    function add(a, b) {
        return [a[0] + b[0], a[1] + b[1]];
    }
    /**
     * Subtract vector b from vector a
     */
    function subtract(a, b) {
        return [a[0] - b[0], a[1] - b[1]];
    }
    /**
     * Scale a vector by a scalar
     */
    function scale(v, s) {
        return [v[0] * s, v[1] * s];
    }
    /**
     * Negate a vector
     */
    function negate(v) {
        return [-v[0], -v[1]];
    }
    /**
     * Rotate a point around the origin by an angle (radians)
     */
    function rotate(point, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return [
            point[0] * cos - point[1] * sin,
            point[0] * sin + point[1] * cos,
        ];
    }
    /**
     * Rotate a point around a center by an angle (radians)
     */
    function rotateAround(point, center, angle) {
        const translated = [point[0] - center[0], point[1] - center[1]];
        const rotated = rotate(translated, angle);
        return [rotated[0] + center[0], rotated[1] + center[1]];
    }
    /**
     * Calculate perpendicular vector (rotate 90 degrees counter-clockwise)
     */
    function perpendicular(v) {
        return [-v[1], v[0]];
    }
    /**
     * Linear interpolation between two vectors
     */
    function lerp(a, b, t) {
        return [
            a[0] + (b[0] - a[0]) * t,
            a[1] + (b[1] - a[1]) * t,
        ];
    }
    /**
     * Calculate distance between two points
     */
    function distance(a, b) {
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        return Math.sqrt(dx * dx + dy * dy);
    }
    /**
     * Calculate squared distance between two points (avoids sqrt)
     */
    function distanceSquared(a, b) {
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        return dx * dx + dy * dy;
    }

    /**
     * Simple object pool for Vector2D arrays to reduce GC pressure in hot paths.
     *
     * USAGE:
     *   const vec = vectorPool.acquire()   // Get a [0, 0] vector
     *   vec[0] = x; vec[1] = y             // Use it
     *   vectorPool.release(vec)            // Return it when done
     *
     * IMPORTANT: Only use for temporary calculations within a single function.
     * Do not store pooled vectors in state - they will be reused!
     */
    class VectorPool {
        constructor(initialSize = 64, maxSize = 256) {
            this.pool = [];
            this.maxSize = maxSize;
            // Pre-allocate initial vectors
            for (let i = 0; i < initialSize; i++) {
                this.pool.push([0, 0]);
            }
        }
        /**
         * Get a vector from the pool (or create a new one if empty)
         * Vector is reset to [0, 0]
         */
        acquire() {
            if (this.pool.length > 0) {
                const vec = this.pool.pop();
                vec[0] = 0;
                vec[1] = 0;
                return vec;
            }
            return [0, 0];
        }
        /**
         * Return a vector to the pool for reuse
         */
        release(vec) {
            if (this.pool.length < this.maxSize) {
                this.pool.push(vec);
            }
            // If pool is full, let GC collect it
        }
        /**
         * Get current pool size (for debugging)
         */
        get size() {
            return this.pool.length;
        }
    }
    /**
     * Pool for 4-corner arrays used in OBB collision detection
     */
    class CornersPool {
        constructor(initialSize = 32, maxSize = 128) {
            this.pool = [];
            this.maxSize = maxSize;
            for (let i = 0; i < initialSize; i++) {
                this.pool.push([[0, 0], [0, 0], [0, 0], [0, 0]]);
            }
        }
        acquire() {
            if (this.pool.length > 0) {
                const corners = this.pool.pop();
                // Reset all corners
                for (let i = 0; i < 4; i++) {
                    corners[i][0] = 0;
                    corners[i][1] = 0;
                }
                return corners;
            }
            return [[0, 0], [0, 0], [0, 0], [0, 0]];
        }
        release(corners) {
            if (this.pool.length < this.maxSize) {
                this.pool.push(corners);
            }
        }
        get size() {
            return this.pool.length;
        }
    }
    /**
     * Pool for axes arrays used in SAT collision test
     * Each axes array holds 4 Vector2D (2 from each OBB)
     */
    class AxesPool {
        constructor(initialSize = 32, maxSize = 128) {
            this.pool = [];
            this.maxSize = maxSize;
            for (let i = 0; i < initialSize; i++) {
                this.pool.push([[0, 0], [0, 0], [0, 0], [0, 0]]);
            }
        }
        acquire() {
            if (this.pool.length > 0) {
                const axes = this.pool.pop();
                // Reset axes
                for (let i = 0; i < 4; i++) {
                    axes[i][0] = 0;
                    axes[i][1] = 0;
                }
                return axes;
            }
            return [[0, 0], [0, 0], [0, 0], [0, 0]];
        }
        release(axes) {
            if (this.pool.length < this.maxSize && axes.length === 4) {
                this.pool.push(axes);
            }
        }
        get size() {
            return this.pool.length;
        }
    }
    // Global pool instances
    new VectorPool();
    const cornersPool = new CornersPool();
    const axesPool = new AxesPool();

    /**
     * Circle vs Circle collision detection
     * Uses squared distance comparison to avoid sqrt in the common (non-colliding) case
     *
     * @returns CollisionResult with contact point on circle A's surface toward B
     */
    function circleVsCircle(state, indexA, indexB) {
        const posA = state.positions[indexA];
        const posB = state.positions[indexB];
        const dimA = state.dimensions[indexA];
        const dimB = state.dimensions[indexB];
        if (!posA || !posB || !dimA || !dimB) {
            return { collided: false };
        }
        // For circles, dimensions[0] stores the radius
        const radiusA = dimA[0];
        const radiusB = dimB[0];
        const radiusSum = radiusA + radiusB;
        const radiusSumSq = radiusSum * radiusSum;
        const distSq = distanceSquared(posA, posB);
        // No collision if distance squared is greater than combined radii squared
        if (distSq > radiusSumSq) {
            return { collided: false };
        }
        // Calculate actual distance only when collision detected
        const dist = Math.sqrt(distSq);
        // Handle degenerate case: circles at same position
        if (dist < 0.0001) {
            // Use arbitrary direction (positive X) when centers coincide
            const normal = [1, 0];
            const contactPoint = [posA[0] + radiusA, posA[1]];
            const penetration = radiusSum;
            const contact = {
                point: contactPoint,
                normal: normal,
                penetration: penetration,
            };
            return { collided: true, contact };
        }
        // Normal pointing from A to B
        const nx = (posB[0] - posA[0]) / dist;
        const ny = (posB[1] - posA[1]) / dist;
        const normal = [nx, ny];
        // Contact point on circle A's surface (toward B)
        const contactPoint = [
            posA[0] + nx * radiusA,
            posA[1] + ny * radiusA,
        ];
        // Penetration depth
        const penetration = radiusSum - dist;
        const contact = {
            point: contactPoint,
            normal: normal,
            penetration: penetration,
        };
        return { collided: true, contact };
    }
    /**
     * Circle vs AABB (Axis-Aligned Bounding Box) collision detection
     * Used when the rectangle has no rotation (angle === 0)
     *
     * Algorithm:
     * 1. Find closest point on AABB to circle center
     * 2. Check if distance from closest point to center is less than radius
     *
     * @returns CollisionResult with contact point and normal
     */
    function circleVsAABB(state, circleIndex, rectIndex) {
        const circlePos = state.positions[circleIndex];
        const rectPos = state.positions[rectIndex];
        const circleDim = state.dimensions[circleIndex];
        const rectDim = state.dimensions[rectIndex];
        if (!circlePos || !rectPos || !circleDim || !rectDim) {
            return { collided: false };
        }
        const radius = circleDim[0];
        const halfWidth = rectDim[0];
        const halfHeight = rectDim[1];
        // AABB bounds
        const rectLeft = rectPos[0] - halfWidth;
        const rectRight = rectPos[0] + halfWidth;
        const rectTop = rectPos[1] - halfHeight;
        const rectBottom = rectPos[1] + halfHeight;
        // Find closest point on AABB to circle center (clamp circle center to AABB bounds)
        const closestX = Math.max(rectLeft, Math.min(circlePos[0], rectRight));
        const closestY = Math.max(rectTop, Math.min(circlePos[1], rectBottom));
        // Calculate distance from closest point to circle center
        const dx = circlePos[0] - closestX;
        const dy = circlePos[1] - closestY;
        const distSq = dx * dx + dy * dy;
        const radiusSq = radius * radius;
        // Check if circle center is inside AABB
        const centerInside = circlePos[0] >= rectLeft &&
            circlePos[0] <= rectRight &&
            circlePos[1] >= rectTop &&
            circlePos[1] <= rectBottom;
        // No collision if distance is greater than radius and center is outside
        if (distSq > radiusSq && !centerInside) {
            return { collided: false };
        }
        let normal;
        let penetration;
        let contactPoint;
        if (centerInside) {
            // Circle center is inside AABB - find closest edge
            // Normal should point from rect toward circle (consistent with outside case)
            // Since center is inside, normal points from closest edge toward center
            const distToLeft = circlePos[0] - rectLeft;
            const distToRight = rectRight - circlePos[0];
            const distToTop = circlePos[1] - rectTop;
            const distToBottom = rectBottom - circlePos[1];
            const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
            if (minDist === distToLeft) {
                normal = [1, 0]; // Point RIGHT (toward circle center from left edge)
                penetration = radius + distToLeft;
                contactPoint = [rectLeft, circlePos[1]];
            }
            else if (minDist === distToRight) {
                normal = [-1, 0]; // Point LEFT (toward circle center from right edge)
                penetration = radius + distToRight;
                contactPoint = [rectRight, circlePos[1]];
            }
            else if (minDist === distToTop) {
                normal = [0, 1]; // Point DOWN (toward circle center from top edge)
                penetration = radius + distToTop;
                contactPoint = [circlePos[0], rectTop];
            }
            else {
                normal = [0, -1]; // Point UP (toward circle center from bottom edge)
                penetration = radius + distToBottom;
                contactPoint = [circlePos[0], rectBottom];
            }
        }
        else {
            // Circle center is outside AABB
            const dist = Math.sqrt(distSq);
            // Handle edge case: closest point is exactly at circle center
            if (dist < 0.0001) {
                normal = [1, 0];
                penetration = radius;
                contactPoint = [closestX, closestY];
            }
            else {
                // Normal points from closest point to circle center (outward from rect)
                normal = [dx / dist, dy / dist];
                penetration = radius - dist;
                contactPoint = [closestX, closestY];
            }
        }
        const contact = {
            point: contactPoint,
            normal: normal,
            penetration: penetration,
        };
        return { collided: true, contact };
    }
    /**
     * Circle vs OBB (Oriented Bounding Box) collision detection
     * Handles rotated rectangles by transforming to local space
     *
     * Algorithm:
     * 1. Transform circle center to OBB's local coordinate space (rotate by -angle)
     * 2. Perform AABB check in local space
     * 3. Transform contact normal back to world space
     *
     * @returns CollisionResult with contact point and normal in world space
     */
    function circleVsOBB(state, circleIndex, rectIndex) {
        const circlePos = state.positions[circleIndex];
        const rectPos = state.positions[rectIndex];
        const circleDim = state.dimensions[circleIndex];
        const rectDim = state.dimensions[rectIndex];
        const rectAngle = state.angles[rectIndex];
        if (!circlePos || !rectPos || !circleDim || !rectDim || rectAngle === undefined) {
            return { collided: false };
        }
        // If no rotation, use simpler AABB check
        if (rectAngle === 0) {
            return circleVsAABB(state, circleIndex, rectIndex);
        }
        const radius = circleDim[0];
        const halfWidth = rectDim[0];
        const halfHeight = rectDim[1];
        // Transform circle center to OBB local space
        // Translate to OBB center, then rotate by -angle
        const relX = circlePos[0] - rectPos[0];
        const relY = circlePos[1] - rectPos[1];
        const cos = Math.cos(-rectAngle);
        const sin = Math.sin(-rectAngle);
        // Circle center in local space (OBB is now axis-aligned)
        const localX = relX * cos - relY * sin;
        const localY = relX * sin + relY * cos;
        // Find closest point on local AABB to local circle center
        const closestX = Math.max(-halfWidth, Math.min(localX, halfWidth));
        const closestY = Math.max(-halfHeight, Math.min(localY, halfHeight));
        // Calculate distance from closest point to circle center in local space
        const dx = localX - closestX;
        const dy = localY - closestY;
        const distSq = dx * dx + dy * dy;
        const radiusSq = radius * radius;
        // Check if circle center is inside local AABB
        const centerInside = localX >= -halfWidth &&
            localX <= halfWidth &&
            localY >= -halfHeight &&
            localY <= halfHeight;
        // No collision if distance is greater than radius and center is outside
        if (distSq > radiusSq && !centerInside) {
            return { collided: false };
        }
        let localNormal;
        let penetration;
        let localContact;
        if (centerInside) {
            // Circle center is inside OBB - find closest edge in local space
            // Normal should point from rect toward circle (consistent with outside case)
            // Since center is inside, normal points from closest edge toward center
            const distToLeft = localX - (-halfWidth);
            const distToRight = halfWidth - localX;
            const distToTop = localY - (-halfHeight);
            const distToBottom = halfHeight - localY;
            const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
            if (minDist === distToLeft) {
                localNormal = [1, 0]; // Point RIGHT (toward circle center from left edge)
                penetration = radius + distToLeft;
                localContact = [-halfWidth, localY];
            }
            else if (minDist === distToRight) {
                localNormal = [-1, 0]; // Point LEFT (toward circle center from right edge)
                penetration = radius + distToRight;
                localContact = [halfWidth, localY];
            }
            else if (minDist === distToTop) {
                localNormal = [0, 1]; // Point DOWN (toward circle center from top edge)
                penetration = radius + distToTop;
                localContact = [localX, -halfHeight];
            }
            else {
                localNormal = [0, -1]; // Point UP (toward circle center from bottom edge)
                penetration = radius + distToBottom;
                localContact = [localX, halfHeight];
            }
        }
        else {
            // Circle center is outside local AABB
            const dist = Math.sqrt(distSq);
            if (dist < 0.0001) {
                localNormal = [1, 0];
                penetration = radius;
                localContact = [closestX, closestY];
            }
            else {
                localNormal = [dx / dist, dy / dist];
                penetration = radius - dist;
                localContact = [closestX, closestY];
            }
        }
        // Transform normal back to world space (rotate by +angle)
        const cosWorld = Math.cos(rectAngle);
        const sinWorld = Math.sin(rectAngle);
        const worldNormal = [
            localNormal[0] * cosWorld - localNormal[1] * sinWorld,
            localNormal[0] * sinWorld + localNormal[1] * cosWorld,
        ];
        // Transform contact point back to world space
        const worldContact = [
            rectPos[0] + localContact[0] * cosWorld - localContact[1] * sinWorld,
            rectPos[1] + localContact[0] * sinWorld + localContact[1] * cosWorld,
        ];
        const contact = {
            point: worldContact,
            normal: worldNormal,
            penetration: penetration,
        };
        return { collided: true, contact };
    }

    /**
     * Threshold for using sort-and-sweep in dense buckets
     */
    const DENSE_BUCKET_THRESHOLD = 16;
    /**
     * Get the four corners of a rotated rectangle (OBB)
     * Returns corners in order: top-left, top-right, bottom-right, bottom-left
     *
     * @param corners - Optional pre-allocated corners array to fill (from pool)
     * @returns The corners array, or null if invalid state
     */
    function getOBBCorners(state, index, corners) {
        const position = state.positions[index];
        const dimension = state.dimensions[index];
        const angle = state.angles[index];
        if (!position || !dimension || angle === undefined)
            return null;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const hw = dimension[0];
        const hh = dimension[1];
        // Local corner offsets (unrotated): TL, TR, BR, BL
        const localX = [-hw, hw, hw, -hw];
        const localY = [-hh, -hh, hh, hh];
        // Use provided corners or allocate new ones
        const result = corners ?? cornersPool.acquire();
        // Rotate and translate to world coordinates (no .map() allocation)
        for (let i = 0; i < 4; i++) {
            const lx = localX[i];
            const ly = localY[i];
            result[i][0] = position[0] + lx * cos - ly * sin;
            result[i][1] = position[1] + lx * sin + ly * cos;
        }
        return result;
    }
    /**
     * Get the two edge normals (axes) for SAT collision test
     */
    function getOBBAxes(state, index) {
        const angle = state.angles[index];
        if (angle === undefined)
            return null;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return [
            [cos, sin],
            [-sin, cos],
        ];
    }
    /**
     * Project an OBB onto an axis and return the min/max projection values
     */
    function projectOBBOntoAxis(state, index, axis) {
        const corners = getOBBCorners(state, index);
        if (!corners)
            return null;
        let min = Infinity;
        let max = -Infinity;
        for (const corner of corners) {
            const projection = corner[0] * axis[0] + corner[1] * axis[1];
            min = Math.min(min, projection);
            max = Math.max(max, projection);
        }
        return [min, max];
    }
    /**
     * SAT (Separating Axis Theorem) collision test between two OBBs
     * Uses object pooling to minimize allocations in hot path.
     */
    function satCollisionTest(state, indexA, indexB) {
        const axesA = getOBBAxes(state, indexA);
        const axesB = getOBBAxes(state, indexB);
        if (!axesA || !axesB) {
            return { collided: false };
        }
        // Use pooled axes array instead of spread allocation
        const axes = axesPool.acquire();
        axes[0][0] = axesA[0][0];
        axes[0][1] = axesA[0][1];
        axes[1][0] = axesA[1][0];
        axes[1][1] = axesA[1][1];
        axes[2][0] = axesB[0][0];
        axes[2][1] = axesB[0][1];
        axes[3][0] = axesB[1][0];
        axes[3][1] = axesB[1][1];
        let minOverlap = Infinity;
        let minOverlapAxis = null;
        for (const axis of axes) {
            const projA = projectOBBOntoAxis(state, indexA, axis);
            const projB = projectOBBOntoAxis(state, indexB, axis);
            if (!projA || !projB) {
                axesPool.release(axes);
                return { collided: false };
            }
            const overlap = Math.min(projA[1], projB[1]) - Math.max(projA[0], projB[0]);
            if (overlap <= 0) {
                axesPool.release(axes);
                return { collided: false };
            }
            if (overlap < minOverlap) {
                minOverlap = overlap;
                minOverlapAxis = axis;
            }
        }
        // Release axes - we've extracted what we need (minOverlapAxis values)
        const savedAxisX = minOverlapAxis ? minOverlapAxis[0] : 0;
        const savedAxisY = minOverlapAxis ? minOverlapAxis[1] : 0;
        axesPool.release(axes);
        if (!minOverlapAxis) {
            return { collided: false };
        }
        const posA = state.positions[indexA];
        const posB = state.positions[indexB];
        if (!posA || !posB) {
            return { collided: false };
        }
        // Ensure normal points from A to B
        const centerDiffX = posB[0] - posA[0];
        const centerDiffY = posB[1] - posA[1];
        const dot = centerDiffX * savedAxisX + centerDiffY * savedAxisY;
        const normal = dot < 0
            ? [-savedAxisX, -savedAxisY]
            : [savedAxisX, savedAxisY];
        // Contact point at midpoint between centers
        const contactPoint = [
            (posA[0] + posB[0]) / 2,
            (posA[1] + posB[1]) / 2,
        ];
        const contact = {
            point: contactPoint,
            normal: normal,
            penetration: minOverlap,
        };
        return { collided: true, contact };
    }
    /**
     * Check if two OBBs are potentially close enough to collide (broad phase)
     * Used as secondary filter after spatial hash for rotated boxes
     * Uses cached maxExtents to avoid sqrt calculations every frame
     */
    function isOBBNeighbor(state, indexA, indexB) {
        const posA = state.positions[indexA];
        const posB = state.positions[indexB];
        const maxExtentA = state.maxExtents[indexA];
        const maxExtentB = state.maxExtents[indexB];
        if (!posA || !posB || maxExtentA === undefined || maxExtentB === undefined)
            return false;
        // Use cached diagonal extents instead of recalculating sqrt each frame
        const maxDist = maxExtentA + maxExtentB;
        const maxDistSquared = maxDist * maxDist;
        return distanceSquared(posA, posB) <= maxDistSquared;
    }
    /**
     * Calculate kinetic energy (linear + rotational) for a body
     */
    function getKineticEnergy(state, index) {
        const velocity = state.velocities[index];
        const angularVelocity = state.angularVelocities[index];
        const mass = state.masses[index];
        const inertia = state.momentsOfInertia[index];
        if (!velocity || angularVelocity === undefined || mass === undefined || inertia === undefined) {
            return 0;
        }
        const linearKE = 0.5 * mass * (velocity[0] * velocity[0] + velocity[1] * velocity[1]);
        const rotationalKE = 0.5 * inertia * angularVelocity * angularVelocity;
        return linearKE + rotationalKE;
    }
    /**
     * Resolve OBB collision with energy conservation
     *
     * PERF NOTE: Creates multiple Vector2D arrays per collision resolution.
     * For high collision counts, consider mutating in-place or using object pooling.
     */
    function resolveOBBCollision(state, indexA, indexB, contact) {
        const posA = state.positions[indexA];
        const posB = state.positions[indexB];
        const velA = state.velocities[indexA];
        const velB = state.velocities[indexB];
        const massA = state.masses[indexA];
        const massB = state.masses[indexB];
        const inertiaA = state.momentsOfInertia[indexA];
        const inertiaB = state.momentsOfInertia[indexB];
        const angVelA = state.angularVelocities[indexA];
        const angVelB = state.angularVelocities[indexB];
        const restA = state.restitutions[indexA];
        const restB = state.restitutions[indexB];
        if (!posA || !posB || !velA || !velB ||
            massA === undefined || massB === undefined ||
            inertiaA === undefined || inertiaB === undefined ||
            angVelA === undefined || angVelB === undefined ||
            restA === undefined || restB === undefined) {
            return;
        }
        const isStaticA = state.isStatic[indexA] ?? false;
        const isStaticB = state.isStatic[indexB] ?? false;
        // Skip if both are static
        if (isStaticA && isStaticB)
            return;
        const { normal, penetration } = contact;
        const restitution = Math.min(restA, restB);
        const overlapForce = Math.max(penetration, 1);
        const repulsionStrength = 1 / overlapForce;
        const { slop, percent } = state;
        // Handle static-dynamic collision
        if (isStaticA || isStaticB) {
            if (isStaticA) {
                // A is static, B is dynamic
                const initialKE = getKineticEnergy(state, indexB);
                const newVelB = [
                    velB[0] + normal[0] * repulsionStrength * 2,
                    velB[1] + normal[1] * repulsionStrength * 2,
                ];
                const contactPoint = [(posA[0] + posB[0]) / 2, (posA[1] + posB[1]) / 2];
                const rBx = contactPoint[0] - posB[0];
                const rBy = contactPoint[1] - posB[1];
                const torqueB = rBx * (normal[1] * repulsionStrength * 2) - rBy * (normal[0] * repulsionStrength * 2);
                const dt = state.deltaTime;
                const newAngVelB = angVelB + (torqueB / inertiaB) / dt;
                state.velocities[indexB] = newVelB;
                state.angularVelocities[indexB] = newAngVelB;
                const finalKE = getKineticEnergy(state, indexB);
                if (finalKE > 0) {
                    const targetKE = initialKE * restitution;
                    const scale = Math.sqrt(targetKE / finalKE);
                    state.velocities[indexB] = [newVelB[0] * scale, newVelB[1] * scale];
                    state.angularVelocities[indexB] = newAngVelB * scale;
                }
                // Position correction
                if (penetration > slop) {
                    const correction = (penetration - slop) * percent;
                    state.positions[indexB] = [
                        posB[0] + normal[0] * correction,
                        posB[1] + normal[1] * correction,
                    ];
                }
            }
            else {
                // B is static, A is dynamic
                const initialKE = getKineticEnergy(state, indexA);
                const newVelA = [
                    velA[0] - normal[0] * repulsionStrength * 2,
                    velA[1] - normal[1] * repulsionStrength * 2,
                ];
                const contactPoint = [(posA[0] + posB[0]) / 2, (posA[1] + posB[1]) / 2];
                const rAx = contactPoint[0] - posA[0];
                const rAy = contactPoint[1] - posA[1];
                const torqueA = rAx * (-normal[1] * repulsionStrength * 2) - rAy * (-normal[0] * repulsionStrength * 2);
                const dt = state.deltaTime;
                const newAngVelA = angVelA + (torqueA / inertiaA) / dt;
                state.velocities[indexA] = newVelA;
                state.angularVelocities[indexA] = newAngVelA;
                const finalKE = getKineticEnergy(state, indexA);
                if (finalKE > 0) {
                    const targetKE = initialKE * restitution;
                    const scale = Math.sqrt(targetKE / finalKE);
                    state.velocities[indexA] = [newVelA[0] * scale, newVelA[1] * scale];
                    state.angularVelocities[indexA] = newAngVelA * scale;
                }
                // Position correction
                if (penetration > slop) {
                    const correction = (penetration - slop) * percent;
                    state.positions[indexA] = [
                        posA[0] - normal[0] * correction,
                        posA[1] - normal[1] * correction,
                    ];
                }
            }
            return;
        }
        // Both are dynamic
        const initialKE = getKineticEnergy(state, indexA) + getKineticEnergy(state, indexB);
        const newVelA = [
            velA[0] - normal[0] * repulsionStrength,
            velA[1] - normal[1] * repulsionStrength,
        ];
        const newVelB = [
            velB[0] + normal[0] * repulsionStrength,
            velB[1] + normal[1] * repulsionStrength,
        ];
        const contactPoint = [(posA[0] + posB[0]) / 2, (posA[1] + posB[1]) / 2];
        const rAx = contactPoint[0] - posA[0];
        const rAy = contactPoint[1] - posA[1];
        const rBx = contactPoint[0] - posB[0];
        const rBy = contactPoint[1] - posB[1];
        const torqueA = rAx * (-normal[1] * repulsionStrength) - rAy * (-normal[0] * repulsionStrength);
        const torqueB = rBx * (normal[1] * repulsionStrength) - rBy * (normal[0] * repulsionStrength);
        // Divide by dt to convert impulse units: integration multiplies by dt, so this cancels out
        const dt = state.deltaTime;
        const newAngVelA = angVelA + (torqueA / inertiaA) / dt;
        const newAngVelB = angVelB + (torqueB / inertiaB) / dt;
        state.velocities[indexA] = newVelA;
        state.velocities[indexB] = newVelB;
        state.angularVelocities[indexA] = newAngVelA;
        state.angularVelocities[indexB] = newAngVelB;
        const finalKE = getKineticEnergy(state, indexA) + getKineticEnergy(state, indexB);
        if (finalKE > 0) {
            const targetKE = initialKE * restitution;
            const scale = Math.sqrt(targetKE / finalKE);
            state.velocities[indexA] = [newVelA[0] * scale, newVelA[1] * scale];
            state.velocities[indexB] = [newVelB[0] * scale, newVelB[1] * scale];
            state.angularVelocities[indexA] = newAngVelA * scale;
            state.angularVelocities[indexB] = newAngVelB * scale;
        }
        // Position correction
        if (penetration > slop) {
            const correction = (penetration - slop) * percent;
            const totalMass = massA + massB;
            state.positions[indexA] = [
                posA[0] - normal[0] * correction * (massB / totalMass),
                posA[1] - normal[1] * correction * (massB / totalMass),
            ];
            state.positions[indexB] = [
                posB[0] + normal[0] * correction * (massA / totalMass),
                posB[1] + normal[1] * correction * (massA / totalMass),
            ];
        }
    }
    /**
     * Perform narrow-phase collision test based on shape types
     * Dispatches to appropriate collision function for each shape combination
     */
    function shapeCollisionTest(state, indexA, indexB) {
        const shapeA = state.shapeTypes[indexA] ?? 'rectangle';
        const shapeB = state.shapeTypes[indexB] ?? 'rectangle';
        // Circle vs Circle
        if (shapeA === 'circle' && shapeB === 'circle') {
            return circleVsCircle(state, indexA, indexB);
        }
        // Circle vs Rectangle (OBB)
        // circleVsOBB returns normal pointing from rect toward circle
        // Here: A=circle, B=rect, so normal points B→A, need to flip to A→B
        if (shapeA === 'circle' && shapeB === 'rectangle') {
            const result = circleVsOBB(state, indexA, indexB);
            if (result.collided && result.contact) {
                result.contact.normal = [-result.contact.normal[0], -result.contact.normal[1]];
            }
            return result;
        }
        // Rectangle vs Circle
        // Here: A=rect, B=circle, so circleVsOBB(B, A) gives normal from A→B, which is correct
        if (shapeA === 'rectangle' && shapeB === 'circle') {
            return circleVsOBB(state, indexB, indexA);
        }
        // Rectangle vs Rectangle - use SAT
        return satCollisionTest(state, indexA, indexB);
    }
    /**
     * Process an OBB collision pair - test, record, and resolve
     */
    function processOBBCollisionPair(state, indexA, indexB, checkedPairs, collisionsList, onCollision) {
        const velA = state.velocities[indexA];
        const velB = state.velocities[indexB];
        if (!velA || !velB)
            return;
        // Create pair key to avoid duplicate checks (bitwise encoding, no allocation)
        const pairKey = (indexA << 16) | indexB;
        if (checkedPairs.has(pairKey))
            return;
        checkedPairs.add(pairKey);
        // Broad phase distance check (for rotated boxes that may span cells)
        if (!isOBBNeighbor(state, indexA, indexB))
            return;
        // Narrow phase collision test (dispatches based on shape types)
        const result = shapeCollisionTest(state, indexA, indexB);
        if (!result.collided || !result.contact)
            return;
        collisionsList.push({ loop: indexA, inHash: indexB });
        onCollision?.(indexA, indexB);
        // Resolve collision
        resolveOBBCollision(state, indexA, indexB, result.contact);
    }
    /**
     * Detect and resolve all OBB collisions
     * Uses spatial hash buckets for O(n×k) complexity instead of O(n²)
     * Dense buckets use sort-and-sweep for additional optimization
     */
    function detectAndResolveOBB(state, elementCount, onCollision) {
        const collisionsList = [];
        // Track checked pairs to avoid duplicate checks
        // Uses bitwise encoding: (indexA << 16) | indexB for zero-allocation pair keys
        const checkedPairs = new Set();
        // Track which buckets we've already processed with sweep
        const sweptBuckets = new Set();
        for (let indexA = 0; indexA < elementCount; indexA++) {
            const velA = state.velocities[indexA];
            if (!velA)
                continue;
            const cellIdA = state.hash[indexA];
            if (cellIdA === undefined)
                continue;
            // Get all neighbor cell IDs
            const neighborCells = getNeighborCellIds(cellIdA, state.gridSize);
            // Check elements in neighboring cells only
            for (const neighborCellId of neighborCells) {
                const bucket = state.buckets.get(neighborCellId);
                if (!bucket)
                    continue;
                // Dense bucket: use sort-and-sweep algorithm
                if (bucket.length > DENSE_BUCKET_THRESHOLD) {
                    // Only sweep each dense bucket once
                    if (sweptBuckets.has(neighborCellId))
                        continue;
                    sweptBuckets.add(neighborCellId);
                    const sweepPairs = sweepBucket(bucket, state.positions, state.dimensions);
                    for (const [idxA, idxB] of sweepPairs) {
                        processOBBCollisionPair(state, idxA, idxB, checkedPairs, collisionsList, onCollision);
                    }
                    continue;
                }
                // Sparse bucket: simple iteration
                for (const indexB of bucket) {
                    // Skip self and ensure we only check each pair once (lower index first)
                    if (indexA >= indexB)
                        continue;
                    processOBBCollisionPair(state, indexA, indexB, checkedPairs, collisionsList, onCollision);
                }
            }
        }
        return collisionsList;
    }
    /**
     * Integrate angular motion (update angles from angular velocities)
     */
    function integrateAngularMotion(state) {
        const dt = state.deltaTime;
        for (let i = 0; i < state.angles.length; i++) {
            const angle = state.angles[i];
            const angularVelocity = state.angularVelocities[i];
            if (angle !== undefined && angularVelocity !== undefined) {
                state.angles[i] = angle + angularVelocity * dt;
            }
        }
    }

    class Elastica {
        constructor({ gridSize = 4, containerOffsets = { top: 0, bottom: 0, left: 0, right: 0 }, collisions = true, borders = 'rigid', useOBB = true, defaultMass = 1, defaultRestitution = 0.8, solver, } = {}) {
            this.displayScaleWarningShown = false;
            this.calculatecCollisions = collisions;
            this.calculateBorders = borders;
            this.gridSize = gridSize;
            this.containerOffsets = {
                top: containerOffsets.top ?? 0,
                bottom: containerOffsets.bottom ?? 0,
                left: containerOffsets.left ?? 0,
                right: containerOffsets.right ?? 0,
            };
            this.container = { width: 0, height: 0 };
            this.collisionsList = [];
            // Per-body arrays
            this.positions = [];
            this.velocities = [];
            this.externalForces = [];
            this.dimensions = [];
            this.bounced = [];
            this.hash = [];
            this.isStatic = [];
            this.staticPositions = [];
            this.displayScales = [];
            this.buckets = new Map();
            // OBB rigid body properties
            this.useOBB = useOBB;
            this.angles = [];
            this.angularVelocities = [];
            this.masses = [];
            this.momentsOfInertia = [];
            this.restitutions = [];
            this.maxExtents = [];
            this.shapeTypes = [];
            this.defaultMass = defaultMass;
            this.defaultRestitution = defaultRestitution;
            // Solver config
            this.solverSlop = solver?.slop ?? 0.5;
            this.solverPercent = solver?.percent ?? 0.8;
            this.fixedDeltaTime = Math.max(1, solver?.fixedDeltaTime ?? 16.67);
            this.substeps = Math.max(1, Math.floor(solver?.substeps ?? 1));
        }
        initialCondition(elements, rect, callback = () => { }) {
            this.container = rect;
            this.dimensions = elements.map((element, index) => {
                if (!element)
                    return [0, 0];
                // Check for static state - handle both DOM and canvas modes
                this.isStatic[index] = element.element?.dataset?.state === 'static';
                // Pre-allocate positions and velocities so callback can use .length
                this.positions[index] = [0, 0];
                this.velocities[index] = [0, 0];
                this.externalForces[index] = [0, 0];
                this.bounced[index] = 0;
                this.displayScales[index] = 1;
                // Initialize OBB rigid body properties
                this.angles[index] = 0;
                this.angularVelocities[index] = 0;
                this.masses[index] = this.defaultMass;
                this.restitutions[index] = this.defaultRestitution;
                const { rect: elementRect } = element;
                const shapeType = element.shape ?? 'rectangle';
                this.shapeTypes[index] = shapeType;
                if (shapeType === 'circle') {
                    // For circles: use the smaller dimension as diameter, store radius in both slots
                    const radius = Math.min(elementRect.width, elementRect.height) / 2;
                    // Moment of inertia for circle: I = 0.5 * m * r²
                    this.momentsOfInertia[index] = 0.5 * this.defaultMass * radius * radius;
                    // For circles, maxExtent is just the radius
                    this.maxExtents[index] = radius;
                    // Store [radius, radius] for compatibility with existing code
                    return [radius, radius];
                }
                // Rectangle handling (default)
                const halfWidth = elementRect.width / 2;
                const halfHeight = elementRect.height / 2;
                // Calculate moment of inertia for rectangle: I = (m/12) * (w² + h²)
                const width = elementRect.width;
                const height = elementRect.height;
                this.momentsOfInertia[index] =
                    (this.defaultMass / 12) * (width * width + height * height);
                // Cache max extent (diagonal) for broad-phase collision checks
                this.maxExtents[index] = Math.sqrt(halfWidth * halfWidth + halfHeight * halfHeight);
                return [halfWidth, halfHeight];
            });
            callback(this);
            const elementCount = elements.length;
            // Cache static element positions after initialization
            for (let index = 0; index < elementCount; index++) {
                const pos = this.positions[index];
                if (!pos)
                    continue;
                if (this.isStatic[index]) {
                    this.staticPositions[index] = [pos[0], pos[1]];
                }
                const element = elements[index];
                const dimension = this.dimensions[index];
                if (element && dimension) {
                    this.setPosition(element.element, {
                        x: pos[0] - dimension[0],
                        y: pos[1] - dimension[1],
                    }, index);
                }
            }
            // Build initial spatial hash with buckets
            this.updateSpatialHash(elementCount);
        }
        // Spatial hash utilities
        computeCellId(pos) {
            const cellX = Math.floor((this.gridSize * pos[0]) / this.container.width);
            const cellY = Math.floor((this.gridSize * pos[1]) / this.container.height);
            // Clamp to valid range to handle edge cases
            const clampedX = Math.max(0, Math.min(this.gridSize - 1, cellX));
            const clampedY = Math.max(0, Math.min(this.gridSize - 1, cellY));
            return clampedX + clampedY * this.gridSize;
        }
        updateSpatialHash(elementCount) {
            // Clear all buckets
            this.buckets.clear();
            // Populate hash and buckets in single pass
            for (let index = 0; index < elementCount; index++) {
                const pos = this.positions[index];
                if (!pos)
                    continue;
                const cellId = this.computeCellId(pos);
                this.hash[index] = cellId;
                // Add to bucket
                const bucket = this.buckets.get(cellId);
                if (bucket) {
                    bucket.push(index);
                }
                else {
                    this.buckets.set(cellId, [index]);
                }
            }
        }
        // Get indices of elements in neighboring cells (3x3 grid around cell)
        getNeighborIndices(cellId) {
            const indices = [];
            const cellX = cellId % this.gridSize;
            const cellY = Math.floor(cellId / this.gridSize);
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const nx = cellX + dx;
                    const ny = cellY + dy;
                    // Skip out-of-bounds cells
                    if (nx < 0 || nx >= this.gridSize || ny < 0 || ny >= this.gridSize) {
                        continue;
                    }
                    const neighborCellId = nx + ny * this.gridSize;
                    const bucket = this.buckets.get(neighborCellId);
                    if (bucket) {
                        for (let i = 0; i < bucket.length; i++) {
                            indices.push(bucket[i]);
                        }
                    }
                }
            }
            return indices;
        }
        // Math utilities (delegated)
        polarCoordinates(vector) {
            return toPolar(vector);
        }
        cartesianCoordinates(speed, angle) {
            return toCartesian(speed, angle);
        }
        // Bounce tracking
        hasBounced(index) {
            const current = this.bounced[index] ?? 0;
            this.bounced[index] = current + 1;
            return this.bounced[index];
        }
        /**
         * Lazily injects the CSS rule that enables CSS variable-based transforms.
         * Called once on first element initialization.
         *
         * Why CSS variables instead of cssText:
         * - cssText creates ~80 char strings every frame (e.g., "transform: translate3d(...)")
         * - setProperty creates ~10 char strings (e.g., "123.45px")
         * - Avoids CSS parsing overhead on every frame
         * - will-change is set once via CSS, not reassigned every frame
         */
        injectStyles() {
            if (Elastica.stylesInjected)
                return;
            const style = document.createElement('style');
            style.id = 'elastica-css';
            // Using CSS variables --ex (x), --ey (y), --er (rotation) for transform
            // The [data-elastica] attribute marks elements managed by the engine
            style.textContent = '[data-elastica]{transform:translate3d(var(--ex,0),var(--ey,0),0)rotate(var(--er,0))scale(var(--eds,1));will-change:transform}';
            document.head.appendChild(style);
            Elastica.stylesInjected = true;
        }
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
        initializeElement(element) {
            if (!element)
                return; // No-op for canvas mode
            this.injectStyles();
            element.dataset.elastica = '';
        }
        /**
         * Updates element position using CSS custom properties.
         *
         * Why setProperty over cssText:
         * - Shorter strings reduce GC pressure (~10 chars vs ~80 chars per update)
         * - No CSS parsing - just variable value updates
         * - Browser batches variable updates efficiently
         */
        setPosition(element, { x = 0, y = 0, angle = 0 }, index) {
            if (element && !this.isStatic[index]) {
                // Update CSS variables - shorter strings than full cssText, no CSS parsing
                element.style.setProperty('--ex', x + 'px');
                element.style.setProperty('--ey', y + 'px');
                // Only set rotation if non-zero to avoid unnecessary updates
                if (angle !== 0) {
                    element.style.setProperty('--er', angle + 'rad');
                }
                // Apply visual scale (does not affect collision bounds)
                const scale = this.displayScales[index];
                if (scale !== undefined && scale !== 1) {
                    if (this.calculatecCollisions && !this.displayScaleWarningShown) {
                        console.warn('[Elastica] displayScale is visual-only, collision bounds unchanged');
                        this.displayScaleWarningShown = true;
                    }
                    element.style.setProperty('--eds', String(scale));
                }
            }
        }
        // Property setters
        setAngle(index, angle) {
            if (index >= 0 && index < this.angles.length) {
                this.angles[index] = angle;
            }
        }
        setAngularVelocity(index, angularVelocity) {
            if (index >= 0 && index < this.angularVelocities.length) {
                this.angularVelocities[index] = angularVelocity;
            }
        }
        setMass(index, mass) {
            if (index >= 0 && index < this.masses.length) {
                this.masses[index] = mass;
                // Recalculate moment of inertia based on shape type
                const dimension = this.dimensions[index];
                const shapeType = this.shapeTypes[index] ?? 'rectangle';
                if (dimension) {
                    if (shapeType === 'circle') {
                        // Circle: I = 0.5 * m * r²
                        const radius = dimension[0];
                        this.momentsOfInertia[index] = 0.5 * mass * radius * radius;
                    }
                    else {
                        // Rectangle: I = (m/12) * (w² + h²)
                        const width = dimension[0] * 2;
                        const height = dimension[1] * 2;
                        this.momentsOfInertia[index] = (mass / 12) * (width * width + height * height);
                    }
                }
            }
        }
        setRestitution(index, restitution) {
            if (index >= 0 && index < this.restitutions.length) {
                this.restitutions[index] = Math.max(0, Math.min(1, restitution));
            }
        }
        // Get state objects for collision modules
        getAABBState() {
            return {
                positions: this.positions,
                velocities: this.velocities,
                dimensions: this.dimensions,
                hash: this.hash,
                gridSize: this.gridSize,
                isStatic: this.isStatic,
                buckets: this.buckets,
            };
        }
        getOBBState(deltaTime) {
            return {
                positions: this.positions,
                velocities: this.velocities,
                dimensions: this.dimensions,
                angles: this.angles,
                angularVelocities: this.angularVelocities,
                masses: this.masses,
                momentsOfInertia: this.momentsOfInertia,
                restitutions: this.restitutions,
                maxExtents: this.maxExtents,
                isStatic: this.isStatic,
                shapeTypes: this.shapeTypes,
                hash: this.hash,
                gridSize: this.gridSize,
                buckets: this.buckets,
                slop: this.solverSlop,
                percent: this.solverPercent,
                deltaTime,
            };
        }
        // Main update loop with substepping support
        update(elements, callback) {
            const elementCount = elements.length;
            // Cache original deltaTime and compute substep deltaTime
            const originalDeltaTime = this.fixedDeltaTime;
            const substepDeltaTime = originalDeltaTime / this.substeps;
            // Substep loop: smaller integration steps with collision checks between each
            for (let step = 0; step < this.substeps; step++) {
                // Set scaled deltaTime for this substep (user callback reads this)
                this.fixedDeltaTime = substepDeltaTime;
                // User callback (applies forces, integrates positions with scaled dt)
                callback(this);
                // Reset static elements after user callback
                for (let index = 0; index < elementCount; index++) {
                    if (this.isStatic[index]) {
                        const cachedPos = this.staticPositions[index];
                        if (cachedPos) {
                            this.positions[index] = cachedPos;
                        }
                        this.velocities[index] = [0, 0];
                        this.angularVelocities[index] = 0;
                    }
                }
                const borderState = {
                    positions: this.positions,
                    velocities: this.velocities,
                    dimensions: this.dimensions,
                    container: this.container,
                    containerOffsets: this.containerOffsets,
                    isStatic: this.isStatic,
                };
                // Handle borders
                if (this.calculateBorders === 'rigid') {
                    handleRigidBorders(borderState, elementCount, (index) => this.hasBounced(index));
                }
                else if (this.calculateBorders === 'periodic') {
                    handlePeriodicBorders(borderState, elementCount);
                }
                // Handle collisions
                if (this.calculatecCollisions) {
                    if (this.useOBB) {
                        const obbState = this.getOBBState(substepDeltaTime);
                        this.collisionsList = detectAndResolveOBB(obbState, elementCount, (indexA, indexB) => {
                            this.hasBounced(indexA);
                            this.hasBounced(indexB);
                        });
                        integrateAngularMotion(obbState);
                    }
                    else {
                        const aabbState = this.getAABBState();
                        this.collisionsList = detectAndResolveAABB(aabbState, elementCount, (indexA, indexB) => {
                            this.hasBounced(indexA);
                            this.hasBounced(indexB);
                        });
                    }
                }
                // Update spatial hash for next substep's collision detection
                this.updateSpatialHash(elementCount);
            }
            // Restore original deltaTime
            this.fixedDeltaTime = originalDeltaTime;
            // Update DOM positions once at end (not per substep)
            for (let index = 0; index < elementCount; index++) {
                const element = elements[index];
                const position = this.positions[index];
                const dimension = this.dimensions[index];
                const angle = this.useOBB ? this.angles[index] : 0;
                if (element && position && dimension) {
                    this.setPosition(element.element, {
                        x: position[0] - dimension[0],
                        y: position[1] - dimension[1],
                        angle: angle ?? 0,
                    }, index);
                }
            }
        }
    }
    /**
     * Static flag to ensure CSS is injected only once across all Elastica instances.
     * The CSS rule uses [data-elastica] selector to apply transforms via CSS variables,
     * which reduces per-frame string allocations compared to setting cssText directly.
     */
    Elastica.stylesInjected = false;

    function createAccumulator(fixedDeltaTime) {
        return {
            accumulated: 0,
            fixedDeltaTime,
        };
    }
    /**
     * Accumulates time and returns how many physics steps should run this frame.
     * This decouples physics rate from render rate, ensuring consistent simulation
     * speed across different screen refresh rates (60Hz vs 120Hz).
     */
    function accumulateTime(accumulator, deltaTime) {
        accumulator.accumulated += deltaTime;
        let steps = 0;
        while (accumulator.accumulated >= accumulator.fixedDeltaTime) {
            accumulator.accumulated -= accumulator.fixedDeltaTime;
            steps++;
        }
        // Cap to prevent spiral of death if tab was backgrounded
        return Math.min(steps, 4);
    }

    exports.accumulateTime = accumulateTime;
    exports.add = add;
    exports.calculateSuperposition = calculateSuperposition;
    exports.circleVsAABB = circleVsAABB;
    exports.circleVsCircle = circleVsCircle;
    exports.circleVsOBB = circleVsOBB;
    exports.createAccumulator = createAccumulator;
    exports.cross = cross;
    exports.default = Elastica;
    exports.detectAndResolveAABB = detectAndResolveAABB;
    exports.detectAndResolveOBB = detectAndResolveOBB;
    exports.distance = distance;
    exports.distanceSquared = distanceSquared;
    exports.dot = dot;
    exports.getKineticEnergy = getKineticEnergy;
    exports.getNeighborCellIds = getNeighborCellIds;
    exports.getOBBAxes = getOBBAxes;
    exports.getOBBCorners = getOBBCorners;
    exports.handlePeriodicBorders = handlePeriodicBorders;
    exports.handleRigidBorders = handleRigidBorders;
    exports.integrateAngularMotion = integrateAngularMotion;
    exports.isOBBNeighbor = isOBBNeighbor;
    exports.lerp = lerp;
    exports.magnitude = magnitude;
    exports.magnitudeSquared = magnitudeSquared;
    exports.negate = negate;
    exports.normalize = normalize;
    exports.perpendicular = perpendicular;
    exports.projectOBBOntoAxis = projectOBBOntoAxis;
    exports.resolveAABBCollision = resolveAABBCollision;
    exports.resolveOBBCollision = resolveOBBCollision;
    exports.rotate = rotate;
    exports.rotateAround = rotateAround;
    exports.satCollisionTest = satCollisionTest;
    exports.scale = scale;
    exports.subtract = subtract;
    exports.sweepBucket = sweepBucket;
    exports.testAABB = testAABB;
    exports.toCartesian = toCartesian;
    exports.toPolar = toPolar;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=elastica.js.map
