# Lessons Learned: Elastica Performance & Architecture

> Patterns to follow and pitfalls to avoid based on our optimization work.

---

## Engine: Collision Detection

### Spatial Hashing Must Use Buckets, Not Just Cell IDs

**The Problem:**
```typescript
// ❌ WRONG: O(n²) loop with early exit is still O(n²)
for (let i = 0; i < n; i++) {
  for (let j = i + 1; j < n; j++) {
    if (!isNeighbor(hash[i], hash[j])) continue  // Still checking ALL pairs!
    // ...
  }
}
```

**The Solution:**
```typescript
// ✅ RIGHT: Build buckets, iterate only neighbors - O(n×k)
const buckets = new Map<number, number[]>()

// Populate buckets
for (let i = 0; i < n; i++) {
  const cellId = computeCellId(positions[i])
  if (!buckets.has(cellId)) buckets.set(cellId, [])
  buckets.get(cellId).push(i)
}

// Query only neighboring cells
for (let i = 0; i < n; i++) {
  for (const neighborCellId of getNeighborCells(hash[i])) {
    for (const j of buckets.get(neighborCellId) ?? []) {
      if (i >= j) continue  // Avoid duplicate pairs
      // Now we only check actual neighbors
    }
  }
}
```

**Why It Matters:**
- 100 elements: 4,950 checks → ~2,700 checks (45% reduction)
- 500 elements: 124,750 checks → ~13,500 checks (89% reduction)
- Scales with element count, not quadratically

---

### Avoid Allocations in Hot Paths

**The Problem:**
```typescript
// ❌ WRONG: Creates new arrays every collision test
const axes = [...axesA, ...axesB]  // New array allocation

const corners = localCorners.map(([lx, ly]) => [  // 4 new arrays via map()
  position[0] + lx * cos - ly * sin,
  position[1] + lx * sin + ly * cos,
])
```

**The Solution:**
```typescript
// ✅ RIGHT: Use object pooling for temporary allocations
// Guarantee pattern by JS event loop single thread execution
class VectorPool {
  private pool: Vector2D[] = []

  acquire(): Vector2D {
    return this.pool.pop() ?? [0, 0]
  }

  release(vec: Vector2D): void {
    this.pool.push(vec)
  }
}

// Use in hot path
const axes = axesPool.acquire()
axes[0] = axesA[0]; axes[1] = axesA[1]  // Reuse, don't allocate
// ... use axes ...
axesPool.release(axes)  // Return for reuse
```

**Why It Matters:**
- GC pauses cause frame drops
- 100 collisions × 20 allocations = 2000 objects per frame
- Pooling: 0 allocations in steady state

**Rules for Hot Paths:**
1. No `.map()`, `.filter()`, `.reduce()` - use `for` loops
2. No spread operators `[...arr]` - copy manually or pool
3. No object literals `{ x, y }` - mutate existing or pool
4. Pre-allocate buffers at init time

---

### Use Bitwise Encoding for Pair Keys

**The Problem:**
```typescript
// ❌ WRONG: String allocation for every pair check
const checkedPairs = new Set<string>()

for (const [indexA, indexB] of pairs) {
  const pairKey = `${indexA}:${indexB}`  // Creates 3 strings per iteration!
  if (checkedPairs.has(pairKey)) continue
  checkedPairs.add(pairKey)
}
```

**The Solution:**
```typescript
// ✅ RIGHT: Bitwise encoding - zero allocation
const checkedPairs = new Set<number>()

for (const [indexA, indexB] of pairs) {
  // Pack two 16-bit indices into one 32-bit number
  const pairKey = (indexA << 16) | indexB
  if (checkedPairs.has(pairKey)) continue
  checkedPairs.add(pairKey)
}

// To decode (if needed):
// const decodedA = pairKey >> 16
// const decodedB = pairKey & 0xFFFF
```

**Why It Matters:**
- Template literals create 3 string objects per pair
- Numbers are primitives - no heap allocation, no GC
- Bitwise operations are single CPU instructions (~1 cycle vs ~100 for strings)
- At 60fps with 500 pair checks: 90,000 fewer string allocations per second

**When to Use:**
- Tracking pairs, edges, coordinates in hot loops
- Any case where two small integers need to form a unique key
- Works for indices up to 65,535 (16 bits each)

---

### Sort-and-Sweep for Dense Buckets

**The Problem:**
```typescript
// ❌ WRONG: O(n²) pair checks in crowded spatial hash cells
for (let i = 0; i < bucket.length; i++) {
  for (let j = i + 1; j < bucket.length; j++) {
    checkCollision(bucket[i], bucket[j])  // 80 bodies = 3,160 checks!
  }
}
```

