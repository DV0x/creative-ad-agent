import type { MessageBlock } from '@/types/chat'
import { TextBlock } from './TextBlock'
import { ThinkingBlock } from './ThinkingBlock'
import { StatusBlock } from './StatusBlock'

interface BlockRendererProps {
  blocks: MessageBlock[]
  onToggleThinking: (blockId: string) => void
}

export function BlockRenderer({ blocks, onToggleThinking }: BlockRendererProps) {
  return (
    <div className="space-y-2 min-w-0 overflow-hidden">
      {blocks.map((block) => {
        switch (block.type) {
          case 'text':
            return <TextBlock key={block.id} block={block} />
          case 'thinking':
            return (
              <ThinkingBlock
                key={block.id}
                block={block}
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
