import { OrbitalSpinner, AtomSpinner, PulseOrbitSpinner, HelixSpinner } from './orbital-spinner'

const VERBS = [
  'Pondering', 'Cogitating', 'Noodling', 'Brewing', 'Conjuring',
  'Scheming', 'Vibing', 'Spelunking', 'Wrangling', 'Simmering',
  'Manifesting', 'Ruminating', 'Percolating', 'Tinkering', 'Musing',
]

import { useState, useEffect } from 'react'

function RotatingVerb() {
  const [verb, setVerb] = useState(VERBS[0])
  useEffect(() => {
    const id = setInterval(() => {
      setVerb(VERBS[Math.floor(Math.random() * VERBS.length)])
    }, 800)
    return () => clearInterval(id)
  }, [])
  return <span className="text-accent text-xs font-medium min-w-[90px]">{verb}...</span>
}

export function SpinnerDemo() {
  return (
    <div className="p-8 space-y-8 bg-bg-base min-h-screen">
      <h2 className="text-text-primary text-lg font-semibold">Orbital Spinner Variants</h2>

      {/* All sizes */}
      <div className="space-y-6">
        {/* Variant 1: Twin Orbit */}
        <div className="space-y-3">
          <p className="text-text-muted text-xs uppercase tracking-wide">Twin Orbit</p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <OrbitalSpinner size="sm" /> <span className="text-text-muted text-xs">sm</span>
            </div>
            <div className="flex items-center gap-2">
              <OrbitalSpinner size="md" /> <span className="text-text-muted text-xs">md</span>
            </div>
            <div className="flex items-center gap-2">
              <OrbitalSpinner size="lg" /> <span className="text-text-muted text-xs">lg</span>
            </div>
            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-border">
              <OrbitalSpinner size="md" />
              <RotatingVerb />
            </div>
          </div>
        </div>

        {/* Variant 2: Atom */}
        <div className="space-y-3">
          <p className="text-text-muted text-xs uppercase tracking-wide">Atom</p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <AtomSpinner size="sm" /> <span className="text-text-muted text-xs">sm</span>
            </div>
            <div className="flex items-center gap-2">
              <AtomSpinner size="md" /> <span className="text-text-muted text-xs">md</span>
            </div>
            <div className="flex items-center gap-2">
              <AtomSpinner size="lg" /> <span className="text-text-muted text-xs">lg</span>
            </div>
            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-border">
              <AtomSpinner size="md" />
              <RotatingVerb />
            </div>
          </div>
        </div>

        {/* Variant 3: Pulse Orbit */}
        <div className="space-y-3">
          <p className="text-text-muted text-xs uppercase tracking-wide">Pulse Orbit</p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <PulseOrbitSpinner size="sm" /> <span className="text-text-muted text-xs">sm</span>
            </div>
            <div className="flex items-center gap-2">
              <PulseOrbitSpinner size="md" /> <span className="text-text-muted text-xs">md</span>
            </div>
            <div className="flex items-center gap-2">
              <PulseOrbitSpinner size="lg" /> <span className="text-text-muted text-xs">lg</span>
            </div>
            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-border">
              <PulseOrbitSpinner size="md" />
              <RotatingVerb />
            </div>
          </div>
        </div>

        {/* Variant 4: Helix */}
        <div className="space-y-3">
          <p className="text-text-muted text-xs uppercase tracking-wide">Helix</p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <HelixSpinner size="sm" /> <span className="text-text-muted text-xs">sm</span>
            </div>
            <div className="flex items-center gap-2">
              <HelixSpinner size="md" /> <span className="text-text-muted text-xs">md</span>
            </div>
            <div className="flex items-center gap-2">
              <HelixSpinner size="lg" /> <span className="text-text-muted text-xs">lg</span>
            </div>
            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-border">
              <HelixSpinner size="md" />
              <RotatingVerb />
            </div>
          </div>
        </div>
      </div>

      {/* In context: simulated thinking block */}
      <div className="space-y-3 pt-4 border-t border-border">
        <p className="text-text-muted text-xs uppercase tracking-wide">In Context: Thinking Block</p>

        {/* Mock thinking block with Twin Orbit */}
        <div className="max-w-md rounded-lg border border-accent/30 bg-accent/5 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2.5">
            <OrbitalSpinner size="sm" />
            <span className="text-xs font-medium text-accent">Researching brand</span>
            <span className="text-xs text-text-muted ml-auto">0:42</span>
          </div>
          <div className="px-3 pb-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-green-500">✓</span>
              <span className="text-text-secondary">Parsed request</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-green-500">✓</span>
              <span className="text-text-secondary">Fetching verbisedu.com</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <OrbitalSpinner size="sm" />
              <span className="text-text-secondary">Analyzing brand identity</span>
              <RotatingVerb />
            </div>
          </div>
        </div>

        {/* Mock thinking block with Atom */}
        <div className="max-w-md rounded-lg border border-accent/30 bg-accent/5 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2.5">
            <AtomSpinner size="sm" />
            <span className="text-xs font-medium text-accent">Generating Hooks</span>
            <span className="text-xs text-text-muted ml-auto">1:15</span>
          </div>
          <div className="px-3 pb-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-green-500">✓</span>
              <span className="text-text-secondary">Research complete</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <AtomSpinner size="sm" />
              <span className="text-text-secondary">Writing 6 hooks</span>
              <RotatingVerb />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
