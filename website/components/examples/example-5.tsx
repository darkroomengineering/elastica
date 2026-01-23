'use client'

import { CanvasBox, CanvasElastica } from '@elastica'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Pane } from 'tweakpane'

// =============================================================================
// Types
// =============================================================================

interface SampledPosition {
  x: number
  y: number
}

interface TextSampleResult {
  positions: SampledPosition[]
  width: number
  height: number
}

// =============================================================================
// Text Sampling
// =============================================================================

function sampleTextPositions(
  text: string,
  font: string,
  fontSize: number,
  sampleCount: number
): TextSampleResult {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return { positions: [], width: 0, height: 0 }
  }

  ctx.font = `${fontSize}px ${font}`
  const metrics = ctx.measureText(text)

  const padding = 20
  canvas.width = Math.ceil(metrics.width) + padding * 2
  canvas.height = Math.ceil(fontSize * 1.5) + padding * 2

  ctx.fillStyle = 'white'
  ctx.font = `${fontSize}px ${font}`
  ctx.textBaseline = 'middle'
  ctx.fillText(text, padding, canvas.height / 2)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const pixels = imageData.data

  const filledPixels: SampledPosition[] = []
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const index = (y * canvas.width + x) * 4
      const alpha = pixels[index + 3]
      if (alpha !== undefined && alpha > 128) {
        filledPixels.push({ x, y })
      }
    }
  }

  const positions: SampledPosition[] = []
  if (filledPixels.length > 0) {
    for (let i = 0; i < sampleCount; i++) {
      const randomIndex = Math.floor(Math.random() * filledPixels.length)
      const pixel = filledPixels[randomIndex]
      if (pixel) {
        positions.push({
          x: pixel.x + (Math.random() - 0.5) * 2,
          y: pixel.y + (Math.random() - 0.5) * 2,
        })
      }
    }
  }

  return { positions, width: canvas.width, height: canvas.height }
}

function sampleMultipleTexts(
  words: string[],
  font: string,
  fontSize: number,
  sampleCount: number
): Map<string, TextSampleResult> {
  const results = new Map<string, TextSampleResult>()
  for (const word of words) {
    results.set(word, sampleTextPositions(word, font, fontSize, sampleCount))
  }
  return results
}

// =============================================================================
// Uniform Ellipse Distribution (by arc length)
// =============================================================================

function computeUniformEllipseAngles(
  count: number,
  radiusX: number,
  radiusY: number
): number[] {
  const samples = 1000
  const arcLengths: number[] = [0]

  for (let i = 1; i <= samples; i++) {
    const prevAngle = ((i - 1) / samples) * Math.PI * 2
    const currAngle = (i / samples) * Math.PI * 2
    const x1 = Math.cos(prevAngle) * radiusX
    const y1 = Math.sin(prevAngle) * radiusY
    const x2 = Math.cos(currAngle) * radiusX
    const y2 = Math.sin(currAngle) * radiusY
    const segmentLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
    arcLengths.push(arcLengths[arcLengths.length - 1]! + segmentLength)
  }

  const totalLength = arcLengths[arcLengths.length - 1]!
  const angles: number[] = []

  for (let i = 0; i < count; i++) {
    const targetLength = (i / count) * totalLength
    let sampleIndex = arcLengths.findIndex((len) => len >= targetLength)
    if (sampleIndex === -1) sampleIndex = samples
    angles.push((sampleIndex / samples) * Math.PI * 2)
  }

  // Fisher-Yates shuffle for visual variety
  for (let i = angles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = angles[i]!
    angles[i] = angles[j]!
    angles[j] = temp
  }

  return angles
}

// =============================================================================
// Easing Functions
// =============================================================================

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

// =============================================================================
// Configuration
// =============================================================================

interface Params {
  wordInDuration: number
  wordHoldDuration: number
  wordOutDuration: number
  stagger: number
  ellipseRadiusX: number
  ellipseRadiusY: number
  cloudNoise: number
  lerpSpeed: number
  play: boolean
}

const initialParams: Params = {
  wordInDuration: 3500,
  wordHoldDuration: 0,
  wordOutDuration: 700,
  stagger: 0.65,
  ellipseRadiusX: 600,
  ellipseRadiusY: 250,
  cloudNoise: 50,
  lerpSpeed: 0.15,
  play: true,
}

const WORDS = ['ELASTICA', 'DARKROOM', 'ENGINEERING']
const PARTICLES_PER_WORD = 500
const PARTICLE_COUNT = WORDS.length * PARTICLES_PER_WORD
const FONT = 'Arial, sans-serif'
const FONT_SIZE = 120
const PARTICLE_HEIGHT = 3

