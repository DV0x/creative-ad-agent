import { useState, useRef, useEffect } from 'react'
import { Sparkles } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ThinkingBlock } from '@/components/chat/ThinkingBlock'
import { ChatInput } from '@/components/chat/ChatInput'
import { useStore, type CampaignFileType, type ChatMessage } from '@/store'
import { useWebSocket } from '@/hooks/useWebSocket'
import { cn } from '@/lib/utils'

export function ChatSidebar() {
  const {
    getActiveChatMessages,
    addChatMessage,
    getActiveCampaign,
    activeCampaignId,
    isCreatingCampaign,
    setPrompt,
    currentGeneratingMessageId,
  } = useStore()
  const { isConnected, generate, cancel } = useWebSocket()
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const activeCampaign = getActiveCampaign()
  const chatMessages = getActiveChatMessages()
  const isGenerating = !!currentGeneratingMessageId

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatMessages])

  const handleSubmit = (message: {
    content: string
    fileRefs: { fileType: CampaignFileType }[]
    assetRefs: string[]
    imageRefs: { imageId: number }[]
  }) => {
    // When creating a new campaign, trigger generation via WebSocket
    if (isCreatingCampaign && message.content.trim() && isConnected) {
      setPrompt(message.content.trim())
      // generate() reads from promptRef which syncs from store.prompt
      // Use setTimeout to ensure the store update propagates to the ref
      setTimeout(() => generate(), 0)
      return
    }

    if (!activeCampaignId) return

    // Add user message to existing campaign
    addChatMessage(activeCampaignId, {
      role: 'user',
      content: message.content,
      fileRefs: message.fileRefs,
      assetRefs: message.assetRefs,
      imageRefs: message.imageRefs,
    })

    setIsTyping(true)

    // Simulate assistant response (will be replaced by actual WebSocket handling)
    setTimeout(() => {
      if (!activeCampaignId) return

      let response = "I'll help you with that. What specific changes would you like me to make to the creatives?"

      if (message.imageRefs.length > 0) {
        const imageCount = message.imageRefs.length
        response = `I'll regenerate ${imageCount === 1 ? 'Image ' + message.imageRefs[0].imageId : imageCount + ' images'} based on your feedback.`
      } else if (message.fileRefs.length > 0 && activeCampaign) {
        const fileDescriptions = message.fileRefs.map(f => {
          switch (f.fileType) {
            case 'research': return 'brand research'
            case 'hooks': return 'ad hooks'
            case 'prompts': return 'image prompts'
            default: return f.fileType
          }
        })
        response = `I'll reference the ${fileDescriptions.join(' and ')} from "${activeCampaign.name}" to help with your request.`
      }

      addChatMessage(activeCampaignId, {
        role: 'assistant',
        content: response,
        fileRefs: [],
        assetRefs: [],
      })
      setIsTyping(false)
    }, 1500)
  }

  const handleCancel = () => {
    cancel()
  }

  const showEmptyState = chatMessages.length === 0

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <ScrollArea className="flex-1 px-3 py-4" ref={scrollRef}>
        {showEmptyState ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <div className="w-10 h-10 rounded-lg bg-bg-elevated flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <p className="text-sm text-text-secondary mb-1">
              {isCreatingCampaign ? 'New campaign' : 'Start creating'}
            </p>
            <p className="text-xs text-text-muted">
              {isCreatingCampaign
                ? 'Enter a website URL or describe a business below'
                : 'Enter a prompt to generate ad creatives'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {chatMessages.map((msg) => (
              <ChatMessageComponent key={msg.id} message={msg} />
            ))}
            {isTyping && (
              <div className="flex items-center gap-2 text-text-muted">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs">Agent is typing...</span>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <ChatInput
        onSubmit={handleSubmit}
        disabled={isTyping}
        isGenerating={isGenerating}
        onCancel={handleCancel}
      />
    </div>
  )
}

interface ChatMessageProps {
  message: ChatMessage
}

function ChatMessageComponent({ message }: ChatMessageProps) {
  const { toggleThinking } = useStore()
  const isUser = message.role === 'user'
  const hasGeneration = message.generation !== undefined

  const handleToggleThinking = () => {
    toggleThinking(message.id)
  }

  return (
    <div className={cn('flex flex-col', isUser && 'items-end')}>
      {/* User messages - simple bubble */}
      {isUser && (
        <div className="max-w-[90%] px-3 py-2 rounded-lg text-sm bg-accent text-white rounded-br-sm">
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
      )}

      {/* Assistant messages */}
      {!isUser && (
        <div className="max-w-[90%] space-y-2">
          {/* Thinking block for generation messages */}
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

          {/* Message content (only show if there's content) */}
          {message.content && (
            <div className="px-3 py-2 rounded-lg text-sm bg-bg-elevated text-text-secondary border border-border rounded-bl-sm">
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            </div>
          )}

          {/* Typing indicator when generating but no content yet */}
          {hasGeneration && message.generation?.status === 'generating' && !message.content && (
            <div className="px-3 py-2 text-text-muted text-sm">
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          )}
        </div>
      )}

      <span className="text-[10px] text-text-muted mt-1 px-1">
        {isUser ? 'You' : 'Agent'} · {formatTime(message.timestamp)}
      </span>
    </div>
  )
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
