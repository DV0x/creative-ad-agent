import type { TextBlockData } from '@/types/chat'
import { MarkdownContent } from '../MarkdownContent'

interface TextBlockProps {
  block: TextBlockData
}

export function TextBlock({ block }: TextBlockProps) {
  if (!block.content) return null

  return (
    <div className="bg-bg-elevated text-text-secondary border border-border rounded-lg px-4 py-3 overflow-x-auto">
      <MarkdownContent content={block.content} />
    </div>
  )
}
