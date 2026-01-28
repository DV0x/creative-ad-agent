import { cn } from '@/lib/utils'
import { ThinkingBlock } from './ThinkingBlock'
import { useStore } from '@/store'
import type { ChatMessage as ChatMessageType } from '@/types/chat'

interface ChatMessageProps {
  message: ChatMessageType
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { toggleThinking } = useStore()
  const isUser = message.role === 'user'
  const hasGeneration = message.generation !== undefined

  const handleToggleThinking = () => {
    toggleThinking(message.id)
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
            {/* Show file/asset refs if any */}
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

        {/* Assistant message with optional thinking block */}
        {!isUser && (
          <div className="space-y-2">
            {/* Thinking block for generation */}
            {hasGeneration && message.generation && (
              <ThinkingBlock
                lines={message.generation.thinkingLines}
                expanded={message.generation.thinkingExpanded}
                onToggle={handleToggleThinking}
                status={message.generation.status}
                completedImages={message.generation.completedImages}
                expectedImages={message.generation.expectedImages}
              />
            )}

            {/* Message content */}
            {message.content && (
              <div className="bg-bg-elevated text-text-secondary border border-border rounded-lg px-3 py-2">
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
              </div>
            )}

            {/* Show typing indicator if generating with no content yet */}
            {hasGeneration &&
              message.generation?.status === 'generating' &&
              !message.content && (
                <div className="flex items-center gap-2 text-text-muted px-1">
                  <div className="flex gap-1">
                    <span
                      className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
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
