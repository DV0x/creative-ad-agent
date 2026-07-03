import * as React from 'react'
import { useStore } from '@/store'

interface Spark {
  id: number
  angle: number
}

const LIME = '#C1FF64'
const INK = '#231F20'

/**
 * Sage's mark — a stylized sage leaf.
 *
 * - Idle: breathing + sway
 * - Hover: tilts toward cursor (3D perspective)
 * - Click: spring pulse + lime spark at tip
 * - Generating: breath quickens + lime glow at stem
 */
export function SageLeaf({ size = 28 }: { size?: number }) {
  const isGenerating = useStore(state => !!state.currentGeneratingMessageId)

  const stageRef = React.useRef<HTMLSpanElement>(null)
  const [tilt, setTilt] = React.useState({ rx: 0, ry: 0 })
  const [isHovering, setIsHovering] = React.useState(false)
  const [pulseKey, setPulseKey] = React.useState(0)
  const [sparks, setSparks] = React.useState<Spark[]>([])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!stageRef.current) return
    const rect = stageRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = (e.clientX - cx) / (rect.width / 2)
    const dy = (e.clientY - cy) / (rect.height / 2)
    // Tilt toward cursor (max ±10°). Y-mouse → rotateX (inverted), X-mouse → rotateY.
    const rx = Math.max(-1, Math.min(1, dy)) * -10
    const ry = Math.max(-1, Math.min(1, dx)) * 10
    setTilt({ rx, ry })
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
    setTilt({ rx: 0, ry: 0 })
  }

  const handleClick = () => {
    setPulseKey(k => k + 1)
    const id = Date.now()
    setSparks(prev => [...prev, { id, angle: 0 }])
    window.setTimeout(() => {
      setSparks(prev => prev.filter(s => s.id !== id))
    }, 720)
  }

  return (
    <button
      type="button"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      className="sage-leaf-button"
      style={{ width: size, height: size }}
      aria-label="Sage"
    >
      <span
        ref={stageRef}
        className="sage-leaf-stage"
        data-state={isGenerating ? 'generating' : 'idle'}
        data-hovering={isHovering ? 'true' : 'false'}
        style={{
          transform: `perspective(120px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        }}
      >
        <svg
          viewBox="0 0 28 28"
          width={size}
          height={size}
          className="sage-leaf-svg"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="sage-stem-glow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor={LIME} stopOpacity="0.7" />
              <stop offset="60%" stopColor={LIME} stopOpacity="0.18" />
              <stop offset="100%" stopColor={LIME} stopOpacity="0" />
            </radialGradient>
            <linearGradient id="sage-leaf-fill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#B8487A" />
              <stop offset="100%" stopColor="#923355" />
            </linearGradient>
          </defs>

          {/* stem glow — only visible when generating */}
          <circle
            className="sage-leaf-glow"
            cx="14"
            cy="23"
            r="6"
            fill="url(#sage-stem-glow)"
          />

          {/* leaf body — asymmetric, pointed tip, rounded base */}
          <path
            d="M14.6 2.8
               C 21.4 4.6, 23.4 12.4, 20.6 18.6
               C 18.7 22.6, 16 24.6, 14 24.6
               C 12 24.6, 9.3 22.6, 7.4 18.6
               C 4.6 12.4, 7.6 4.6, 14.6 2.8 Z"
            fill="url(#sage-leaf-fill)"
          />

          {/* central vein — lime, slight curve */}
          <path
            d="M14.6 4.5 Q 13.7 14 14 23.4"
            stroke={LIME}
            strokeWidth="0.85"
            strokeLinecap="round"
            fill="none"
            opacity="0.88"
          />

          {/* tiny stem nub */}
          <path
            d="M14 24.4 L 14 26"
            stroke={INK}
            strokeWidth="0.7"
            strokeLinecap="round"
            opacity="0.45"
          />
        </svg>

        {/* click pulse — re-mounts via key, single shot */}
        <span key={pulseKey} className="sage-leaf-pulse" aria-hidden="true" />

        {/* sparks at the tip */}
        {sparks.map(s => (
          <span
            key={s.id}
            className="sage-leaf-spark"
            aria-hidden="true"
          />
        ))}
      </span>
    </button>
  )
}
