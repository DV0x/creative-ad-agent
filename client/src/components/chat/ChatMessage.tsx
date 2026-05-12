import { cn } from '@/lib/utils'
import { BlockRenderer } from './blocks/BlockRenderer'
import { MarkdownContent } from './MarkdownContent'
import { useStore } from '@/store'
import type { ChatMessage as ChatMessageType } from '@/types/chat'

interface ChatMessageProps {
  message: ChatMessageType
}

const INK = '#231F20'

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
    <div className={cn('flex flex-col min-w-0 animate-fadeIn', isUser ? 'items-end' : 'items-start')}>
      {isUser ? (
        <UserBubble message={message} />
      ) : (
        <div className="w-full min-w-0">
          <div className="space-y-2 min-w-0 overflow-hidden">
            {hasBlocks && (
              <BlockRenderer blocks={message.blocks!} isStreaming={false} onToggleThinking={handleToggleBlock} />
            )}

            {streamingText && (
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-text-primary px-1">
                {streamingText}
                <span className="inline-block w-0.5 h-4 bg-accent/70 ml-0.5 align-middle animate-pulse" />
              </p>
            )}

            {message.content && !isActivelyGenerating && !streamingText &&
             (!hasBlocks || !message.blocks!.some(b => b.type === 'text')) && (
              <div className="px-1">
                <MarkdownContent content={message.content} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function UserBubble({ message }: { message: ChatMessageType }) {
  return (
    <div
      className="max-w-[85%] min-w-0 rounded-2xl rounded-br-sm px-3.5 py-2.5 text-sm overflow-hidden"
      style={{
        backgroundColor: INK,
        color: '#FBF9F5',
      }}
    >
      {message.fileRefs && message.fileRefs.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {message.fileRefs.map((ref, i) => (
            <span
              key={i}
              className="px-1.5 py-0.5 rounded text-[11px]"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.10)', color: '#FBF9F5' }}
            >
              @{ref.fileType}
            </span>
          ))}
        </div>
      )}
      {message.imageRefs && message.imageRefs.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {message.imageRefs.map((ref, i) => (
            <span
              key={i}
              className="px-1.5 py-0.5 rounded text-[11px]"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.10)', color: '#FBF9F5' }}
            >
              @image-{ref.imageId}
            </span>
          ))}
        </div>
      )}
      <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
    </div>
  )
}
