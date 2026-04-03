import type { MessageBlock, ThinkingBlockData } from '@/types/chat'
import { TextBlock } from './TextBlock'
import { ThinkingBlock } from './ThinkingBlock'
import { BreadcrumbsIndicator } from './BreadcrumbsIndicator'
import { StatusBlock } from './StatusBlock'

interface BlockRendererProps {
  blocks: MessageBlock[]
  isStreaming?: boolean
  onToggleThinking: (blockId: string) => void
}

export function BlockRenderer({ blocks, isStreaming, onToggleThinking }: BlockRendererProps) {
  return (
    <div className="space-y-2 min-w-0 overflow-hidden">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'text': {
            // isStreaming applies to the last text block only
            const isLastText = !blocks.slice(index + 1).some(b => b.type === 'text')
            return <TextBlock key={block.id} block={block} isStreaming={isStreaming && isLastText} />
          }
          case 'thinking':
            // Active thinking → BreadcrumbsIndicator, completed/error → collapsed ThinkingBlock
            if ((block as ThinkingBlockData).status === 'active') {
              return <BreadcrumbsIndicator key={block.id} block={block as ThinkingBlockData} />
            }
            return (
              <ThinkingBlock
                key={block.id}
                block={block as ThinkingBlockData}
                onToggle={() => onToggleThinking(block.id)}
              />
            )
          case 'status':
            return <StatusBlock key={block.id} block={block} />
        }
      })}
    </div>
  )
}
