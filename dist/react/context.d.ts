import type Elastica from '@darkroom.engineering/elastica';
import type { ElementData } from '@darkroom.engineering/elastica';
import type { CanvasParticleData, Container } from './types';
export interface ElasticaContextValue {
    elastica: Elastica;
    container: Container | null;
    mode: 'dom' | 'canvas';
}
export interface DomElasticaContextValue extends ElasticaContextValue {
    mode: 'dom';
    addBox: (element: HTMLElement, data: ElementData) => void;
    removeBox: (element: HTMLElement) => void;
}
export interface CanvasElasticaContextValue extends ElasticaContextValue {
    mode: 'canvas';
    registerParticle: (data: Omit<CanvasParticleData, 'index'>) => number;
    unregisterParticle: (index: number) => void;
    updateParticle: (index: number, data: Partial<CanvasParticleData>) => void;
}
export type AnyElasticaContextValue = DomElasticaContextValue | CanvasElasticaContextValue;
export declare const ElasticaContext: import("react").Context<AnyElasticaContextValue | null>;
export declare function useElastica(): AnyElasticaContextValue;
export declare function useDomElastica(): DomElasticaContextValue;
export declare function useCanvasElastica(): CanvasElasticaContextValue;
