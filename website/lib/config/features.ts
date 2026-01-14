/**
 * Centralized Feature Detection
 */

export const features = {
  // WebGL / 3D Graphics - disabled by default
  webgl: Boolean(process.env.NEXT_PUBLIC_ENABLE_WEBGL),

  // Development Tools (always false in production)
  devtools: process.env.NODE_ENV === 'development',
} as const

export type Features = typeof features
export type FeatureName = keyof Features

export const isFeatureEnabled = (feature: FeatureName): boolean => {
  return features[feature]
}

export const getEnabledFeatures = (): FeatureName[] => {
  return Object.keys(features).filter(
    (key) => features[key as FeatureName]
  ) as FeatureName[]
}
