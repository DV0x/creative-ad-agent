import type { TextBlockData } from '@/types/chat'

interface TextBlockProps {
  block: TextBlockData
}

export function TextBlock({ block }: TextBlockProps) {
  if (!block.content) return null

  return (
    <div className="bg-bg-elevated text-text-secondary border border-border rounded-lg px-3 py-2">
      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
        {block.content}
      </p>
    </div>
  )
}