**The Solution:**
```typescript
// ✅ RIGHT: Sort by X-axis, early-exit when no overlap possible
function sweepBucket(bucket: number[], positions: Vector2D[], dimensions: Vector2D[]) {
  // Build sortable entries with left/right edges
  const entries = bucket.map(idx => ({
    idx,
    left: positions[idx][0] - dimensions[idx][0],
    right: positions[idx][0] + dimensions[idx][0],
  }))
  
  // Sort by left edge
  entries.sort((a, b) => a.left - b.left)
  
  const pairs: [number, number][] = []
  
  for (let i = 0; i < entries.length; i++) {
    const a = entries[i]
    
    for (let j = i + 1; j < entries.length; j++) {
      const b = entries[j]
      
      // Early exit: no more overlaps possible on X-axis
      if (b.left > a.right) break
      
      pairs.push([a.idx, b.idx])
    }
  }
  
  return pairs
}

// Use selectively for dense buckets
if (bucket.length > DENSE_THRESHOLD) {
  const pairs = sweepBucket(bucket, positions, dimensions)
  // Process pairs...
} else {
  // Simple nested loop for sparse buckets
}
```

**Why It Matters:**
- Transforms O(n²) to O(n log n + k) where k = actual overlapping pairs
- 80 clustered bodies: 3,160 checks → ~200 checks (94% reduction)
- The `break` statement is key - it exits as soon as no more overlaps are possible

---

### Cache Derived Values at Initialization

**The Problem:**
```typescript
// ❌ WRONG: Recalculating sqrt every frame for every pair
function isOBBNeighbor(state, indexA, indexB) {
  const dimA = state.dimensions[indexA]
  const dimB = state.dimensions[indexB]
  
  // sqrt is expensive - called potentially thousands of times per frame
  const maxExtentA = Math.sqrt(dimA[0] * dimA[0] + dimA[1] * dimA[1])
  const maxExtentB = Math.sqrt(dimB[0] * dimB[0] + dimB[1] * dimB[1])
  
  // ...
}
```

**The Solution:**
```typescript
// ✅ RIGHT: Pre-calculate at initialization, reuse every frame
class Elastica {
  maxExtents: number[] = []
  
  initialCondition(elements) {
    for (let i = 0; i < elements.length; i++) {
      const halfWidth = elements[i].width / 2
      const halfHeight = elements[i].height / 2
      
      // Calculate once
      this.maxExtents[i] = Math.sqrt(halfWidth * halfWidth + halfHeight * halfHeight)
    }
  }
}

function isOBBNeighbor(state, indexA, indexB) {
  // Just read the cached values - O(1), no computation
  const maxExtentA = state.maxExtents[indexA]
  const maxExtentB = state.maxExtents[indexB]
  // ...
}
```

**Why It Matters:**
- `Math.sqrt` is ~20-50x slower than basic arithmetic
- 200 bodies × 500 pair checks × 2 sqrts = 200,000 sqrt calls per frame
- After caching: 0 sqrt calls per frame (only at init)
- Dimensions rarely change - calculate on mutation, not every frame

**What to Cache:**
- Diagonal extents (`sqrt(w² + h²)`)
- Inverse masses (`1 / mass`)
- Precomputed sin/cos for static angles
- Any value derived from properties that don't change per-frame

---

### Use CSS Variables for DOM Updates

**The Problem:**
```typescript
// ❌ WRONG: Long string template every frame for every element
setPosition(element, { x, y, angle }) {
  // Creates ~80 character string per element per frame
  // At 25 elements × 60fps = 1,500 string allocations per second
  element.style.cssText = `transform: translate3d(${x}px, ${y}px, 0) rotate(${angle}rad); will-change: transform;`
}
```

**The Solution:**
```typescript
// ✅ RIGHT: CSS variables with static transform rule

// 1. Inject CSS once (lazy, on first element)
private injectStyles(): void {
  if (Elastica.stylesInjected) return
  
  const style = document.createElement('style')
  style.id = 'elastica-css'
  // Static rule references CSS variables
  style.textContent = '[data-elastica]{transform:translate3d(var(--ex,0),var(--ey,0),0)rotate(var(--er,0));will-change:transform}'
  document.head.appendChild(style)
  Elastica.stylesInjected = true
}

// 2. Mark elements on init
initializeElement(element: HTMLElement): void {
  this.injectStyles()
  element.dataset.elastica = ''  // Applies the CSS rule
}

// 3. Update only variable values per frame
setPosition(element, { x, y, angle }) {
  // ~10 char strings instead of ~80 chars
  element.style.setProperty('--ex', x + 'px')
  element.style.setProperty('--ey', y + 'px')
  if (angle !== 0) {
    element.style.setProperty('--er', angle + 'rad')
  }
}
```

**Why It Matters:**
- Shorter strings reduce GC pressure (~10 chars vs ~80 chars per property)
- No CSS parsing on each update - just variable value changes
- `will-change: transform` set once via CSS, not reassigned every frame
- Browser can batch CSS variable updates more efficiently

**When to Use:**
- Animating DOM elements every frame (physics, scroll effects)
- Any situation where you're setting `style.cssText` or `style.transform` repeatedly

---

## React: Preventing Unnecessary Re-renders

### Object Props Must Be Memoized

