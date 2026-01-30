/**
 * Renderer interface for decoupling physics from presentation.
 */
export interface Renderer {
    /** One-time initialization for an element */
    initializeElement(element: HTMLElement | null | undefined): void;
    /** Update element position/rotation */
    setPosition(element: HTMLElement | null | undefined, transform: {
        x: number;
        y: number;
        angle: number;
        scale: number;
    }, index: number, isStatic: boolean): void;
    /** Called once before any rendering begins */
    injectStyles?(): void;
}
/**
 * No-op renderer for canvas mode or headless usage.
 */
export declare class NullRenderer implements Renderer {
    initializeElement(): void;
    setPosition(): void;
}
/**
 * DOM renderer using CSS custom properties for efficient transforms.
 */
export declare class DOMRenderer implements Renderer {
    private static stylesInjected;
    private displayScaleWarningShown;
    private collisionsEnabled;
    constructor(collisionsEnabled?: boolean);
    injectStyles(): void;
    initializeElement(element: HTMLElement | null | undefined): void;
    setPosition(element: HTMLElement | null | undefined, { x, y, angle, scale }: {
        x: number;
        y: number;
        angle: number;
        scale: number;
    }, index: number, isStatic: boolean): void;
}
