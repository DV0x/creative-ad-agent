import { cn } from '@/lib/utils'
import { BlockRenderer } from './blocks/BlockRenderer'
import { MarkdownContent } from './MarkdownContent'
import { useStore } from '@/store'
import type { ChatMessage as ChatMessageType } from '@/types/chat'

interface ChatMessageProps {
  message: ChatMessageType
}

const INK = '#231F20'
const BONE_2 = 'var(--color-bg-raised-2)'
const WINE = 'var(--color-accent)'
const WINE_HAIRLINE = 'rgba(120, 40, 74, 0.10)'

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
    <div className={cn('flex flex-col gap-1 min-w-0 animate-fadeIn', isUser ? 'items-end' : 'items-start')}>
      {isUser ? (
        <UserBubble message={message} />
      ) : (
        <div className="w-full min-w-0">
          <div className="space-y-2 min-w-0 overflow-hidden">
            {hasBlocks && (
              <BlockRenderer blocks={message.blocks!} isStreaming={false} onToggleThinking={handleToggleBlock} />
            )}

            {/* Live streaming text — wrapped in agent surface */}
            {streamingText && (
              <AgentSurface>
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-text-primary">
                  {streamingText}
                  <span className="inline-block w-0.5 h-4 bg-accent/70 ml-0.5 align-middle animate-pulse" />
                </p>
              </AgentSurface>
            )}

            {/* Fallback content (no text block, not streaming) */}
            {message.content && !isActivelyGenerating && !streamingText &&
             (!hasBlocks || !message.blocks!.some(b => b.type === 'text')) && (
              <AgentSurface>
                <MarkdownContent content={message.content} />
              </AgentSurface>
            )}
          </div>
        </div>
      )}

      {/* Timestamp */}
      <span className={cn(
        'text-[10px] font-mono tracking-tight text-text-muted/80',
        isUser ? 'pr-1' : 'pl-1'
      )}>
        {isUser ? 'you' : 'sage'} · {formatTime(message.timestamp)}
      </span>
    </div>
  )
}

/**
 * Editorial agent surface — bone-2 background + wine left rule.
 * The wine rule reads as a quote-mark, signaling this is Sage's voice.
 */
function AgentSurface({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-r-lg rounded-bl-lg px-4 py-3 min-w-0 overflow-hidden"
      style={{
        backgroundColor: BONE_2,
        borderLeft: `2px solid ${WINE}`,
        boxShadow: `0 0 0 1px ${WINE_HAIRLINE}`,
      }}
    >
      {children}
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
              className="px-1.5 py-0.5 rounded text-[11px] font-mono"
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
              className="px-1.5 py-0.5 rounded text-[11px] font-mono"
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

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
