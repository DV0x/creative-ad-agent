import { useRef, useEffect, useState, useCallback } from 'react'
import { ArrowDown } from 'lucide-react'
import { useUser } from '@clerk/clerk-react'
import { ChatMessage } from '@/components/chat/ChatMessage'
import { ChatInput } from '@/components/chat/ChatInput'
import { useStore, type CampaignFileType } from '@/store'
import { useWebSocket } from '@/hooks/useWebSocket'
import { isDevMode } from '@/lib/auth'

const WINE = 'var(--color-accent)'
const WINE_HAIRLINE = 'rgba(120, 40, 74, 0.10)'
const BONE_2 = 'var(--color-bg-raised-2)'

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

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100
    isNearBottom.current = nearBottom
    setShowScrollButton(!nearBottom)
  }, [])

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

  useEffect(() => {
    if (isNearBottom.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatMessages])

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

    if (isCreatingCampaign && message.content.trim() && isConnected) {
      generate(message.content.trim(), assetFileIds.length > 0 ? assetFileIds : undefined, ratio)
      return
    }

    if (isWorkspaceEmpty && message.content.trim() && isConnected) {
      generate(message.content.trim(), assetFileIds.length > 0 ? assetFileIds : undefined, ratio)
      return
    }

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
          <WelcomeBubble firstName={firstName} />
        ) : showEmptyState ? (
          <EmptyHint
            isCreatingCampaign={isCreatingCampaign}
            sourceCampaignName={sourceCampaignName}
          />
        ) : (
          <div className="space-y-4 min-w-0 overflow-hidden">
            {chatMessages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Scroll to bottom — editorial pill */}
      {showScrollButton && (
        <div className="relative">
          <button
            onClick={scrollToBottom}
            className="absolute -top-10 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 hover:scale-105 z-10 animate-fadeIn"
            style={{
              backgroundColor: 'var(--color-bg-base)',
              boxShadow: `0 0 0 1px ${WINE_HAIRLINE}, 0 4px 12px rgba(35, 31, 32, 0.08)`,
              color: 'var(--color-text-secondary)',
            }}
            title="Scroll to bottom"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>
      )}

      <ChatInput
        onSubmit={handleSubmit}
        isGenerating={isGenerating}
        onCancel={handleCancel}
        autoFocus={isCreatingCampaign || isWorkspaceEmpty}
      />
    </div>
  )
}

/**
 * First-time welcome bubble — Sage's intro. Styled as an agent surface
 * so it reads as Sage's first message rather than a system banner.
 */
function WelcomeBubble({ firstName }: { firstName: string }) {
  return (
    <div className="flex flex-col gap-1 px-1 pt-2 animate-fadeIn">
      <div
        className="rounded-r-lg rounded-bl-lg px-4 py-3.5 min-w-0 overflow-hidden"
        style={{
          backgroundColor: BONE_2,
          borderLeft: `2px solid ${WINE}`,
          boxShadow: `0 0 0 1px ${WINE_HAIRLINE}`,
        }}
      >
        <p className="text-sm text-text-primary leading-relaxed">
          Hi <span className="font-semibold">{firstName}</span> — drop a brand URL or describe your business below. I'll:
        </p>
        <ol className="mt-3 space-y-1.5 text-sm text-text-secondary list-decimal list-inside marker:text-text-muted/80">
          <li>Read the brand — reviews, products, customer language</li>
          <li>Draft hooks across six creative angles</li>
          <li>Generate matching ads</li>
        </ol>
        <p className="mt-3 text-[13px] text-text-muted leading-relaxed">
          Each run takes 5–8 minutes. Follow up anytime — rewrite a hook, change the angle, swap the art direction.
        </p>
      </div>
      <span className="text-[10px] font-mono tracking-tight text-text-muted/80 pl-1 mt-0.5">
        sage · ready
      </span>
    </div>
  )
}

function EmptyHint({
  isCreatingCampaign,
  sourceCampaignName,
}: {
  isCreatingCampaign: boolean
  sourceCampaignName: string | null
}) {
  const title = isCreatingCampaign
    ? (sourceCampaignName ? `New campaign for ${sourceCampaignName}` : 'New campaign')
    : 'Start creating'

  const hint = isCreatingCampaign
    ? (sourceCampaignName
        ? 'Brand research loaded. Describe the angle or brief below.'
        : 'Paste a website URL or describe a business. Use @ to attach reference images.')
    : 'Type a brief below to generate ads.'

  return (
    <div className="flex flex-col items-start justify-center h-full px-2 py-8 animate-fadeIn">
      <span className="text-[11px] uppercase tracking-[0.14em] font-mono text-text-muted mb-2">
        {title}
      </span>
      <p className="text-sm text-text-secondary leading-relaxed max-w-[28ch]">
        {hint}
      </p>
    </div>
  )
}
