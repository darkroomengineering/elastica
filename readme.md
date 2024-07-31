# Elastica

<br/>

Warning: Still in development mode and API might change

<br/>

## Introduction

Elastica is a JavaScript library providing a physics engine for simulating elastic collision using Aligned axis bounding boxes (AABBs) and grid hash for efficient collision detection. It has a React wrapper which provides hooks and components for managing the state and interactions of your elements. Apply your own Cinematic equation for position and velocity of particles.

## Installation

### JavaScript

using a package manager:
npm install

```bash
npm i @darkroom.engineering/elastica
```

```js
import ReactElastica, {
  AxisAlignedBoundaryBox,
} from '@darkroom.engineering/elastica'
```

<br/>

## Setup

### React

```js
import ReactElastica, {
  AxisAlignedBoundaryBox,
  initalConditionsPresets,
  updatePresets,
} from '@darkroom.engineering/elastica'
```

<br/>

```js
<ReactElastica
  config={{
    collisions: true,
    borders: 'rigid',
  }}
  initialCondition={initalConditionsPresets.random}
  update={updatePresets.dvdScreenSaver}
>
  {[{ name: 'DVD' }].map(({ name }, index) => (
    <AxisAlignedBoundaryBox key={index}>{name}</AxisAlignedBoundaryBox>
  ))}
</ReactElastica>
```

<br/>

## API

### ReactElastica

| **Prop**              | **Type**    | **Default** | **Description**                                                                                                                                                                                             |
| --------------------- | ----------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `children`            | `ReactNode` | N/A         | Represents the child elements or components rendered within the `ReactElastica` component. These elements are part of the elastic collision simulation.                                                     |
| `className`           | `string`    | N/A         | Specifies a CSS class for styling the `ReactElastica` container, allowing custom styling and theming.                                                                                                       |
| `config`              | `object`    | See below   | Configuration object controlling various aspects of the physics simulation.                                                                                                                                 |
| └─ `gridSize`         | `number`    | `8`         | Defines the size of the hash grid, bigger grid reduces number of computation by collisions.                                                                                                                 |
| └─ `collisions`       | `boolean`   | `true`      | Enables or disables collision detection between elements.                                                                                                                                                   |
| └─ `borders`          | `string`    | `'rigid'`   | Defines the border behavior. `'rigid'` indicates immovable borders, preventing objects from passing through the container's edges. `'Periodic'` translates elements to opposite border when reaching limit. |
| └─ `containerOffsets` | `object`    | See below   | Specifies the offsets from the container's edges for the simulation area, allowing for padding or margins.                                                                                                  |
| └─ `top`              | `number`    | `0`         | Top offset.                                                                                                                                                                                                 |
| └─ `bottom`           | `number`    | `0`         | Bottom offset.                                                                                                                                                                                              |
| └─ `left`             | `number`    | `0`         | Left offset.                                                                                                                                                                                                |
| └─ `right`            | `number`    | `0`         | Right offset.                                                                                                                                                                                               |
| `initialCondition`    | `function`  | `() => {}`  | Function to set the initial conditions of the simulation, such as starting positions and velocities of elements. It is called once when the component mounts. Engine instance Class passed as props         |
| `update`              | `function`  | `() => {}`  | Callback function called on each simulation update, where cinematic equations have to be applied to each element. Engine instance Class passed as props.                                                    |

### Aligned Axis Boundary Box

| **Prop**    | **Type**    | **Default** | **Description**                                                                                                                                                    |
| ----------- | ----------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `className` | `string`    | N/A         | Specifies a CSS class for styling the boundary box. This allows for custom styling of the container holding the children elements.                                 |
| `children`  | `ReactNode` | N/A         | Represents the child elements or components that will be enclosed within the boundary box. These children are subject to the constraints of the boundary box.      |
| `...props`  | `object`    | N/A         | Additional props that can be passed to the component. These props can include any other attributes or handlers needed for the custom behavior of the boundary box. |

### useElastica

Hook that exposes the Elastica instance and provides a set of functions for managing the simulation.

### initalConditionsPresets

Object containing preset functions for setting initial conditions of the simulation.

### updatePresets

Object containing preset functions for updating the simulation.

<br/>

## Examples

For more examples check [elastica](https://elastica.darkroom.engineering/)
