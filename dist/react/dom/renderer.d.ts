/**
 * Injects CSS styles for elastica transforms.
 * Safe to call multiple times - will only inject once.
 */
export declare function injectElasticaStyles(): void;
/**
 * Initializes an element for CSS variable-based positioning.
 * Should be called once per element when it's added to the simulation.
 *
 * This marks the element with data-elastica attribute which:
 * - Applies the CSS transform rule using variables
 * - Sets will-change: transform once (not every frame)
 */
export declare function initializeElement(element: HTMLElement | null | undefined): void;
/**
 * Updates a single element's CSS variables.
 * Called by engine's render callback - no external loop needed.
 */
export declare function renderElement(element: HTMLElement, x: number, y: number, angle: number, scale: number, collisionsEnabled: boolean): void;
