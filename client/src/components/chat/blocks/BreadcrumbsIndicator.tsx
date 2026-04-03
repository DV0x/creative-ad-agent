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

  // Rotate verb every 800ms
  useEffect(() => {
    const interval = setInterval(() => {
      setVerb(ROTATING_VERBS[Math.floor(Math.random() * ROTATING_VERBS.length)])
    }, 800)
    return () => clearInterval(interval)
  }, [])

  // Split children into completed phases and the current active phase
  const phases = children.filter(c => c.kind === 'phase')
  const completedPhases = phases.slice(0, -1)
  const activePhase = phases[phases.length - 1]

  // Image progress
  const hasImages = expectedImages > 0
  const imageProgress = hasImages ? (completedImages / expectedImages) * 100 : 0

  return (
    <div className="py-1 space-y-1">
      {/* Completed phases — faded one-liners */}
      {completedPhases.map((phase) => (
        <div key={phase.id} className="flex items-center gap-1.5 text-xs text-text-muted">
          <span className="text-accent/60 flex-shrink-0">&#x2713;</span>
          <span>{phase.text}</span>
        </div>
      ))}

      {/* Active phase — spinner + text + rotating verb */}
      <div className="flex items-center gap-2">
        <OrbitalSpinner size="sm" className="flex-shrink-0" />
        <span className="text-xs text-text-secondary font-medium">
          {activePhase ? activePhase.text : verb}
        </span>
        {activePhase && (
          <span className="text-xs text-text-muted animate-pulse">
            {verb}...
          </span>
        )}
        {hasImages && completedImages > 0 && (
          <span className="text-xs text-text-muted ml-auto">
            {completedImages}/{expectedImages}
          </span>
        )}
      </div>

      {/* Image progress bar */}
      {hasImages && completedImages > 0 && (
        <div className="h-0.5 bg-border rounded-full overflow-hidden">
          <div
            className={cn('h-full bg-accent rounded-full transition-all duration-500')}
            style={{ width: `${imageProgress}%` }}
          />
        </div>
      )}
    </div>
  )
}
