import { ImageResponse } from 'next/og'
import { themes } from 'styles/config.js'

// Image metadata
export const size = {
  width: 192,
  height: 192,
}
export const contentType = 'image/png'

// Image generation
// function can receive {params} prop to access dynamic route params
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 96,
          background: themes.red.primary,
          color: themes.red.secondary,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        E
      </div>
    ),
    // ImageResponse options
    {
      // For convenience, we can re-use the exported icons size metadata
      // config to also set the ImageResponse's width and height.
      ...size,
    },
  )
}
