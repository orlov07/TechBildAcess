import { useEffect, useRef } from 'react'
import QRCodeLib from 'qrcode'

export function QRCode({ value, size = 200 }: { value: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!ref.current || !value) return
    QRCodeLib.toCanvas(ref.current, value, {
      width: size,
      margin: 1,
      color: { dark: '#0b0b12', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    }).catch(() => {})
  }, [value, size])

  return (
    <div className="inline-flex rounded-2xl bg-white p-3 shadow-lg">
      <canvas ref={ref} />
    </div>
  )
}