**The Problem:**
```tsx
// ❌ WRONG: New object reference every render
<ReactElastica config={{
  gridSize: 8,
  collisions: true,
}} />

// Inside ReactElastica:
useEffect(() => {
  setElastica(new Elastica(config))  // Runs EVERY render!
}, [config])
```

**The Solution:**
```tsx
// ✅ RIGHT: Memoize with primitive dependencies
const stableConfig = useMemo(() => ({
  gridSize: config?.gridSize ?? 8,
  collisions: config?.collisions ?? true,
  // ... other fields
}), [
  config?.gridSize,
  config?.collisions,
  // List ALL primitive values
])

useEffect(() => {
  setElastica(new Elastica(stableConfig))
}, [stableConfig])  // Only runs when values actually change
```

**Why It Matters:**
- Object `{}` creates new reference every render
- Effects with object dependencies run unnecessarily
- Can cause state resets, wasted computation

---

### Separate Registration from Updates

**The Problem:**
```tsx
// ❌ WRONG: Effect re-runs on every rect change
useEffect(() => {
  context.addBox(element, { element, rect })
  return () => context.removeBox(element)  // Removes and re-adds constantly!
}, [rect, context])
```

**The Solution:**
```tsx
// ✅ RIGHT: Register once, update separately
const elementDataRef = useRef<ElementData | null>(null)

// Registration - runs once
useEffect(() => {
  const elementData = { element, rect }
  elementDataRef.current = elementData
  context.addBox(element, elementData)
  return () => context.removeBox(element)
}, [context])  // No rect dependency!

// Updates - mutate in place
useEffect(() => {
  if (elementDataRef.current) {
    elementDataRef.current.rect = rect  // Mutate, don't re-register
  }
}, [rect])
```

**Why It Matters:**
- Registration/cleanup is expensive
- Rect changes on every resize/scroll
- Mutation is O(1), re-registration is O(n)

---

### Stabilize Callback Props with Refs

**The Problem:**
```tsx
// ❌ WRONG: Effect re-runs when callback reference changes
useEffect(() => {
  elastica.initialCondition(boxes, rect, (instance) =>
    initialCondition({ boxes, ...instance })  // If inline, always new reference
  )
}, [elastica, rect, initialCondition])  // Runs when initialCondition changes!
```

**The Solution:**
```tsx
// ✅ RIGHT: Store callback in ref, update ref separately
const initialConditionRef = useRef(initialCondition)

useEffect(() => {
  initialConditionRef.current = initialCondition
}, [initialCondition])

useEffect(() => {
  elastica.initialCondition(boxes, rect, (instance) =>
    initialConditionRef.current({ boxes, ...instance })  // Stable reference
  )
}, [elastica, rect])  // No callback dependency!
```

**Why It Matters:**
- Inline functions create new references every render
- Users often forget to `useCallback` their props
- Ref pattern makes it work regardless of consumer behavior

---

## General Patterns

### Use `React.memo` for List Items

```tsx
// ✅ Always memoize components that render in lists
const AxisAlignedBoundaryBox = memo(function AxisAlignedBoundaryBox(props) {
  // ...
})
```

### Prefer `for` Loops Over Array Methods in Performance Code

```typescript
// ❌ Avoid in hot paths
array.forEach((item, i) => { ... })
array.map(item => transform(item))

// ✅ Use indexed for loops
for (let i = 0; i < array.length; i++) {
  const item = array[i]
  // ...
}
```

### Keep Constants Outside Components

```tsx
// ❌ WRONG: Recreated every render
function Component() {
  const DEFAULT_CONFIG = { gridSize: 8 }  // New object every render!
}

// ✅ RIGHT: Module-level constant
const DEFAULT_CONFIG = { gridSize: 8 }

function Component() {
  // Use DEFAULT_CONFIG
}
```

---

## Quick Reference

| Pattern | Avoid | Prefer |
|---------|-------|--------|
| Collision detection | O(n²) with early exit | Bucket-based O(n×k) |
| Pair tracking | String keys `` `${a}:${b}` `` | Bitwise `(a << 16) \| b` |
| Dense buckets | Nested loops O(n²) | Sort-and-sweep O(n log n) |
| Derived values | `sqrt()` every frame | Cache at initialization |
| DOM transforms | `style.cssText` per frame | CSS variables + `setProperty` |
| Temporary vectors | `[x, y]` in loops | Object pooling |
| Array operations | `.map()`, `[...arr]` | `for` loops, mutation |
| Object props | Inline `{}` | `useMemo` with primitives |
| Effect dependencies | Object/array refs | Primitive values |
| Callbacks in effects | Direct reference | Ref-based pattern |
| List components | Plain functions | `React.memo` |

---

## Resources

- [React Performance Patterns](https://react.dev/learn/render-and-commit)
- [Object Pooling in JS](https://gameprogrammingpatterns.com/object-pool.html)
- [Spatial Hashing](https://www.gamedev.net/tutorials/programming/general-and-gameplay-programming/spatial-hashing-r2697/)
