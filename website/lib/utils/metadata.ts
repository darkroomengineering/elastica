import type { Metadata } from 'next'

/**
 * Metadata Generation Utilities
 */

interface GenerateMetadataOptions {
  title?: string
  description?: string
  keywords?: string[]
  image?: {
    url?: string
    width?: number
    height?: number
    alt?: string
  }
  url?: string
  siteName?: string
  noIndex?: boolean
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
  authors?: string[]
}

const APP_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? 'https://localhost:3000'

/**
 * Generate complete metadata object for pages
 */
export function generatePageMetadata(
  options: GenerateMetadataOptions
): Metadata {
  const {
    title,
    description,
    keywords,
    image,
    url,
    siteName = 'Elastica',
    noIndex = false,
    type = 'website',
    publishedTime,
    modifiedTime,
    authors,
  } = options

  const fullUrl = url ? `${APP_BASE_URL}${url}` : APP_BASE_URL
  const imageUrl = image?.url || '/opengraph-image.jpg'
  const imageWidth = image?.width || 1200
  const imageHeight = image?.height || 630
  const imageAlt = image?.alt || title || siteName

  const metadata: Metadata = {
    metadataBase: new URL(APP_BASE_URL),
    title,
    description,
    keywords,
    alternates: {
      canonical: url || '/',
    },
    openGraph: {
      title,
      description,
      url: fullUrl,
      siteName,
      locale: 'en_US',
      type,
      images: [
        {
          url: imageUrl,
          width: imageWidth,
          height: imageHeight,
          alt: imageAlt,
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(authors && { authors }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: imageWidth,
          height: imageHeight,
          alt: imageAlt,
        },
      ],
    },
  }

  if (noIndex) {
    metadata.robots = {
      index: false,
      follow: false,
    }
  }

  return metadata
}
