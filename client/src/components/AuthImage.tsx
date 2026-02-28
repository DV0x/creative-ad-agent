import { useState, useEffect, useRef } from 'react'
import { IS_AUTH_ENABLED } from '@/lib/auth'
import { authFetchBlob } from '@/lib/api'

interface AuthImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string
}

/**
 * Drop-in <img> replacement that fetches through auth headers when needed.
 * In dev mode (no auth), renders a plain <img>.
 * In production, fetches via Bearer token and renders a blob URL.
 */
export function AuthImage({ src, ...props }: AuthImageProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const prevSrc = useRef(src)

  useEffect(() => {
    // Dev mode — no auth needed, use src directly
    if (!IS_AUTH_ENABLED) {
      setBlobUrl(src)
      return
    }

    // Reset if src changed
    if (prevSrc.current !== src) {
      if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl)
      }
      setBlobUrl(null)
      prevSrc.current = src
    }

    let revoked = false

    authFetchBlob(src)
      .then((url) => {
        if (!revoked) setBlobUrl(url)
        else URL.revokeObjectURL(url)
      })
      .catch(() => {
        // Fallback to direct src on auth failure
        if (!revoked) setBlobUrl(src)
      })

    return () => {
      revoked = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!blobUrl) return null

  return <img src={blobUrl} {...props} />
}
