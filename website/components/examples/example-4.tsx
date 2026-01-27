'use client'

import {
  BoundaryBox,
  DomElastica,
  type DomElasticaRef,
  type InitialConditionParams,
  type UpdateParams,
} from '@elastica'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react'
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
  thrustPower: 0.4,
  noiseStrength: 0.05,
  noiseSmoothing: 0.05,
  interactionRadius: 60,
  play: true,
}

interface TextPosition {
  x: number
  y: number
  width: number
  height: number
}

// Hook to measure text positions once using browser's native text rendering
function useTextPositions(
  containerRef: RefObject<HTMLElement | null>,
  relativeToRef: RefObject<HTMLElement | null>
): TextPosition[] {
  const [positions, setPositions] = useState<TextPosition[]>([])

  useLayoutEffect(() => {
    const container = containerRef.current
    const relativeTo = relativeToRef.current
    if (!container || !relativeTo) return

    const spans = container.querySelectorAll('span')
    const relativeRect = relativeTo.getBoundingClientRect()

    const measured = Array.from(spans).map((span) => {
      const rect = span.getBoundingClientRect()
      return {
        x: rect.left - relativeRect.left + rect.width / 2,
        y: rect.top - relativeRect.top + rect.height / 2,
        width: rect.width,
        height: rect.height,
      }
    })

    setPositions(measured)
  }, [])

  return positions
}

export function Example4(_props: Example4Props) {
  const elasticaRef = useRef<DomElasticaRef>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const textContainerRef = useRef<HTMLParagraphElement>(null)
  const isFlockingRef = useRef(false)
  const hasInitializedAnglesRef = useRef(false)
  const smoothedNoiseRef = useRef<number[]>([])
  const warmupRef = useRef(0) // Ramps from 0 to 1 for smooth start
  const params = useTweakpane(initialParams, (value) => {
    if (value) {
      elasticaRef.current?.play()
    } else {
      elasticaRef.current?.pause()
    }
  })

  const words = useMemo(() => {
    const paragraph = `Elastica is a lightweight physics engine for the web. It enables real-time collision detection and response using spatial hashing for optimal performance. Build interactive experiences with elastic collisions, boundary constraints, and smooth animations. Perfect for creative coding, data visualization, and playful interfaces.`
    return paragraph.split(/\s+/).map((word) => ({ name: word }))
  }, [])

  // Get measured positions from the hidden text layer, relative to the section
  const measuredPositions = useTextPositions(textContainerRef, sectionRef)

  // Create initial condition callback using measured positions
  const initialCondition = useCallback(
    ({ positions, velocities, angles, angularVelocities }: InitialConditionParams) => {
      measuredPositions.forEach((pos, index) => {
        positions[index] = [pos.x, pos.y]
        velocities[index] = [0, 0]
        angles[index] = 0
        angularVelocities[index] = 0
      })
    },
    [measuredPositions]
  )

  const handleStartFlocking = useCallback(() => {
    isFlockingRef.current = true
  }, [])

  return (
    <section
      ref={sectionRef}
      className='fixed inset-0 w-full h-full cursor-pointer grid grid-cols-[1fr]'
      onClick={handleStartFlocking}
    >
      {/* Text layer for measuring actual browser text positions (always hidden) */}
      <div className='row-start-1 col-start-1 w-full h-full flex items-center justify-center invisible'>
        <p
          ref={textContainerRef}
          className='text-contrast dr-text-24 dr-p-96'
        >
          {words.flatMap(({ name }, index) => [
            <span key={index}>{name}</span>,
            index < words.length - 1 ? ' ' : null,
          ])}
        </p>
      </div>
      <DomElastica
        ref={elasticaRef}
        className='row-start-1 col-start-1 w-full h-full'
        config={params}
        initialCondition={initialCondition}
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

          // Smoothly ramp up physics over ~1 second
          const warmupSpeed = 0.01 // How fast to ramp up (per ms)
          warmupRef.current = Math.min(1, warmupRef.current + warmupSpeed * deltaTime)
          const warmup = warmupRef.current * warmupRef.current // Ease-in curve

          // On first flocking frame, add tiny random angles to break symmetry
          if (!hasInitializedAnglesRef.current) {
            hasInitializedAnglesRef.current = true
            angles.forEach((_, index) => {
              // Small random offset, not full randomization - enough for Vicsek to differentiate
              angles[index] = (Math.random() - 0.5) * 0.01
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
            
            let vicsekAngle: number
            if (neighbors.length === 0) {
              // No neighbors: just add smoothed noise to current angle
              vicsekAngle = currentAngle + smoothedNoise
            } else {
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
              
              // Average angle (including self) + noise
              vicsekAngle = Math.atan2(sumSin, sumCos) + smoothedNoise
            }
            
            // Smoothly blend toward Vicsek angle using warmup
            return currentAngle + (vicsekAngle - currentAngle) * warmup
          })
          
          // Second pass: Apply new angles and update positions
          boxes.forEach(({ element }, index) => {
            const position = positions[index]
            const newAngle = newAngles[index]
            if (!position || newAngle === undefined) return

            // Update angle to Vicsek-averaged angle
            angles[index] = newAngle

            // Self-propulsion displacement (scaled by warmup for smooth start)
            const thrust: [number, number] = [
              Math.cos(newAngle) * params.thrustPower * deltaTime * warmup,
              Math.sin(newAngle) * params.thrustPower * deltaTime * warmup,
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
      >
        {words.map(({ name }, index) => (
          <BoundaryBox
            key={index}
            className='absolute inset-0 w-fit h-fit text-contrast dr-text-24'
          >
            {name}
          </BoundaryBox>
        ))}
      </DomElastica>
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