import { cn } from '@/lib/utils'
import { BlockRenderer } from './blocks/BlockRenderer'
import { useStore } from '@/store'
import type { ChatMessage as ChatMessageType } from '@/types/chat'

interface ChatMessageProps {
  message: ChatMessageType
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { toggleBlockExpanded } = useStore()
  const isUser = message.role === 'user'
  const hasBlocks = message.blocks && message.blocks.length > 0

  const handleToggleBlock = (blockId: string) => {
    if (message.campaignId) {
      toggleBlockExpanded(message.campaignId, message.id, blockId)
    }
  }

  return (
    <div className={cn('flex flex-col gap-1 min-w-0', isUser && 'items-end')}>
      {/* Main message bubble */}
      <div
        className={cn(
          'max-w-[90%] min-w-0 rounded-lg text-sm overflow-hidden',
          isUser
            ? 'bg-accent text-white rounded-br-sm px-3 py-2'
            : 'w-full rounded-bl-sm'
        )}
      >
        {/* User message content */}
        {isUser && (
          <>
            {message.fileRefs && message.fileRefs.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1">
                {message.fileRefs.map((ref, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 bg-white/20 rounded text-xs"
                  >
                    @{ref.fileType}
                  </span>
                ))}
              </div>
            )}
            {message.imageRefs && message.imageRefs.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1">
                {message.imageRefs.map((ref, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 bg-white/20 rounded text-xs"
                  >
                    Image {ref.imageId}
                  </span>
                ))}
              </div>
            )}
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          </>
        )}

        {/* Assistant message */}
        {!isUser && (
          <div className="space-y-2">
            {hasBlocks && (
              <BlockRenderer blocks={message.blocks!} onToggleThinking={handleToggleBlock} />
            )}
            {/* Show content if no blocks, or if blocks exist but don't contain a text block */}
            {message.content && (!hasBlocks || !message.blocks!.some(b => b.type === 'text')) && (
              <div className="bg-bg-elevated text-text-secondary border border-border rounded-lg px-3 py-2 overflow-hidden">
                <p className="whitespace-pre-wrap break-words" style={{ overflowWrap: 'anywhere' }}>{message.content}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Timestamp */}
      <span className="text-[10px] text-text-muted px-1">
        {isUser ? 'You' : 'Agent'} · {formatTime(message.timestamp)}
      </span>
    </div>
  )
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
