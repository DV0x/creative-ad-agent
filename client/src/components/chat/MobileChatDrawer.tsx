import { useState, useRef, useEffect } from 'react'
import { Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer'
import { ThinkingBlock } from '@/components/chat/ThinkingBlock'
import { ChatInput } from '@/components/chat/ChatInput'
import { useStore, type ChatMessage, type CampaignFileType } from '@/store'
import { cn } from '@/lib/utils'

interface MobileChatDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileChatDrawer({ open, onOpenChange }: MobileChatDrawerProps) {
  const {
    chatMessages,
    addChatMessage,
    getActiveCampaign,
    currentGeneratingMessageId,
  } = useStore()
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const activeCampaign = getActiveCampaign()
  const isGenerating = !!currentGeneratingMessageId

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current && open) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatMessages, open])

  const handleSubmit = (message: {
    content: string
    fileRefs: { fileType: CampaignFileType }[]
    assetRefs: string[]
    imageRefs: { imageId: number }[]
  }) => {
    addChatMessage({
      role: 'user',
      content: message.content,
      fileRefs: message.fileRefs,
      assetRefs: message.assetRefs,
      imageRefs: message.imageRefs,
    })

    setIsTyping(true)

    setTimeout(() => {
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

      addChatMessage({
        role: 'assistant',
        content: response,
        fileRefs: [],
        assetRefs: [],
      })
      setIsTyping(false)
    }, 1500)
  }

  const handleCancel = () => {
    console.log('Cancel generation')
  }

  const showEmptyState = chatMessages.length === 0

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-bg-raised border-border max-h-[85vh]">
        <DrawerHeader className="border-b border-border pb-3">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-text-primary">Chat</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon-xs">
                <X className="w-4 h-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-auto px-4 py-4 min-h-[300px] max-h-[50vh]"
        >
          {showEmptyState ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
              <div className="w-10 h-10 rounded-lg bg-bg-elevated flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5 text-accent" />
              </div>
              <p className="text-sm text-text-secondary mb-1">
                Start creating
              </p>
              <p className="text-xs text-text-muted">
                Enter a prompt to generate ad creatives
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {chatMessages.map((msg) => (
                <MobileChatMessage key={msg.id} message={msg} />
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
        </div>

        {/* Input */}
        <ChatInput
          onSubmit={handleSubmit}
          disabled={isTyping}
          isGenerating={isGenerating}
          onCancel={handleCancel}
        />
      </DrawerContent>
    </Drawer>
  )
}

interface MobileChatMessageProps {
  message: ChatMessage
}

function MobileChatMessage({ message }: MobileChatMessageProps) {
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
        <div className="max-w-[85%] px-3 py-2 rounded-lg text-sm bg-accent text-white rounded-br-sm">
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
      )}

      {/* Assistant messages */}
      {!isUser && (
        <div className="max-w-[85%] space-y-2">
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
