import { cn } from '@/lib/utils'

interface OrbitalSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Variant 1: Twin Orbit
 * Two dots chasing each other around a circle. Clean, minimal.
 */
export function OrbitalSpinner({ size = 'md', className }: OrbitalSpinnerProps) {
  const sizes = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6' }
  const dotSizes = { sm: 'h-1 w-1', md: 'h-1.5 w-1.5', lg: 'h-2 w-2' }

  return (
    <div className={cn('relative', sizes[size], className)}>
      {/* Track ring (subtle) */}
      <div className="absolute inset-0 rounded-full border border-accent/15" />
      {/* Dot 1 — centered in wrapper, orbit pushes outward */}
      <div className="absolute inset-0 flex items-center justify-center animate-[orbit_1.4s_linear_infinite]">
        <div className={cn('rounded-full bg-accent', dotSizes[size])} />
      </div>
      {/* Dot 2 — offset 180° */}
      <div className="absolute inset-0 flex items-center justify-center animate-[orbit_1.4s_linear_infinite_0.7s]">
        <div className={cn('rounded-full bg-accent/60', dotSizes[size])} />
      </div>
    </div>
  )
}

/**
 * Variant 2: Atom
 * Three dots on different orbits crossing each other. Feels "creative/AI".
 */
export function AtomSpinner({ size = 'md', className }: OrbitalSpinnerProps) {
  const sizes = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6' }
  const dotSizes = { sm: 'h-1 w-1', md: 'h-1.5 w-1.5', lg: 'h-2 w-2' }

  return (
    <div className={cn('relative', sizes[size], className)}>
      {/* Orbit 1: horizontal */}
      <div className="absolute inset-0 animate-[orbit_1.6s_linear_infinite]">
        <div className={cn('rounded-full bg-accent', dotSizes[size])} />
      </div>
      {/* Orbit 2: tilted 60° */}
      <div className="absolute inset-0 rotate-[60deg] animate-[orbit_2s_linear_infinite_0.3s]">
        <div className={cn('rounded-full bg-accent/70', dotSizes[size])} />
      </div>
      {/* Orbit 3: tilted 120° */}
      <div className="absolute inset-0 rotate-[120deg] animate-[orbit_2.4s_linear_infinite_0.6s]">
        <div className={cn('rounded-full bg-accent/40', dotSizes[size])} />
      </div>
      {/* Center dot */}
      <div className={cn(
        'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/30',
        size === 'sm' ? 'h-0.5 w-0.5' : size === 'md' ? 'h-1 w-1' : 'h-1.5 w-1.5',
      )} />
    </div>
  )
}

/**
 * Variant 3: Pulse Orbit
 * Single dot orbiting with a pulsing trail. Elegant, smooth.
 */
export function PulseOrbitSpinner({ size = 'md', className }: OrbitalSpinnerProps) {
  const sizes = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6' }

  return (
    <div className={cn('relative', sizes[size], className)}>
      {/* Glow ring that pulses */}
      <div className="absolute inset-0 rounded-full border border-accent/20 animate-[pulseRing_2s_ease-in-out_infinite]" />
      {/* Orbiting dot */}
      <div className="absolute inset-0 animate-[orbit_1.8s_cubic-bezier(0.45,0.05,0.55,0.95)_infinite]">
        <div className="h-1.5 w-1.5 rounded-full bg-accent" />
      </div>
    </div>
  )
}

/**
 * Variant 4: DNA Helix
 * Two dots weaving past each other vertically. Unique, creative.
 */
export function HelixSpinner({ size = 'md', className }: OrbitalSpinnerProps) {
  const sizes = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6' }

  return (
    <div className={cn('relative', sizes[size], className)}>
      {/* Dot 1 — orbits clockwise */}
      <div className="absolute inset-0 animate-[orbit_1.2s_ease-in-out_infinite]">
        <div className="h-1.5 w-1.5 rounded-full bg-accent" />
      </div>
      {/* Dot 2 — orbits counter-clockwise, creates weaving effect */}
      <div className="absolute inset-0 animate-[orbitReverse_1.2s_ease-in-out_infinite]">
        <div className="h-1.5 w-1.5 rounded-full bg-accent/50" />
      </div>
    </div>
  )
}
