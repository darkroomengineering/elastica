import type { ContactPoint } from '../types';
import type { ResolutionState } from './types';
/**
 * Returns true when a velocity impulse was applied (the pair was approaching),
 * false for overlap-only frames handled purely by positional correction.
 * Callers use this to record collisions / count bounces only for real
 * contact events — recording raw overlap made touching pairs increment the
 * bounce counter every frame (strobing bounce-reactive UIs).
 */
export declare function resolveContact(state: ResolutionState, indexA: number, indexB: number, contact: ContactPoint): boolean;
