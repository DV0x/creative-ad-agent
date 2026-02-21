import { useRef, useEffect } from 'react'
import { Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer'
import { BlockRenderer } from '@/components/chat/blocks/BlockRenderer'
import { ChatInput } from '@/components/chat/ChatInput'
import { useStore, type ChatMessage, type CampaignFileType } from '@/store'
import { useWebSocket } from '@/hooks/useWebSocket'
import { cn } from '@/lib/utils'

interface MobileChatDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileChatDrawer({ open, onOpenChange }: MobileChatDrawerProps) {
  const {
    getActiveChatMessages,
    activeCampaignId,
    isCreatingCampaign,
    currentGeneratingMessageId,
  } = useStore()
  const { isConnected, generate, cancel, followUp } = useWebSocket()
  const scrollRef = useRef<HTMLDivElement>(null)

  const chatMessages = getActiveChatMessages()
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
    const assetFileIds = message.assetRefs.filter(id => id.startsWith('file_'))

    // When creating a new campaign, trigger generation via WebSocket
    if (isCreatingCampaign && message.content.trim() && isConnected) {
      generate(message.content.trim(), assetFileIds.length > 0 ? assetFileIds : undefined)
      return
    }

    // Existing campaign: send follow-up to AI
    if (activeCampaignId && message.content.trim()) {
      followUp(activeCampaignId, message.content.trim(), assetFileIds.length > 0 ? assetFileIds : undefined)
    }
  }

  const handleCancel = () => {
    cancel()
  }

  const showEmptyState = chatMessages.length === 0

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-bg-raised border-border max-h-[85vh]">
        <DrawerHeader className="border-b border-border pb-3">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-text-primary">
              {isCreatingCampaign ? 'New Campaign' : 'Chat'}
            </DrawerTitle>
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
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput
          onSubmit={handleSubmit}
          disabled={isGenerating}
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
  const { toggleBlockExpanded } = useStore()
  const isUser = message.role === 'user'
  const hasBlocks = message.blocks && message.blocks.length > 0

  const handleToggleBlock = (blockId: string) => {
    if (message.campaignId) {
      toggleBlockExpanded(message.campaignId, message.id, blockId)
    }
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
          {hasBlocks ? (
            <BlockRenderer blocks={message.blocks!} onToggleThinking={handleToggleBlock} />
          ) : (
            message.content && (
              <div className="px-3 py-2 rounded-lg text-sm bg-bg-elevated text-text-secondary border border-border rounded-bl-sm">
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
              </div>
            )
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
