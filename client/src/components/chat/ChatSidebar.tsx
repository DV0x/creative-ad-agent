import { useRef, useEffect } from 'react'
import { Sparkles } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatMessage } from '@/components/chat/ChatMessage'
import { ChatInput } from '@/components/chat/ChatInput'
import { useStore, type CampaignFileType } from '@/store'
import { useWebSocket } from '@/hooks/useWebSocket'

export function ChatSidebar() {
  const {
    getActiveChatMessages,
    activeCampaignId,
    isCreatingCampaign,
    sourceCampaignName,
    currentGeneratingMessageId,
  } = useStore()
  const { isConnected, generate, followUp, cancel } = useWebSocket()

  const bottomRef = useRef<HTMLDivElement>(null)

  const chatMessages = getActiveChatMessages()
  const isGenerating = !!currentGeneratingMessageId

  // Auto-scroll to bottom when new messages arrive or content changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleSubmit = (message: {
    content: string
    fileRefs: { fileType: CampaignFileType }[]
    assetRefs: string[]
    imageRefs: { imageId: number }[]
  }) => {
    const assetFileIds = message.assetRefs.filter(id => id.startsWith('file_'))
    const { selectedAspectRatio } = useStore.getState()

    // When creating a new campaign, trigger generation via WebSocket
    if (isCreatingCampaign && message.content.trim() && isConnected) {
      generate(message.content.trim(), assetFileIds.length > 0 ? assetFileIds : undefined, selectedAspectRatio)
      return
    }

    // Existing campaign: send follow-up to AI
    if (activeCampaignId && message.content.trim()) {
      followUp(activeCampaignId, message.content.trim(), assetFileIds.length > 0 ? assetFileIds : undefined, selectedAspectRatio)
    }
  }

  const handleCancel = () => {
    cancel()
  }

  const showEmptyState = chatMessages.length === 0

  return (
    <div className="flex flex-col h-full min-w-0 overflow-hidden">
      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0 px-3 py-4 chat-scroll-area">
        {showEmptyState ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <div className="w-10 h-10 rounded-lg bg-bg-elevated flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <p className="text-sm text-text-secondary mb-1">
              {isCreatingCampaign
                ? (sourceCampaignName ? `New campaign for ${sourceCampaignName}` : 'New campaign')
                : 'Start creating'}
            </p>
            <p className="text-xs text-text-muted">
              {isCreatingCampaign
                ? (sourceCampaignName
                    ? 'Brand research loaded. Describe the campaign angle or brief below'
                    : 'Enter a website URL or describe a business. Attach product photos with the paperclip')
                : 'Enter a prompt to generate ad creatives'}
            </p>
          </div>
        ) : (
          <div className="space-y-4 min-w-0 overflow-hidden">
            {chatMessages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <ChatInput
        onSubmit={handleSubmit}
        isGenerating={isGenerating}
        onCancel={handleCancel}
        autoFocus={isCreatingCampaign}
      />
    </div>
  )
}