// Pre-computed particle data (generated once at module level)
const particleWidths = Array.from({ length: PARTICLE_COUNT }, () => 3 + Math.random() * 6)
const particleAngles = computeUniformEllipseAngles(
  PARTICLE_COUNT,
  initialParams.ellipseRadiusX,
  initialParams.ellipseRadiusY
)
const particleNoiseRadial = Array.from({ length: PARTICLE_COUNT }, () => (Math.random() - 0.5) * 2)
const particleNoiseAngular = Array.from({ length: PARTICLE_COUNT }, () => (Math.random() - 0.5) * 0.15)
const particleWordIndices = Array.from({ length: PARTICLE_COUNT }, (_, i) => Math.floor(i / PARTICLES_PER_WORD))
const particleLocalIndices = Array.from({ length: PARTICLE_COUNT }, (_, i) => i % PARTICLES_PER_WORD)
const particleCos = Array.from({ length: PARTICLE_COUNT }, (_, i) =>
  Math.cos((particleAngles[i] ?? 0) + (particleNoiseAngular[i] ?? 0))
)
const particleSin = Array.from({ length: PARTICLE_COUNT }, (_, i) =>
  Math.sin((particleAngles[i] ?? 0) + (particleNoiseAngular[i] ?? 0))
)

// =============================================================================
// Word Animation State
// =============================================================================

type WordPhase = 'cloud' | 'animating-in' | 'visible' | 'animating-out'

interface WordState {
  phase: WordPhase
  progress: number
}

function calculateWordState(wordIndex: number, cycleTime: number, params: Params): WordState {
  const { wordInDuration, wordHoldDuration, wordOutDuration, stagger } = params
  const staggerDelay = stagger * (wordInDuration + wordHoldDuration)
  const wordStartTime = wordIndex * staggerDelay
  const wordLocalTime = cycleTime - wordStartTime

  if (wordLocalTime < 0) {
    return { phase: 'cloud', progress: 0 }
  }

  if (wordLocalTime < wordInDuration) {
    return { phase: 'animating-in', progress: wordLocalTime / wordInDuration }
  }

  const holdStart = wordInDuration
  if (wordLocalTime < holdStart + wordHoldDuration) {
    return { phase: 'visible', progress: (wordLocalTime - holdStart) / wordHoldDuration }
  }

  const outStart = holdStart + wordHoldDuration
  if (wordLocalTime < outStart + wordOutDuration) {
    return { phase: 'animating-out', progress: (wordLocalTime - outStart) / wordOutDuration }
  }

  return { phase: 'cloud', progress: 1 }
}

function calculateTotalCycleDuration(params: Params): number {
  const { wordInDuration, wordHoldDuration, wordOutDuration, stagger } = params
  const staggerDelay = stagger * (wordInDuration + wordHoldDuration)
  const lastWordStart = (WORDS.length - 1) * staggerDelay
  const lastWordDuration = wordInDuration + wordHoldDuration + wordOutDuration
  return lastWordStart + lastWordDuration
}

// =============================================================================
// Component
// =============================================================================

interface Example5Props {
  data?: Array<{ name: string }>
}

