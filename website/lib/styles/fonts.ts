import localFont from 'next/font/local'
import { Archivo, Fragment_Mono } from 'next/font/google'

const mono = localFont({
  src: [
    {
      path: '../../public/fonts/ServerMono/ServerMono-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--next-font-mono',
  preload: true,
  adjustFontFallback: 'Arial',
  fallback: [
    'ui-monospace',
    'SFMono-Regular',
    'Consolas',
    'Liberation Mono',
    'Menlo',
    'monospace',
  ],
})

const archivo = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  weight: 'variable',
  display: 'swap',
  variable: '--next-font-archivo',
  preload: true,
  fallback: ['Arial', 'Helvetica Neue', 'sans-serif'],
})

const fragmentMono = Fragment_Mono({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--next-font-fragment-mono',
  preload: true,
  fallback: [
    'ui-monospace',
    'SFMono-Regular',
    'Consolas',
    'Liberation Mono',
    'Menlo',
    'monospace',
  ],
})

const fonts = [mono, archivo, fragmentMono]
const fontsVariable = fonts.map((font) => font.variable).join(' ')

export { fontsVariable }
