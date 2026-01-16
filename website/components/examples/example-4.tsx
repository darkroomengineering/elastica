'use client'

import type { InitialConditionParams } from '@elastica'
import ReactElastica, {
  BoundaryBox,
  type ReactElasticaRef,
  type UpdateParams,
} from '@elastica'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pane } from 'tweakpane'

interface Example4Props {
  data: Array<{ name: string }>
}

interface Example4Params {
  gridSize: number
  collisions: boolean
  borders: 'rigid' | 'periodic'
  useOBB: boolean
  thrustPower: number
  noiseStrength: number
  noiseSmoothing: number
  interactionRadius: number
  play: boolean
}

const initialParams: Example4Params = {
  gridSize: 5,
  collisions: true,
  borders: 'periodic',
  useOBB: true,
  thrustPower: 0.3,
  noiseStrength: 0.05,
  noiseSmoothing: 0.05,
  interactionRadius: 60,
  play: true,
}

// Custom initial condition that arranges elements in a paragraph-like layout
function paragraphInitialCondition({
  boxes,
  positions,
  velocities,
  angles,
  angularVelocities,
  container,
}: InitialConditionParams): void {
  const padding = 200
  const lineHeight = 20
  const wordGap = 16

  let currentX = padding
  let currentY = padding + lineHeight / 2
  const maxWidth = container.width - padding * 2

  boxes.forEach((box, index) => {
    if (!box?.rect) {
      positions[index] = [padding, currentY]
      velocities[index] = [0, 0]
      angles[index] = 0
      angularVelocities[index] = 0
      return
    }

    const wordWidth = box.rect.width

    // Check if word fits on current line
    if (currentX + wordWidth > maxWidth && currentX > padding) {
      // Wrap to next line
      currentX = padding
      currentY += lineHeight
    }

    // Set position (center of word)
    positions[index] = [
      currentX + wordWidth / 2,
      currentY,
    ]

    // Move cursor for next word
    currentX += wordWidth + wordGap

    // Initialize physics properties (stationary, no rotation)
    // Angles will be randomized on first flocking frame
    velocities[index] = [0, 0]
    angles[index] = 0
    angularVelocities[index] = 0
  })
}

export function Example4(_props: Example4Props) {
  const elasticaRef = useRef<ReactElasticaRef>(null)
  const isFlockingRef = useRef(false)
  const hasInitializedAnglesRef = useRef(false)
  const smoothedNoiseRef = useRef<number[]>([])
  const params = useTweakpane(initialParams, (value) => {
    if (value) {
      elasticaRef.current?.play()
    } else {
      elasticaRef.current?.pause()
    }
  })

  const words = useMemo(() => {
    const paragraph = `The quick brown fox jumps over the lazy dog. Physics simulations bring text to life through elegant mathematical models. Each word becomes a particle dancing in harmony with its neighbors. Flocking behavior emerges from simple rules creating mesmerizing patterns.`
    return paragraph.split(/\s+/).map((word) => ({ name: word }))
  }, [])

  const handleStartFlocking = useCallback(() => {
    isFlockingRef.current = true
  }, [])

  return (
    <section
      className='fixed inset-0 w-full h-full cursor-pointer'
      onClick={handleStartFlocking}
    >
      <ReactElastica
        config={params}
        initialCondition={paragraphInitialCondition}
        update={({
          boxes,
          positions,
          velocities,
          angles,
          deltaTime,
          hash,
          gridSize,
          bounced,
        }: UpdateParams) => {
          // Skip flocking logic until user triggers it
          if (!isFlockingRef.current) return

          // On first flocking frame, randomize angles to break symmetry
          if (!hasInitializedAnglesRef.current) {
            hasInitializedAnglesRef.current = true
            angles.forEach((_, index) => {
              angles[index] = Math.random() * Math.PI * 2
            })
          }

          // First pass: Calculate new angles using Vicsek model
          // θᵢ(t+1) = ⟨θⱼ(t)⟩neighbors + η
          const newAngles = angles.map((currentAngle, index) => {
            if (currentAngle === undefined) return 0
            
            // Calculate smoothed noise using exponential filter (low-pass)
            const targetNoise = (Math.random() - 0.5) * 2 * params.noiseStrength
            const prevNoise = smoothedNoiseRef.current[index] ?? 0
            const smoothedNoise = prevNoise + (targetNoise - prevNoise) * params.noiseSmoothing
            smoothedNoiseRef.current[index] = smoothedNoise
            
            // Find neighbors within interaction radius using spatial hash
            const neighbors = findNeighborsInRadius(
              index,
              positions,
              hash,
              gridSize,
              params.interactionRadius
            )
            
            if (neighbors.length === 0) {
              // No neighbors: just add smoothed noise to current angle
              return currentAngle + smoothedNoise
            }
            
            // Calculate average angle using circular mean
            // This is important for angles to avoid discontinuity at 0/2π
            let sumSin = Math.sin(currentAngle)
            let sumCos = Math.cos(currentAngle)
            
            neighbors.forEach((neighborIndex) => {
              const neighborAngle = angles[neighborIndex]
              if (neighborAngle !== undefined) {
                sumSin += Math.sin(neighborAngle)
                sumCos += Math.cos(neighborAngle)
              }
            })
            
            // Average angle (including self)
            const avgAngle = Math.atan2(sumSin, sumCos)
            
            // Add smoothed noise (Vicsek model with low-pass filter)
            return avgAngle + smoothedNoise
          })
          
          // Second pass: Apply new angles and update positions
          boxes.forEach(({ element }, index) => {
            const position = positions[index]
            const newAngle = newAngles[index]
            if (!position || newAngle === undefined) return

            // Update angle to Vicsek-averaged angle
            angles[index] = newAngle

            // Self-propulsion displacement
            const thrust: [number, number] = [
              Math.cos(newAngle) * params.thrustPower * deltaTime,
              Math.sin(newAngle) * params.thrustPower * deltaTime,
            ]

            // Update position
            const newPosition: [number, number] = [
              position[0] + thrust[0],
              position[1] + thrust[1],
            ]

            positions[index] = newPosition

            // Update velocity for collision system
            if (deltaTime > 0) {
              velocities[index] = [
                thrust[0] / deltaTime,
                thrust[1] / deltaTime,
              ]
            }

            // Visual feedback for collisions
            const bounce = bounced[index]
            if (element) {
              if (bounce !== undefined && bounce % 2 !== 0) {
                element.dataset.bounced = 'true'
              } else {
                element.dataset.bounced = 'false'
              }
            }
          })
        }}
        ref={elasticaRef}
      >
        {words.map(({ name }, index) => (
          <BoundaryBox
            key={index}
            className='absolute inset-0 w-fit h-fit text-contrast dr-text-24'
          >
            {name}
          </BoundaryBox>
        ))}
      </ReactElastica>
    </section>
  )
}