export function Example5(_props: Example5Props) {
  const [isClient, setIsClient] = useState(false)
  const paramsRef = useRef<Params>({ ...initialParams })
  const isPlayingRef = useRef(true)
  const cycleStartTimeRef = useRef(0)
  const lastFrameTimeRef = useRef(0)
  const sampledPositionsRef = useRef<Map<string, TextSampleResult>>(new Map())
  const textOffsetsRef = useRef<Map<string, { offsetX: number; offsetY: number }>>(new Map())

  // Generate CanvasBox components with pre-computed widths
  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => (
      <CanvasBox
        key={i}
        width={particleWidths[i]!}
        height={PARTICLE_HEIGHT}
        shape="rect"
        fill="#ffffff"
      />
    ))
  }, [])

  // Initialize on client
  useEffect(() => {
    setIsClient(true)
    cycleStartTimeRef.current = performance.now()
    lastFrameTimeRef.current = performance.now()

    // Sample text positions
    sampledPositionsRef.current = sampleMultipleTexts(WORDS, FONT, FONT_SIZE, PARTICLES_PER_WORD)
  }, [])

  // Tweakpane setup
  useEffect(() => {
    if (!isClient) return

    const pane = new Pane()
    const localParams = { ...initialParams }

    const timingFolder = pane.addFolder({ title: 'Timing' })
    timingFolder.addBinding(localParams, 'wordInDuration', { label: 'Animate In (ms)', min: 500, max: 4000, step: 100 })
      .on('change', (ev) => { paramsRef.current.wordInDuration = ev.value })
    timingFolder.addBinding(localParams, 'wordHoldDuration', { label: 'Hold (ms)', min: 0, max: 2000, step: 100 })
      .on('change', (ev) => { paramsRef.current.wordHoldDuration = ev.value })
    timingFolder.addBinding(localParams, 'wordOutDuration', { label: 'Animate Out (ms)', min: 500, max: 3000, step: 100 })
      .on('change', (ev) => { paramsRef.current.wordOutDuration = ev.value })
    timingFolder.addBinding(localParams, 'stagger', { label: 'Stagger', min: 0, max: 1, step: 0.05 })
      .on('change', (ev) => { paramsRef.current.stagger = ev.value })

    const appearanceFolder = pane.addFolder({ title: 'Appearance' })
    appearanceFolder.addBinding(localParams, 'ellipseRadiusX', { label: 'Ellipse X', min: 100, max: 600, step: 10 })
      .on('change', (ev) => { paramsRef.current.ellipseRadiusX = ev.value })
    appearanceFolder.addBinding(localParams, 'ellipseRadiusY', { label: 'Ellipse Y', min: 50, max: 400, step: 10 })
      .on('change', (ev) => { paramsRef.current.ellipseRadiusY = ev.value })
    appearanceFolder.addBinding(localParams, 'cloudNoise', { label: 'Cloud Noise', min: 0, max: 150, step: 5 })
      .on('change', (ev) => { paramsRef.current.cloudNoise = ev.value })
    appearanceFolder.addBinding(localParams, 'lerpSpeed', { label: 'Lerp Speed', min: 0.05, max: 0.3, step: 0.01 })
      .on('change', (ev) => { paramsRef.current.lerpSpeed = ev.value })

    pane.addBinding(localParams, 'play', { label: 'Play' })
      .on('change', (ev) => { isPlayingRef.current = ev.value })

    return () => pane.dispose()
  }, [isClient])

  if (!isClient) {
    return <section className="fixed inset-0 w-full h-full" />
  }

  return (
    <section className="fixed inset-0 w-full h-full">
      <CanvasElastica
        className="w-full h-full"
        config={{ collisions: false, borders: false }}
        initialCondition={({ positions, container }) => {
          const centerX = container.width / 2
          const centerY = container.height / 2
          const params = paramsRef.current

          // Update text offsets for centering
          for (const word of WORDS) {
            const sample = sampledPositionsRef.current.get(word)
            if (sample) {
              textOffsetsRef.current.set(word, {
                offsetX: (container.width - sample.width) / 2,
                offsetY: (container.height - sample.height) / 2,
              })
            }
          }

          // Initialize all particles on the cloud ellipse
          for (let i = 0; i < positions.length; i++) {
            const radialNoise = particleNoiseRadial[i]! * params.cloudNoise
            const cloudX = centerX + particleCos[i]! * (params.ellipseRadiusX + radialNoise)
            const cloudY = centerY + particleSin[i]! * (params.ellipseRadiusY + radialNoise)
            positions[i] = [cloudX, cloudY]
          }
        }}
        update={({ positions, container, deltaTime }) => {
          if (!isPlayingRef.current) return

          const now = performance.now()
          const params = paramsRef.current
          const centerX = container.width / 2
          const centerY = container.height / 2

          // Calculate cycle time
          const totalCycleDuration = calculateTotalCycleDuration(params)
          let cycleTime = now - cycleStartTimeRef.current

          if (cycleTime >= totalCycleDuration) {
            cycleStartTimeRef.current = now
            cycleTime = 0
          }

          const lerpSpeed = params.lerpSpeed
          const radiusX = params.ellipseRadiusX
          const radiusY = params.ellipseRadiusY
          const cloudNoise = params.cloudNoise

          for (let i = 0; i < positions.length; i++) {
            const wordIndex = particleWordIndices[i]!
            const localIndex = particleLocalIndices[i]!
            const word = WORDS[wordIndex]!

            const sample = sampledPositionsRef.current.get(word)
            if (!sample) continue

            const particlePos = sample.positions[localIndex]
            if (!particlePos) continue

            const offsets = textOffsetsRef.current.get(word)
            if (!offsets) continue

            // Text position (centered)
            const textX = particlePos.x + offsets.offsetX
            const textY = particlePos.y + offsets.offsetY

            // Cloud position (on ellipse with noise)
            const radialNoise = particleNoiseRadial[i]! * cloudNoise
            const cloudX = centerX + particleCos[i]! * (radiusX + radialNoise)
            const cloudY = centerY + particleSin[i]! * (radiusY + radialNoise)

            // Get word state and calculate target
            const wordState = calculateWordState(wordIndex, cycleTime, params)

            let targetX: number
            let targetY: number

            switch (wordState.phase) {
              case 'cloud':
                targetX = cloudX
                targetY = cloudY
                break
              case 'animating-in': {
                const t = easeOutCubic(wordState.progress)
                targetX = cloudX + (textX - cloudX) * t
                targetY = cloudY + (textY - cloudY) * t
                break
              }
              case 'visible':
                targetX = textX
                targetY = textY
                break
              case 'animating-out': {
                const t = easeInCubic(wordState.progress)
                targetX = textX + (cloudX - textX) * t
                targetY = textY + (cloudY - textY) * t
                break
              }
            }

            // Lerp toward target (frame-rate independent)
            const pos = positions[i]!
            const t = 1 - Math.pow(1 - lerpSpeed, deltaTime / 16.67)
            positions[i] = [
              pos[0] + (targetX - pos[0]) * t,
              pos[1] + (targetY - pos[1]) * t,
            ]
          }
        }}
      >
        {particles}
      </CanvasElastica>
    </section>
  )
}
