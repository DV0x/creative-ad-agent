import { useRef, useEffect, useState, useCallback } from 'react'
import { Sparkles, ArrowDown } from 'lucide-react'
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

  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const isNearBottom = useRef(true)
  const [showScrollButton, setShowScrollButton] = useState(false)

  const chatMessages = getActiveChatMessages()
  const isGenerating = !!currentGeneratingMessageId

  // Detect if user scrolled away from bottom
  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100
    isNearBottom.current = nearBottom
    setShowScrollButton(!nearBottom)
  }, [])

  // Auto-scroll on DOM mutations (streaming text, new elements)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const observer = new MutationObserver(() => {
      if (isNearBottom.current) {
        el.scrollTop = el.scrollHeight
      }
    })
    observer.observe(el, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [])

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (isNearBottom.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatMessages])

  // Reset to auto-scroll when generation starts
  useEffect(() => {
    if (isGenerating) {
      isNearBottom.current = true
      setShowScrollButton(false)
    }
  }, [isGenerating])

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      isNearBottom.current = true
      setShowScrollButton(false)
    }
  }, [])

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
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 px-3 py-4 overflow-y-auto"
      >
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
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <div className="relative">
          <button
            onClick={scrollToBottom}
            className="absolute -top-10 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-bg-elevated border border-border shadow-md flex items-center justify-center hover:bg-bg-hover transition-colors z-10"
          >
            <ArrowDown className="w-4 h-4 text-text-secondary" />
          </button>
        </div>
      )}

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