// Helper function to check if two indices are in neighboring hash cells
function isNeighbor(
  hashA: number,
  hashB: number,
  gridSize: number
): boolean {
  for (let i = -1; i < 2; i++) {
    for (let j = -1; j < 2; j++) {
      const box = hashA + gridSize * i + j
      if (box < 0 || box > gridSize * gridSize) {
        continue
      }
      if (box === hashB) {
        return true
      }
    }
  }
  return false
}

// Helper function to find neighbors within radius using spatial hash
function findNeighborsInRadius(
  index: number,
  positions: [number, number][],
  hash: number[],
  gridSize: number,
  radius: number
): number[] {
  const neighbors: number[] = []
  const position = positions[index]
  const myHash = hash[index]
  
  if (!position || myHash === undefined) return neighbors
  
  const radiusSquared = radius * radius
  
  // Only check boxes in neighboring hash cells
  for (let i = 0; i < positions.length; i++) {
    if (i === index) continue
    
    const otherHash = hash[i]
    if (otherHash === undefined) continue
    
    // Skip if not in neighboring cells (using spatial hash optimization)
    if (!isNeighbor(myHash, otherHash, gridSize)) continue
    
    const otherPos = positions[i]
    if (!otherPos) continue
    
    // Calculate distance
    const dx = otherPos[0] - position[0]
    const dy = otherPos[1] - position[1]
    const distSquared = dx * dx + dy * dy
    
    if (distSquared < radiusSquared) {
      neighbors.push(i)
    }
  }
  
  return neighbors
}

function useTweakpane(
  paneParams: Example4Params,
  callback: (value: boolean) => void
) {
  const [params, setParams] = useState(paneParams)

  useEffect(() => {
    const pane = new Pane()
    const localParams = { ...paneParams }

    pane
      .addBinding(localParams, 'thrustPower', {
        label: 'Thrust Power',
        min: 0,
        max: 1,
        step: 0.01,
      })
      .on('change', (ev) => {
        setParams((prev) => ({
          ...prev,
          thrustPower: ev.value,
        }))
      })

    pane
      .addBinding(localParams, 'noiseStrength', {
        label: 'Noise Strength',
        min: 0,
        max: 2,
        step: 0.01,
      })
      .on('change', (ev) => {
        setParams((prev) => ({
          ...prev,
          noiseStrength: ev.value,
        }))
      })

    pane
      .addBinding(localParams, 'noiseSmoothing', {
        label: 'Noise Smoothing',
        min: 0.01,
        max: 0.3,
        step: 0.01,
      })
      .on('change', (ev) => {
        setParams((prev) => ({
          ...prev,
          noiseSmoothing: ev.value,
        }))
      })

    pane
      .addBinding(localParams, 'interactionRadius', {
        label: 'Interaction Radius',
        min: 50,
        max: 500,
        step: 10,
      })
      .on('change', (ev) => {
        setParams((prev) => ({
          ...prev,
          interactionRadius: ev.value,
        }))
      })

    pane
      .addBinding(localParams, 'collisions', {
        label: 'Collisions',
      })
      .on('change', (ev) => {
        setParams((prev) => ({
          ...prev,
          collisions: ev.value,
        }))
      })

    pane
      .addBinding(localParams, 'borders', {
        label: 'Borders',
        options: { rigid: 'rigid', periodic: 'periodic' },
      })
      .on('change', (ev) => {
        setParams((prev) => ({
          ...prev,
          borders: ev.value as 'rigid' | 'periodic',
        }))
      })

    pane
      .addBinding(localParams, 'useOBB', {
        label: 'Use OBB',
      })
      .on('change', (ev) => {
        setParams((prev) => ({
          ...prev,
          useOBB: ev.value,
        }))
      })

    pane
      .addBinding(localParams, 'play', {
        label: 'Play',
      })
      .on('change', (ev) => {
        callback(ev.value)
      })

    return () => {
      pane.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return params
}