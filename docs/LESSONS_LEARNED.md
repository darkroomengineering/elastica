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
