# Collision Detection in Elastica

> A technical guide to the collision detection algorithms, shape support, and optimization strategies.

---

## Supported Shapes

| Shape | Description | Collision Partners |
|-------|-------------|-------------------|
| **Rectangle (AABB)** | Axis-aligned bounding box | AABB, Circle |
| **Rectangle (OBB)** | Oriented bounding box (rotated) | OBB, Circle |
| **Circle** | Perfect circle defined by radius | Circle, AABB, OBB |

---

## Collision Detection Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                     BROAD PHASE                                  │
│  Purpose: Quickly reject pairs that cannot possibly collide      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Spatial Hashing                                              │
│     ┌───┬───┬───┬───┐                                           │
│     │ 0 │ 1 │ 2 │ 3 │  Grid divides space into cells            │
│     ├───┼───┼───┼───┤  Bodies hashed to cell by position        │
│     │ 4 │ 5 │ 6 │ 7 │  Only check bodies in neighboring cells   │
│     ├───┼───┼───┼───┤                                           │
│     │ 8 │ 9 │10 │11 │  Complexity: O(n²) → O(n × k)             │
│     ├───┼───┼───┼───┤  where k = avg neighbors per cell         │
│     │12 │13 │14 │15 │                                           │
│     └───┴───┴───┴───┘                                           │
│                                                                  │
│  2. Distance Pre-check (OBB mode)                                │
│     Uses cached maxExtent (diagonal for rectangles, radius       │
│     for circles) to reject distant pairs without narrow phase    │
│                                                                  │
│  3. Sort-and-Sweep (dense buckets > 16 bodies)                   │
│     Sort by X-axis, early-exit when no overlap possible          │
│     Complexity: O(n²) → O(n log n + k)                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     NARROW PHASE                                 │
│  Purpose: Determine exact collision and contact information      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Shape Dispatch:                                                 │
│  ┌─────────────────┬─────────────────┬─────────────────────────┐│
│  │ Shape A         │ Shape B         │ Algorithm               ││
│  ├─────────────────┼─────────────────┼─────────────────────────┤│
│  │ Circle          │ Circle          │ Distance check          ││
│  │ Circle          │ Rectangle       │ Voronoi region + dist   ││
│  │ Rectangle       │ Rectangle       │ SAT (4 axes)            ││
│  └─────────────────┴─────────────────┴─────────────────────────┘│
│                                                                  │
│  Output: CollisionResult { collided, contact? }                  │
│          contact: { point, normal, penetration }                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     RESOLUTION                                   │
│  Purpose: Separate bodies and update velocities                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Calculate repulsion force from penetration depth             │
│  2. Apply linear velocity changes along collision normal         │
│  3. Calculate torque: τ = r × F (moment arm × force)             │
│  4. Apply angular velocity changes: ω += τ / I                   │
│  5. Scale velocities to conserve energy (with restitution)       │
│  6. Position correction to resolve remaining penetration         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Algorithm Details

### Circle vs Circle

The simplest collision test - just compare distance to sum of radii.

```
        ●━━━━━━━━━━━━●
       A              B

    distance² < (radiusA + radiusB)²
```

**Key optimization**: Compare squared distances to avoid `sqrt` in the common non-colliding case.

```typescript
const dx = posB[0] - posA[0]
const dy = posB[1] - posA[1]
const distSq = dx * dx + dy * dy
const radiusSum = radiusA + radiusB

// Only compute sqrt if collision is possible
if (distSq < radiusSum * radiusSum) {
  const dist = Math.sqrt(distSq)
  // ... compute contact
}
```

**Contact calculation**:
- **Normal**: Unit vector from A to B
- **Contact point**: Point on circle A's surface toward B
- **Penetration**: `radiusSum - distance`

---

### Circle vs Rectangle (AABB/OBB)

Uses the **Voronoi region** concept to find the closest point on the rectangle.

#### What are Voronoi Regions?

A rectangle divides surrounding space into 9 Voronoi regions:

