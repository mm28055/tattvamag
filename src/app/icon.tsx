import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default async function Icon() {
  const devanagari = await readFile(
    join(process.cwd(), 'src/app/_fonts/NotoSerifDevanagari-700.ttf')
  )

  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: '#2b2b2b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 4,
        }}
      >
        <span
          style={{
            color: '#ffffff',
            fontSize: 24,
            fontFamily: 'Noto Serif Devanagari',
            lineHeight: 1,
            marginTop: 1,
          }}
        >
          त
        </span>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Noto Serif Devanagari',
          data: devanagari,
          weight: 700,
          style: 'normal',
        },
      ],
    }
  )
}
