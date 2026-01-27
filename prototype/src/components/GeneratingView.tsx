import { X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store'

const PHASES = [
  { key: 'research', label: 'Research' },
  { key: 'hooks', label: 'Hooks' },
  { key: 'visuals', label: 'Visuals' },
  { key: 'images', label: 'Images' }
] as const

export function GeneratingView() {
  const { prompt, generatingPhase, research, reset } = useStore()

  const currentPhaseIndex = PHASES.findIndex((p) => p.key === generatingPhase)

  return (
    <div className="min-h-screen flex flex-col bg-bg-base">
      {/* Header */}
      <header className="border-b border-border bg-bg-base">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="text-text-primary font-medium truncate">
            {prompt.split(' ')[0]}
          </span>
          <Button variant="ghost" size="sm" onClick={reset}>
            <X className="w-4 h-4" />
            Cancel
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg space-y-8">
          {/* Progress card */}
          <div className="bg-bg-raised rounded-xl p-8 shadow-lg border border-border">
            {/* Spinner and status */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                {/* Outer glow ring */}
                <div className="absolute inset-0 w-10 h-10 -m-1 rounded-full bg-accent/20 animate-ping" style={{ animationDuration: '2s' }} />
                {/* Spinner background */}
                <div className="absolute inset-0 w-8 h-8 rounded-full bg-accent/10" />
                <Loader2 className="relative w-8 h-8 text-accent animate-spin" style={{ animationDuration: '1.5s' }} />
              </div>
              <div>
                <p className="text-text-primary font-medium">
                  {generatingPhase === 'research' && 'Researching brand...'}
                  {generatingPhase === 'hooks' && 'Creating hooks...'}
                  {generatingPhase === 'visuals' && 'Designing visuals...'}
                  {generatingPhase === 'images' && 'Generating images...'}
                </p>
                <p className="text-sm text-text-muted">
                  {generatingPhase === 'research' && 'Analyzing website and brand identity'}
                  {generatingPhase === 'hooks' && 'Building conversion-focused copy'}
                  {generatingPhase === 'visuals' && 'Creating visual prompts'}
                  {generatingPhase === 'images' && 'Rendering 6 ad creatives'}
                </p>
              </div>
            </div>

            {/* Research preview */}
            {research && (
              <div className="border border-accent/20 rounded-lg p-4 bg-bg-elevated animate-slideUp shadow-[0_0_20px_var(--color-accent-glow)]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <p className="text-sm text-text-muted">Found:</p>
                </div>
                <p className="text-text-primary font-semibold text-lg">
                  "{research.tagline}"
                </p>
                <p className="text-sm text-text-secondary mt-1">
                  Tone: <span className="text-accent">{research.tone}</span>
                </p>
                <div className="flex gap-2 mt-4">
                  {research.colors.map((color, i) => (
                    <div
                      key={color}
                      className="w-7 h-7 rounded-md border border-border transition-transform hover:scale-110 cursor-pointer"
                      style={{
                        backgroundColor: color,
                        animationDelay: `${i * 100}ms`
                      }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center">
            {PHASES.map((phase, index) => (
              <div key={phase.key} className="flex items-center">
                <div className="flex flex-col items-center gap-2">
                  {/* Dot with glow ring */}
                  <div className="relative">
                    {/* Outer glow ring for active */}
                    {index === currentPhaseIndex && (
                      <div className="absolute inset-0 w-4 h-4 -m-0.5 rounded-full bg-accent/30 animate-ping" />
                    )}
                    {/* Main dot */}
                    <div
                      className={`relative w-3 h-3 rounded-full transition-all duration-300 ${
                        index < currentPhaseIndex
                          ? 'bg-accent shadow-[0_0_8px_var(--color-accent-glow)]'
                          : index === currentPhaseIndex
                          ? 'bg-accent animate-dot-pulse'
                          : 'bg-border-emphasis'
                      }`}
                    >
                      {/* Checkmark for completed */}
                      {index < currentPhaseIndex && (
                        <svg
                          className="absolute inset-0 w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={4}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  {/* Label */}
                  <span
                    className={`text-xs font-medium transition-colors duration-300 ${
                      index < currentPhaseIndex
                        ? 'text-accent'
                        : index === currentPhaseIndex
                        ? 'text-text-primary'
                        : 'text-text-muted'
                    }`}
                  >
                    {phase.label}
                  </span>
                </div>
                {/* Connecting line */}
                {index < PHASES.length - 1 && (
                  <div className="w-12 mx-2 h-0.5 relative overflow-hidden rounded-full bg-border-emphasis">
                    {/* Filled portion */}
                    <div
                      className={`absolute inset-y-0 left-0 bg-accent transition-all duration-500 ease-out rounded-full ${
                        index < currentPhaseIndex ? 'w-full' : 'w-0'
                      }`}
                      style={{
                        boxShadow: index < currentPhaseIndex ? '0 0 8px var(--color-accent-glow)' : 'none'
                      }}
                    />
                    {/* Animated fill for current transition */}
                    {index === currentPhaseIndex - 1 && (
                      <div
                        className="absolute inset-y-0 left-0 bg-accent rounded-full animate-pulse"
                        style={{ width: '100%' }}
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Chat bar (collapsed, showing status) */}
      <footer className="border-t border-border bg-bg-raised">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-2">
          <span className="text-lg">💬</span>
          <span className="text-sm text-text-muted">
            {generatingPhase === 'research' && `Researching ${prompt}...`}
            {generatingPhase === 'hooks' && 'Creating 6 diverse ad hooks...'}
            {generatingPhase === 'visuals' && 'Designing visual concepts...'}
            {generatingPhase === 'images' && 'Generating images (this may take a moment)...'}
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-accent"
                style={{
                  animation: 'pulse 1.4s ease-in-out infinite',
                  animationDelay: `${i * 160}ms`
                }}
              />
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
