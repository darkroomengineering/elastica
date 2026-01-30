/**
 * Renderer interface for decoupling physics from presentation.
 */
export interface Renderer {
  /** One-time initialization for an element */
  initializeElement(element: HTMLElement | null | undefined): void

  /** Update element position/rotation */
  setPosition(
    element: HTMLElement | null | undefined,
    transform: { x: number; y: number; angle: number; scale: number },
    index: number,
    isStatic: boolean
  ): void

  /** Called once before any rendering begins */
  injectStyles?(): void
}

/**
 * No-op renderer for canvas mode or headless usage.
 */
export class NullRenderer implements Renderer {
  initializeElement(): void {}
  setPosition(): void {}
}

/**
 * DOM renderer using CSS custom properties for efficient transforms.
 */
export class DOMRenderer implements Renderer {
  private static stylesInjected = false
  private displayScaleWarningShown = false
  private collisionsEnabled: boolean

  constructor(collisionsEnabled: boolean = true) {
    this.collisionsEnabled = collisionsEnabled
  }

  injectStyles(): void {
    if (typeof document === 'undefined') return
    if (DOMRenderer.stylesInjected) return

    const style = document.createElement('style')
    style.id = 'elastica-css'
    style.textContent =
      '[data-elastica]{transform:translate3d(var(--ex,0),var(--ey,0),0)rotate(var(--er,0))scale(var(--eds,1));will-change:transform}'
    document.head.appendChild(style)
    DOMRenderer.stylesInjected = true
  }

  initializeElement(element: HTMLElement | null | undefined): void {
    if (!element) return
    this.injectStyles()
    element.dataset.elastica = ''
  }

  setPosition(
    element: HTMLElement | null | undefined,
    { x, y, angle, scale }: { x: number; y: number; angle: number; scale: number },
    index: number,
    isStatic: boolean
  ): void {
    if (!element || isStatic) return

    element.style.setProperty('--ex', x + 'px')
    element.style.setProperty('--ey', y + 'px')

    if (angle !== 0) {
      element.style.setProperty('--er', angle + 'rad')
    }

    if (scale !== 1) {
      if (this.collisionsEnabled && !this.displayScaleWarningShown) {
        console.warn(
          '[Elastica] displayScale is visual-only, collision bounds unchanged'
        )
        this.displayScaleWarningShown = true
      }
      element.style.setProperty('--eds', String(scale))
    }
  }
}
