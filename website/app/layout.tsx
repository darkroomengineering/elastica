import type { Metadata, Viewport } from 'next'

import Script from 'next/script'
import type { PropsWithChildren } from 'react'
import { ReactTempus } from 'tempus/react'
import { RealViewport } from '~/components/ui/real-viewport'
import { RectSync } from '~/components/ui/rect-sync'
import { OptionalFeatures } from '~/lib/features'
import { TransformProvider } from '~/hooks/use-transform'
import AppData from '~/package.json'
import { fontsVariable, themes } from '~/styles'
import '~/styles/css/index.css'

const APP_NAME = '@darkroom.engineering/elastica'
const APP_DEFAULT_TITLE = 'Elastica'
const APP_TITLE_TEMPLATE = '%s - Elastica'
const APP_DESCRIPTION =
  'Elastica turns real DOM elements into rigid bodies — words, images, buttons, the footer — and simulates them at a fixed 60 Hz timestep, tuned for feel and guaranteed never to explode.'
const APP_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? 'https://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(APP_BASE_URL),
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  alternates: {
    canonical: '/',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
    url: APP_BASE_URL,
    images: [
      {
        url: '/opengraph-image.jpg',
        width: 1200,
        height: 630,
        alt: APP_DEFAULT_TITLE,
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  authors: [
    { name: 'darkroom.engineering', url: 'https://darkroom.engineering' },
  ],
}

export const viewport: Viewport = {
  themeColor: themes.red.primary,
  colorScheme: 'normal',
}

export default function Layout({ children }: PropsWithChildren) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={fontsVariable}
      suppressHydrationWarning
    >
      <Script async>{`window.elasticaVersion = '${AppData.version}';`}</Script>
      <body>
        <RealViewport>
          <TransformProvider>{children}</TransformProvider>
        </RealViewport>
        <RectSync />
        <ReactTempus patch />
        <OptionalFeatures />
      </body>
    </html>
  )
}