```
    Corner     Edge      Corner
    Region    Region     Region
      ┌─────────────────────┐
      │ ╲       │       ╱   │
      │   ╲     │     ╱     │
      │     ╲   │   ╱       │
      ├───────┬─┴─┬─────────┤
Edge  │       │   │         │  Edge
Region│       │ R │         │  Region
      │       │   │         │
      ├───────┴─┬─┴─────────┤
      │     ╱   │   ╲       │
      │   ╱     │     ╲     │
      │ ╱       │       ╲   │
      └─────────────────────┘
    Corner     Edge      Corner
    Region    Region     Region
```

The **clamping operation** automatically determines which region the circle center is in:

```typescript
// Clamp circle center to rectangle bounds
const closestX = Math.max(rect.minX, Math.min(circleX, rect.maxX))
const closestY = Math.max(rect.minY, Math.min(circleY, rect.maxY))
```

| Circle Center Location | Clamped Point | Region Type |
|------------------------|---------------|-------------|
| Inside rectangle | Circle center itself | Interior |
| Above top edge | Point on top edge | Edge |
| Right of top-right corner | Top-right corner | Corner |
| ... | ... | ... |

**Why this works**: The clamped point is always the closest point on the rectangle to the circle center. Then we just check if that distance is less than the radius.

```
    Circle in corner region:          Circle in edge region:

         ○                                  ○
        ╱│                                  │
       ╱ │                                  │
      ╱  │                                  │
    ●────┼────────                    ──────●──────
    │    │        │                   │     │     │
    │    └────────┘                   │     │     │
    │             │                   └─────┴─────┘
    └─────────────┘

    Distance to corner                Distance to edge
    (2D distance)                     (1D distance)
```

#### Circle vs OBB (Rotated Rectangle)

Same algorithm, but transform to local space first:

```typescript
// 1. Transform circle center to OBB's local coordinate space
const cos = Math.cos(-angle)  // Negative angle to "unrotate"
const sin = Math.sin(-angle)
const dx = circleX - rectX
const dy = circleY - rectY
const localX = dx * cos - dy * sin
const localY = dx * sin + dy * cos

// 2. Now it's just Circle vs AABB in local space
const closestX = clamp(localX, -halfWidth, halfWidth)
const closestY = clamp(localY, -halfHeight, halfHeight)

// 3. Check distance, compute contact in local space

// 4. Transform normal back to world space
const worldNormalX = localNormalX * cos(-angle) - localNormalY * sin(-angle)
const worldNormalY = localNormalX * sin(-angle) + localNormalY * cos(-angle)
```

---

### Rectangle vs Rectangle (SAT)

Uses the **Separating Axis Theorem**: If two convex shapes don't overlap, there exists an axis where their projections don't overlap.

For two OBBs, we test 4 axes (2 edge normals from each rectangle):

```
    Rectangle A          Rectangle B
    ┌─────────┐         ┌─────────┐
    │         │         │         │
    │    ─────┼────axis─┼─────    │
    │         │  1      │         │
    │    │    │         │    │    │
    └────┼────┘         └────┼────┘
         │                   │
       axis 2              axis 4

         └────── axis 3 ──────┘
```

**Algorithm**:
1. For each axis, project both rectangles onto it
2. Check if projections overlap
3. If ANY axis has no overlap → no collision (separating axis found)
4. If ALL axes overlap → collision, use minimum overlap for penetration

```typescript
for (const axis of [axisA1, axisA2, axisB1, axisB2]) {
  const projA = projectOBBOntoAxis(A, axis)  // [min, max]
  const projB = projectOBBOntoAxis(B, axis)  // [min, max]

  const overlap = min(projA.max, projB.max) - max(projA.min, projB.min)

  if (overlap <= 0) {
    return { collided: false }  // Separating axis found!
  }

  // Track minimum overlap for contact calculation
  if (overlap < minOverlap) {
    minOverlap = overlap
    minOverlapAxis = axis
  }
}

// No separating axis found - shapes are colliding
return {
  collided: true,
  contact: {
    normal: minOverlapAxis,
    penetration: minOverlap,
    point: midpoint(A.center, B.center)
  }
}
```

