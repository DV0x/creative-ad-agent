import { useState, useEffect, useRef } from 'react'
import * as Sentry from '@sentry/react'
import { IS_AUTH_ENABLED } from '@/lib/auth'
import { authFetchBlob } from '@/lib/api'

interface AuthImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string
}

// Per-URL throttle for image_load_failed Sentry captures. R2/CDN burst failures
// can hit the same image many times in a few seconds — one capture per URL per
// 5 min is enough to know it's broken, more is just noise + quota burn.
const IMAGE_FAILURE_THROTTLE_MS = 5 * 60 * 1000
const imageFailureLastReportedAt = new Map<string, number>()

function reportImageFailure(src: string, reason: string, extra: Record<string, unknown>): void {
  const now = Date.now()
  const last = imageFailureLastReportedAt.get(src) ?? 0
  if (now - last < IMAGE_FAILURE_THROTTLE_MS) return
  imageFailureLastReportedAt.set(src, now)
  Sentry.captureMessage('image_load_failed', {
    level: 'warning',
    tags: { reason },
    extra: { src, ...extra },
  })
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
      .catch((err) => {
        // Fallback to direct src on auth failure — but record the failure
        // since it's invisible today and means the user is silently seeing a
        // broken (or unauthenticated) image.
        if (!revoked) {
          reportImageFailure(src, 'auth_fetch_failed', {
            errMessage: err instanceof Error ? err.message?.substring(0, 200) : String(err).substring(0, 200),
          })
          setBlobUrl(src)
        }
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

  const { onError: userOnError, ...restProps } = props
  return (
    <img
      src={blobUrl}
      {...restProps}
      onError={(e) => {
        // Native <img> onError — fires when the browser fails to render the
        // bytes (broken file, 404 on direct fallback, etc.). Different from
        // the catch above (which was the auth fetch). Capture both.
        reportImageFailure(src, 'img_render_error', {
          blobUrl: blobUrl?.startsWith('blob:') ? 'blob:<elided>' : blobUrl,
          fellBackToSrc: blobUrl === src,
        })
        userOnError?.(e)
      }}
    />
  )
}
