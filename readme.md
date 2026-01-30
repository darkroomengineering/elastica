# Elastica

Physics engine for 2D rigid body collisions with React bindings.

[Demo](https://elastica.darkroom.engineering/)

## Features

- **Two collision modes**: AABB (axis-aligned) and OBB (oriented/rotational)
- **Two rendering modes**: DOM (CSS transforms) and Canvas (2D batched rendering)
- **Shape support**: Rectangles and circles
- **Frame-rate independent**: Fixed timestep physics with accumulator
- **Spatial hashing**: Efficient broad-phase collision detection
- **Configurable borders**: Rigid (bounce) or periodic (wrap-around)

## Installation

```bash
npm i @darkroom.engineering/elastica
```

## Quick Start

### DOM Mode

```tsx
import {
  DomElastica,
  BoundaryBox,
  initalConditionsPresets,
  updatePresets,
} from '@darkroom.engineering/elastica/react'

function App() {
  return (
    <DomElastica
      config={{
        collisions: true,
        borders: 'rigid',
      }}
      initialCondition={initalConditionsPresets.random}
      update={updatePresets.dvdScreenSaver}
    >
      {items.map((item, i) => (
        <BoundaryBox key={i}>
          <div className="box">{item.name}</div>
        </BoundaryBox>
      ))}
    </DomElastica>
  )
}
```

### Canvas Mode

```tsx
import {
  CanvasElastica,
  CanvasBox,
  initalConditionsPresets,
  updatePresets,
} from '@darkroom.engineering/elastica/react'

function App() {
  return (
    <CanvasElastica
      config={{
        collisions: true,
        borders: 'rigid',
      }}
      initialCondition={initalConditionsPresets.random}
      update={updatePresets.dvdScreenSaver}
    >
      {particles.map((p, i) => (
        <CanvasBox
          key={i}
          width={p.width}
          height={p.height}
          fill={p.color}
        />
      ))}
    </CanvasElastica>
  )
}
```

## API

### DomElastica / CanvasElastica

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `config` | `object` | See below | Physics configuration |
| `initialCondition` | `function` | `() => {}` | Called once on mount to set initial positions/velocities |
| `update` | `function` | `() => {}` | Called each physics step to apply forces |
| `showHashGrid` | `boolean` | `false` | Visualize spatial hash grid (debug) |

### Config Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `collisions` | `boolean` | `true` | Enable collision detection |
| `borders` | `'rigid'` \| `'periodic'` \| `false` | `'rigid'` | Border behavior |
| `gridSize` | `number` | `8` | Spatial hash cell size (should be >= largest element) |
| `useOBB` | `boolean` | `false` | Enable rotational physics (OBB mode) |
| `containerOffsets` | `object` | `{ top: 0, bottom: 0, left: 0, right: 0 }` | Inset simulation bounds |
| `defaultMass` | `number` | `1` | Default mass for elements |
| `defaultRestitution` | `number` | `0.8` | Default bounciness (0-1) |
| `solver.fixedDeltaTime` | `number` | `16.67` | Physics timestep in ms |
| `solver.substeps` | `number` | `1` | Physics substeps per frame |

### BoundaryBox (DOM)

Wraps DOM elements for physics simulation.

```tsx
<BoundaryBox
  isStatic={false}      // Static elements don't move but can be collided with
  mass={1}              // Element mass (OBB mode)
  restitution={0.8}     // Bounciness (OBB mode)
  displayScale={1}      // Visual scale (doesn't affect collision bounds)
  shape="rectangle"     // 'rectangle' or 'circle'
>
  <div>Content</div>
</BoundaryBox>
```

### CanvasBox (Canvas)

Defines particle data for canvas rendering.

```tsx
<CanvasBox
  width={50}
  height={50}
  fill="#ff0000"
  stroke="#000000"
  strokeWidth={2}
  shape="rectangle"     // 'rectangle' or 'circle'
  isStatic={false}
  mass={1}
  restitution={0.8}
/>
```

### Hooks

```tsx
// Access engine instance and context
const { elastica, addBox, removeBox } = useDomElastica()
const { elastica, registerParticle, unregisterParticle } = useCanvasElastica()

// Control playback
const ref = useRef<DomElasticaRef>(null)
ref.current?.pause()
ref.current?.play()
```

### Update Callback

The `update` function receives physics state each frame:

```tsx
function customUpdate({
  boxes,           // Element data array
  positions,       // [x, y] positions (center)
  velocities,      // [vx, vy] velocities
  externalForces,  // Apply forces here
  deltaTime,       // Fixed timestep
  angles,          // Rotation angles (OBB mode)
  angularVelocities,
  masses,
  bounced,         // Collision flags
  isStatic,
}: UpdateParams) {
  boxes.forEach((_, index) => {
    if (isStatic[index]) return

    const velocity = velocities[index]
    const position = positions[index]

    // Apply gravity
    velocity[1] += 0.001 * deltaTime

    // Integrate position
    position[0] += velocity[0] * deltaTime
    position[1] += velocity[1] * deltaTime
  })
}
```

## Presets

```tsx
import {
  initalConditionsPresets,
  updatePresets,
} from '@darkroom.engineering/elastica/react'

// Initial conditions
initalConditionsPresets.random      // Random positions and velocities
initalConditionsPresets.randomOBB   // Random with rotation (OBB mode)

// Update functions
updatePresets.dvdScreenSaver        // Constant velocity, bounce on edges
updatePresets.dvdScreenSaverOBB     // With rotation
updatePresets.DragAndGravity        // Gravity + drag interaction
updatePresets.rightFlow             // Horizontal flow field
```

## Engine Only

Use the physics engine without React:

```ts
import Elastica from '@darkroom.engineering/elastica'

const engine = new Elastica({
  collisions: true,
  borders: 'rigid',
  useOBB: true,
})

engine.setContainer({ width: 800, height: 600 })

// Physics loop
function tick() {
  engine.update(elements, (instance) => {
    // Apply forces, integrate positions
  })
  requestAnimationFrame(tick)
}
```

## License

MIT