---

## Physics Properties by Shape

| Property | Rectangle | Circle |
|----------|-----------|--------|
| **Dimensions** | `[halfWidth, halfHeight]` | `[radius, radius]` |
| **maxExtent** | `sqrt(hw² + hh²)` (diagonal) | `radius` |
| **Moment of Inertia** | `I = (m/12)(w² + h²)` | `I = (m/2)r²` |
| **Angular Response** | Torque creates rotation | Torque creates rotation* |

*Circles have rotational symmetry, so rotation is invisible visually but still tracked for physics consistency.

---

## Performance Characteristics

| Collision Type | Operations | Relative Cost |
|----------------|------------|---------------|
| Circle vs Circle | 1 distance check | ⚡ Fastest |
| Circle vs AABB | 2 clamps + 1 distance | ⚡ Fast |
| Circle vs OBB | 2 trig + 2 clamps + 1 distance | ⚡ Fast |
| AABB vs AABB | 4 comparisons | ⚡ Fast |
| OBB vs OBB | 4 axes × (8 projections + overlap) | 🔶 Moderate |

**Key insight**: Circle collisions are computationally cheaper than rectangle collisions. Simulations with many circles will perform better than equivalent rectangle simulations.

---

## Optimization Techniques Used

### 1. Squared Distance Comparison

```typescript
// ❌ Slow: sqrt every check
if (distance(a, b) < threshold) { ... }

// ✅ Fast: only sqrt when needed
if (distanceSquared(a, b) < threshold * threshold) {
  const dist = Math.sqrt(distanceSquared(a, b))  // Only if colliding
}
```

### 2. Cached Extent Values

```typescript
// Calculated once at initialization, not every frame
this.maxExtents[i] = shape === 'circle'
  ? radius
  : Math.sqrt(halfWidth² + halfHeight²)
```

### 3. Bitwise Pair Tracking

```typescript
// Zero-allocation pair keys
const pairKey = (indexA << 16) | indexB
checkedPairs.add(pairKey)
```

### 4. Object Pooling

```typescript
// Reuse temporary vectors instead of allocating
const axes = axesPool.acquire()
// ... use axes ...
axesPool.release(axes)
```

### 5. Early Exit in Broad Phase

```typescript
// Reject distant pairs before expensive narrow phase
const maxDist = maxExtentA + maxExtentB
if (distanceSquared(posA, posB) > maxDist * maxDist) {
  return  // Skip narrow phase entirely
}
```

---

## Usage

### Basic Shape Configuration

```typescript
const elastica = new Elastica({ useOBB: true })

elastica.initialCondition([
  // Rectangle (default)
  { element: rectElement, rect: { width: 100, height: 50 } },

  // Circle
  { element: circleElement, rect: { width: 60, height: 60 }, shape: 'circle' },
], containerRect, callback)
```

### Mixed Shape Simulation

Circles and rectangles can collide with each other. The engine automatically dispatches to the correct collision function based on shape types.

```typescript
// All combinations work:
// - Circle vs Circle
// - Circle vs Rectangle (AABB or OBB)
// - Rectangle vs Rectangle (AABB or OBB)
```

---

## Edge Cases Handled

| Case | Handling |
|------|----------|
| **Same position** | Default normal `[1, 0]`, penetration = radiusSum |
| **Circle center inside rectangle** | Find closest edge, push toward it |
| **Zero-size shapes** | Returns no collision (dimensions validation) |
| **Static vs static** | Skipped (no resolution needed) |
| **Static vs dynamic** | All impulse transfers to dynamic body |

---

## References

- [Separating Axis Theorem](https://en.wikipedia.org/wiki/Hyperplane_separation_theorem)
- [Voronoi Diagrams](https://en.wikipedia.org/wiki/Voronoi_diagram)
- [Game Physics - Collision Detection](https://www.toptal.com/game/video-game-physics-part-ii-collision-detection-for-solid-objects)
- [Real-Time Collision Detection (Ericson)](https://realtimecollisiondetection.net/)
