import type { TextBlockData } from '@/types/chat'
import { MarkdownContent } from '../MarkdownContent'

interface TextBlockProps {
  block: TextBlockData
  isStreaming?: boolean
}

export function TextBlock({ block, isStreaming }: TextBlockProps) {
  if (!block.content) return null

  return (
    <div className="bg-bg-elevated text-text-secondary border border-border rounded-lg px-4 py-3 min-w-0 overflow-hidden">
      {isStreaming ? (
        <p className="whitespace-pre-wrap break-words text-sm">
          {block.content}
          <span className="inline-block w-0.5 h-4 bg-accent/70 ml-0.5 align-middle animate-pulse" />
        </p>
      ) : (
        <MarkdownContent content={block.content} />
      )}
    </div>
  )
}
