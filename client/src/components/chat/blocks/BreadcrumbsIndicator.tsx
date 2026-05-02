import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { OrbitalSpinner } from '@/components/ui/orbital-spinner'
import type { ThinkingBlockData } from '@/types/chat'

const ROTATING_VERBS = [
  'Analyzing', 'Brainstorming', 'Crafting', 'Designing', 'Exploring',
  'Formulating', 'Generating', 'Honing', 'Ideating', 'Judging',
  'Layering', 'Mapping', 'Narrowing', 'Optimizing', 'Polishing',
  'Questioning', 'Refining', 'Shaping', 'Tailoring', 'Unpacking',
  'Visualizing', 'Weighing', 'Assembling', 'Building', 'Calibrating',
  'Distilling', 'Evaluating', 'Framing', 'Gauging', 'Harmonizing',
  'Iterating', 'Juxtaposing', 'Kindling', 'Leveraging', 'Molding',
  'Nudging', 'Orchestrating', 'Piecing', 'Rethinking', 'Sculpting',
  'Tuning', 'Unifying', 'Validating', 'Wiring', 'Zeroing in',
  'Adapting', 'Balancing', 'Composing', 'Drafting', 'Envisioning',
  'Finessing', 'Grounding', 'Hypothesizing', 'Inspecting', 'Joining',
  'Knitting', 'Linking', 'Meshing', 'Navigating', 'Outlining',
  'Parsing', 'Reworking', 'Structuring', 'Threading', 'Uncovering',
  'Vetting', 'Weaving', 'Aligning', 'Blending', 'Condensing',
  'Deepening', 'Extracting', 'Funneling', 'Gathering', 'Highlighting',
  'Integrating', 'Juggling', 'Keying', 'Locking in', 'Materializing',
  'Nesting', 'Ordering', 'Prioritizing', 'Resolving', 'Synthesizing',
  'Tightening', 'Unwinding', 'Verifying', 'Wrapping up',
]

interface BreadcrumbsIndicatorProps {
  block: ThinkingBlockData
}

export function BreadcrumbsIndicator({ block }: BreadcrumbsIndicatorProps) {
  const [verb, setVerb] = useState(() => ROTATING_VERBS[Math.floor(Math.random() * ROTATING_VERBS.length)])
  const { children, completedImages, expectedImages } = block

  useEffect(() => {
    const interval = setInterval(() => {
      setVerb(ROTATING_VERBS[Math.floor(Math.random() * ROTATING_VERBS.length)])
    }, 800)
    return () => clearInterval(interval)
  }, [])

  const phases = children.filter(c => c.kind === 'phase')
  const completedPhases = phases.slice(0, -1)
  const activePhase = phases[phases.length - 1]

  const hasImages = expectedImages > 0
  const imageProgress = hasImages ? (completedImages / expectedImages) * 100 : 0

  return (
    <div className="py-2 space-y-1.5">
      {/* Completed phases — soft wine dot + faded text */}
      {completedPhases.map((phase) => (
        <div key={phase.id} className="flex items-center gap-2 text-xs text-text-muted">
          <span
            className="inline-block w-1 h-1 rounded-full shrink-0"
            style={{ backgroundColor: 'var(--color-accent)' }}
          />
          <span className="truncate">{phase.text}</span>
        </div>
      ))}

      {/* Active phase — orbital spinner + label + rotating verb */}
      <div className="flex items-center gap-2.5">
        <OrbitalSpinner size="sm" className="shrink-0" />
        <span className="text-xs text-text-secondary font-medium">
          {activePhase ? activePhase.text : verb}
        </span>
        {activePhase && (
          <span className="text-[11px] font-mono tracking-tight text-text-muted/80 italic animate-pulse">
            {verb.toLowerCase()}…
          </span>
        )}
        {hasImages && completedImages > 0 && (
          <span className="text-[11px] font-mono text-text-muted ml-auto tabular-nums">
            {completedImages}/{expectedImages}
          </span>
        )}
      </div>

      {/* Image progress bar */}
      {hasImages && completedImages > 0 && (
        <div
          className="h-px rounded-full overflow-hidden"
          style={{ backgroundColor: 'rgba(120, 40, 74, 0.12)' }}
        >
          <div
            className={cn('h-full rounded-full transition-all duration-500')}
            style={{
              width: `${imageProgress}%`,
              backgroundColor: 'var(--color-accent)',
            }}
          />
        </div>
      )}
    </div>
  )
}
