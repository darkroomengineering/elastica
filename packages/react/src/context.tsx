'use client'

import type Elastica from '@darkroom.engineering/elastica'
import type { ElementData } from '@darkroom.engineering/elastica'
import { createContext, useContext } from 'react'
import type { CanvasParticleData, Container } from './types'

// Shared context value type
export interface ElasticaContextValue {
  elastica: Elastica
  container: Container | null
  mode: 'dom' | 'canvas'
}

// DOM-specific context extensions
export interface DomElasticaContextValue extends ElasticaContextValue {
  mode: 'dom'
  addBox: (element: HTMLElement, data: ElementData) => void
  removeBox: (element: HTMLElement) => void
}

// Canvas-specific context extensions
export interface CanvasElasticaContextValue extends ElasticaContextValue {
  mode: 'canvas'
  registerParticle: (data: Omit<CanvasParticleData, 'index'>) => number
  unregisterParticle: (index: number) => void
  updateParticle: (index: number, data: Partial<CanvasParticleData>) => void
}

// Union type for either context
export type AnyElasticaContextValue = DomElasticaContextValue | CanvasElasticaContextValue

// Create context with null default
export const ElasticaContext = createContext<AnyElasticaContextValue | null>(null)

// Generic hook to access context
export function useElastica(): AnyElasticaContextValue {
  const context = useContext(ElasticaContext)
  if (!context) {
    throw new Error('useElastica must be used within an Elastica provider (DomElastica or CanvasElastica)')
  }
  return context
}

// Type-safe hooks for specific modes
export function useDomElastica(): DomElasticaContextValue {
  const context = useElastica()
  if (context.mode !== 'dom') {
    throw new Error('useDomElastica must be used within a DomElastica provider')
  }
  return context as DomElasticaContextValue
}

export function useCanvasElastica(): CanvasElasticaContextValue {
  const context = useElastica()
  if (context.mode !== 'canvas') {
    throw new Error('useCanvasElastica must be used within a CanvasElastica provider')
  }
  return context as CanvasElasticaContextValue
}
