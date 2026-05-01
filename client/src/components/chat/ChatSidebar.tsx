import { useRef, useEffect, useState, useCallback } from 'react'
import { Sparkles, ArrowDown } from 'lucide-react'
import { useUser } from '@clerk/clerk-react'
import { ChatMessage } from '@/components/chat/ChatMessage'
import { ChatInput } from '@/components/chat/ChatInput'
import { useStore, type CampaignFileType } from '@/store'
import { useWebSocket } from '@/hooks/useWebSocket'
import { isDevMode } from '@/lib/auth'

export function ChatSidebar() {
  const {
    getActiveChatMessages,
    activeCampaignId,
    isCreatingCampaign,
    sourceCampaignName,
    currentGeneratingMessageId,
    appState,
    campaigns,
  } = useStore()
  const { isConnected, generate, followUp, cancel } = useWebSocket()

  // First name for welcome message — Clerk user, fallback chain. Dev mode skips Clerk.
  const clerkUser = isDevMode() ? null : useUser().user
  const firstName =
    clerkUser?.firstName ||
    clerkUser?.username ||
    clerkUser?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    'there'

  const isWorkspaceEmpty = appState === 'workspace' && campaigns.length === 0

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
    const { selectedAspectRatio: ratio } = useStore.getState()

    // When creating a new campaign, trigger generation via WebSocket
    if (isCreatingCampaign && message.content.trim() && isConnected) {
      generate(message.content.trim(), assetFileIds.length > 0 ? assetFileIds : undefined, ratio)
      return
    }

    // Empty-workspace state: typing in chat starts a fresh campaign
    if (isWorkspaceEmpty && message.content.trim() && isConnected) {
      generate(message.content.trim(), assetFileIds.length > 0 ? assetFileIds : undefined, ratio)
      return
    }

    // Existing campaign: send follow-up to AI
    if (activeCampaignId && message.content.trim()) {
      followUp(activeCampaignId, message.content.trim(), assetFileIds.length > 0 ? assetFileIds : undefined, ratio)
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
        {showEmptyState && isWorkspaceEmpty ? (
          // First-time / zero-campaigns welcome bubble. Styled like an assistant message.
          <div className="flex flex-col gap-3 px-1 pt-2">
            <div className="flex items-start gap-2.5">
              <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-bg-elevated flex items-center justify-center mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
              </div>
              <div className="flex-1 min-w-0 text-sm text-text-primary leading-relaxed">
                <p>Hi <span className="font-semibold">{firstName}</span>, I'm your creative agent. Drop a URL or describe your business in the box, and I'll:</p>
                <ol className="mt-3 space-y-1.5 list-decimal list-inside text-text-secondary">
                  <li>Research the brand — reviews, products, customer language</li>
                  <li>Write ad hooks across multiple angles</li>
                  <li>Generate matching ad creatives</li>
                </ol>
                <p className="mt-3 text-text-secondary">
                  Each run takes about 5–8 minutes. You can follow up anytime — rewrite hooks, try a different angle, switch the art direction, or generate more creatives. Just keep chatting.
                </p>
              </div>
            </div>
          </div>
        ) : showEmptyState ? (
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
        autoFocus={isCreatingCampaign || isWorkspaceEmpty}
      />
    </div>
  )
}
