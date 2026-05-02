import type { TextBlockData } from '@/types/chat'
import { MarkdownContent } from '../MarkdownContent'

interface TextBlockProps {
  block: TextBlockData
  isStreaming?: boolean
}

/**
 * Text content from the agent. Rendered as a transparent block — the parent
 * AgentBubble surface (cream + wine left rule) provides the surface chrome.
 */
export function TextBlock({ block, isStreaming }: TextBlockProps) {
  if (!block.content) return null

  return (
    <div className="text-text-primary text-sm leading-relaxed min-w-0 overflow-hidden">
      {isStreaming ? (
        <p className="whitespace-pre-wrap break-words">
          {block.content}
          <span className="inline-block w-0.5 h-4 bg-accent/70 ml-0.5 align-middle animate-pulse" />
        </p>
      ) : (
        <MarkdownContent content={block.content} />
      )}
    </div>
  )
}
