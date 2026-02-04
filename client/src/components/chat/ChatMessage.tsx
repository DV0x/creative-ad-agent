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
    <div className={cn('flex flex-col gap-2', isUser && 'items-end')}>
      {/* Main message bubble */}
      <div
        className={cn(
          'max-w-[90%] rounded-lg text-sm',
          isUser
            ? 'bg-accent text-white rounded-br-sm px-3 py-2'
            : 'rounded-bl-sm'
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
            {hasBlocks ? (
              <BlockRenderer blocks={message.blocks!} onToggleThinking={handleToggleBlock} />
            ) : (
              /* Plain text content (DB-loaded historical messages) */
              message.content && (
                <div className="bg-bg-elevated text-text-secondary border border-border rounded-lg px-3 py-2">
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                </div>
              )
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
