// Track if styles have been injected (module-level singleton)
let stylesInjected = false
let displayScaleWarningShown = false

/**
 * Injects CSS styles for elastica transforms.
 * Safe to call multiple times - will only inject once.
 */
export function injectElasticaStyles(): void {
  if (typeof document === 'undefined') return
  if (stylesInjected) return

  const style = document.createElement('style')
  style.id = 'elastica-css'
  style.textContent =
    '[data-elastica]{transform:translate3d(var(--ex,0),var(--ey,0),0)rotate(var(--er,0))scale(var(--eds,1));will-change:transform}'
  document.head.appendChild(style)
  stylesInjected = true
}

/**
 * Initializes an element for CSS variable-based positioning.
 * Should be called once per element when it's added to the simulation.
 *
 * This marks the element with data-elastica attribute which:
 * - Applies the CSS transform rule using variables
 * - Sets will-change: transform once (not every frame)
 */
export function initializeElement(element: HTMLElement | null | undefined): void {
  if (!element) return
  injectElasticaStyles()
  element.dataset.elastica = ''
}

/**
 * Updates a single element's CSS variables.
 * Called by engine's render callback - no external loop needed.
 */
export function renderElement(
  element: HTMLElement,
  x: number,
  y: number,
  angle: number,
  scale: number,
  collisionsEnabled: boolean
): void {
  element.style.setProperty('--ex', x + 'px')
  element.style.setProperty('--ey', y + 'px')

  if (angle !== 0) {
    element.style.setProperty('--er', angle + 'rad')
  }

  if (scale !== 1) {
    if (collisionsEnabled && !displayScaleWarningShown) {
      console.warn(
        '[Elastica] displayScale is visual-only, collision bounds unchanged'
      )
      displayScaleWarningShown = true
    }
    element.style.setProperty('--eds', String(scale))
  }
}
