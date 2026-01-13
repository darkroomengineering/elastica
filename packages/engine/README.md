# Elastica Engine

A 2D physics engine for elastic collisions with support for both axis-aligned and oriented bounding boxes.

## Collision Systems

### AABB (Axis-Aligned Bounding Box)

The simpler collision system. Each body is represented as a rectangle that **never rotates** - its edges always stay parallel to the x and y axes.

```
    ┌───────┐
    │       │  ← edges always horizontal/vertical
    │   A   │
    │       │
    └───────┘
```

**Detection**: Two AABBs collide if they overlap on both the X and Y axes. This is a simple range check - very fast, O(1) per pair.

**Resolution**: When collision is detected:
1. Calculate an "exclusion force" based on overlap depth
2. Apply force to both bodies' velocities
3. Scale velocities to conserve kinetic energy
4. Swap velocities between bodies (creates bouncing effect)

Best for: DVD screensaver effects, simple bouncing objects, performance-critical scenarios.

---

### OBB (Oriented Bounding Box)

The advanced collision system. Bodies can **rotate freely** - rectangles at any angle.

```
        ╱╲
       ╱  ╲
      ╱ A  ╲   ← edges at arbitrary angles
      ╲    ╱
       ╲  ╱
        ╲╱
```

**Detection**: Uses the **Separating Axis Theorem (SAT)**:
1. For two rectangles, there are 4 potential "separating axes" (2 edge normals per rectangle)
2. Project both shapes onto each axis
3. If projections overlap on ALL axes → collision
4. If there's a gap on ANY axis → no collision (early exit)

The axis with minimum overlap becomes the **collision normal** (direction of impact).

**Resolution**: Energy-conserving approach:
1. Calculate initial kinetic energy (linear + rotational)
2. Apply repulsion force along collision normal
3. Calculate torque based on contact point offset from center
4. Scale all velocities to conserve total energy
5. Apply position correction to prevent overlap

Best for: Realistic physics, rotating objects, billiard-style games.

---

## Border Handling

### Rigid Borders
Bodies bounce off container edges. When a body hits a wall:
- Velocity component perpendicular to wall is reversed
- Position is clamped to stay inside container

### Periodic Borders
Bodies wrap around - exiting one side makes them appear on the opposite side. Useful for infinite/toroidal spaces.

---

## Spatial Hashing

Checking every pair of bodies for collision is O(n²) - slow for many objects.

**Spatial hashing** divides the container into a grid. Each body is assigned to a cell based on its position:

```
┌───┬───┬───┬───┐
│ 0 │ 1 │ 2 │ 3 │
├───┼───┼───┼───┤
│ 4 │ 5 │ 6 │ 7 │   ← gridSize × gridSize cells
├───┼───┼───┼───┤
│ 8 │ 9 │10 │11 │
├───┼───┼───┼───┤
│12 │13 │14 │15 │
└───┴───┴───┴───┘
```

**Optimization**: Bodies only check for collisions with neighbors in adjacent cells (3×3 region around their cell). This reduces checks dramatically for sparse distributions.

**For OBB**: Since rotated boxes can extend beyond their center's cell, OBB mode uses a distance-based broad phase instead - checking if the diagonal extents could possibly overlap.

---

## Energy Conservation

Both collision systems implement **energy conservation**:

```
Initial KE = Final KE × restitution
```

Where:
- **KE (linear)** = ½ × mass × velocity²
- **KE (rotational)** = ½ × moment_of_inertia × angular_velocity²
- **restitution** = 0 (perfectly inelastic) to 1 (perfectly elastic)

This prevents the "gaining energy" bug common in naive collision implementations.

---

## File Structure

```
src/
├── types.ts          # Type definitions
├── math.ts           # Vector math utilities
├── borders.ts        # Rigid & periodic border handling
├── collision/
│   ├── aabb.ts       # Axis-aligned collision
│   └── obb.ts        # Oriented collision (SAT)
├── elastica.ts       # Main engine class
└── index.ts          # Exports
```
