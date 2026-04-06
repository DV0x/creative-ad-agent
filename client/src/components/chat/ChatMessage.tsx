import { cn } from '@/lib/utils'
import { BlockRenderer } from './blocks/BlockRenderer'
import { MarkdownContent } from './MarkdownContent'
import { useStore } from '@/store'
import type { ChatMessage as ChatMessageType } from '@/types/chat'

interface ChatMessageProps {
  message: ChatMessageType
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { toggleBlockExpanded, currentGeneratingMessageId } = useStore()
  const streamingText = useStore(state =>
    message.id === state.textStreamingMessageId ? state.streamingText : null
  )
  const isUser = message.role === 'user'
  const hasBlocks = message.blocks && message.blocks.length > 0
  const isActivelyGenerating = message.id === currentGeneratingMessageId

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
          'min-w-0 rounded-lg text-sm',
          isUser
            ? 'max-w-[90%] overflow-hidden bg-accent text-white rounded-br-sm px-3 py-2'
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
          <div className="space-y-2 min-w-0 overflow-hidden">
            {hasBlocks && (
              <BlockRenderer blocks={message.blocks!} isStreaming={false} onToggleThinking={handleToggleBlock} />
            )}
            {/* Live streaming text preview — separate from committed blocks */}
            {streamingText && (
              <div className="bg-bg-elevated text-text-secondary border border-border rounded-lg px-4 py-3 overflow-hidden">
                <p className="whitespace-pre-wrap break-words text-sm">
                  {streamingText}
                  <span className="inline-block w-0.5 h-4 bg-accent/70 ml-0.5 align-middle animate-pulse" />
                </p>
              </div>
            )}
            {/* Fallback: show msg.content if no text blocks and not streaming */}
            {message.content && !isActivelyGenerating && !streamingText &&
             (!hasBlocks || !message.blocks!.some(b => b.type === 'text')) && (
              <div className="bg-bg-elevated text-text-secondary border border-border rounded-lg px-4 py-3 overflow-hidden">
                <MarkdownContent content={message.content} />
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
