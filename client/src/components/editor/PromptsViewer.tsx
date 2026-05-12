import { Palette } from 'lucide-react'

interface PromptsViewerProps {
  content: string
}

export function PromptsViewer({ content }: PromptsViewerProps) {
  let data: Record<string, unknown>
  try {
    data = JSON.parse(content)
  } catch {
    // Not valid JSON — show as preformatted text
    return (
      <div className="p-4">
        <pre className="text-xs text-text-secondary whitespace-pre-wrap break-words leading-relaxed">
          {content}
        </pre>
      </div>
    )
  }

  const brand = data.brand as string || ''
  const category = data.category as string || ''
  const brandColors = data.brandColors as Record<string, string> | undefined
  const stylesUsed = data.stylesUsed as string[] | undefined
  const concepts = data.concepts as Array<Record<string, unknown>> | undefined

  return (
    <div className="p-5 space-y-6">
      {/* Brand Info */}
      <div className="space-y-2">
        <h1 className="text-lg font-semibold text-text-primary capitalize">{brand}</h1>
        {category && (
          <p className="text-xs text-text-muted">{category}</p>
        )}

        {stylesUsed && stylesUsed.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {stylesUsed.map((s, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded bg-bg-overlay text-text-secondary">
                {s}
              </span>
            ))}
          </div>
        )}

        {brandColors && (
          <div className="flex items-center gap-3 flex-wrap">
            <Palette className="w-3.5 h-3.5 text-text-muted shrink-0" />
            {Object.entries(brandColors).map(([name, value]) => (
              <div key={name} className="flex items-center gap-1.5">
                {value.startsWith('#') && (
                  <span
                    className="w-3.5 h-3.5 rounded-sm border border-border shrink-0"
                    style={{ backgroundColor: value }}
                  />
                )}
                <span className="text-xs text-text-muted">{name}:</span>
                <span className="text-xs text-text-secondary">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Concepts */}
      {concepts && concepts.map((concept, i) => {
        const story = concept.story as Record<string, string> | undefined
        const stage = concept.stage as Record<string, string> | undefined
        const prompt = concept.prompt as string || ''
        const aspectRatio = concept.aspectRatio as string || ''
        const dimensions = concept.dimensions as string || ''

        return (
          <div key={i} className="border border-border rounded-lg overflow-hidden">
            {/* Concept Header */}
            <div className="bg-bg-elevated px-4 py-2.5 border-b border-border flex items-center gap-2">
              <span className="text-xs font-semibold text-accent">
                Concept {concept.concept as number ?? i + 1}
              </span>
              {story?.hookType && (
                <span className="text-xs text-text-muted">· {story.hookType}</span>
              )}
              {(aspectRatio || dimensions) && (
                <span className="text-xs text-text-muted ml-auto">
                  {aspectRatio}{dimensions ? ` · ${dimensions}` : ''}
                </span>
              )}
            </div>

            <div className="px-4 py-3 space-y-3">
              {/* Hook & Copy */}
              {story?.hook && (
                <div>
                  <p className="text-sm font-semibold text-text-primary leading-snug">
                    "{story.hook}"
                  </p>
                  {story.body && (
                    <p className="text-xs text-text-secondary mt-1 leading-relaxed">{story.body}</p>
                  )}
                  {story.cta && (
                    <p className="text-xs text-accent mt-1">CTA: {story.cta}</p>
                  )}
                </div>
              )}

              {/* Target & Positioning */}
              {(story?.hookTarget || story?.ownedPositioning) && (
                <div className="space-y-1">
                  {story.hookTarget && (
                    <Row label="Target" value={story.hookTarget} />
                  )}
                  {story.ownedPositioning && (
                    <Row label="Positioning" value={story.ownedPositioning} />
                  )}
                  {story.hookSource && (
                    <Row label="Source" value={story.hookSource} />
                  )}
                </div>
              )}

              {/* Psychology */}
              {story?.psychology && (
                <div>
                  <Label>Psychology</Label>
                  <p className="text-xs text-text-secondary leading-relaxed">{story.psychology}</p>
                </div>
              )}

              {/* Visual Translation */}
              {story?.visualTranslation && (
                <div>
                  <Label>Visual Direction</Label>
                  <p className="text-xs text-text-secondary leading-relaxed">{story.visualTranslation}</p>
                </div>
              )}

              {/* Stage */}
              {stage && (
                <div className="space-y-1">
                  <Label>Stage</Label>
                  {Object.entries(stage).map(([key, value]) => (
                    <Row key={key} label={key} value={value} />
                  ))}
                </div>
              )}

              {/* Image Prompt */}
              {prompt && (
                <div>
                  <Label>Image Prompt</Label>
                  <p className="text-xs text-text-secondary leading-relaxed bg-bg-base rounded-md p-3 border border-border break-words">
                    {prompt}
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">{children}</p>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-xs">
      <span className="text-text-muted shrink-0 min-w-[80px]">{label}</span>
      <span className="text-text-secondary">{value}</span>
    </div>
  )
}
