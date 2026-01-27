import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AssetMention } from '@/components/mentions/AssetMention'
import { useStore, type AssetFolder, type AssetFile, type CampaignFileType } from '@/store'
import { cn } from '@/lib/utils'

export function ChatSidebar() {
  const { chatMessages, addChatMessage, appState, getActiveCampaign } = useStore()
  const [message, setMessage] = useState('')
  const [mentionedFolders, setMentionedFolders] = useState<AssetFolder[]>([])
  const [mentionedFiles, setMentionedFiles] = useState<CampaignFileType[]>([])
  const [mentionedAssetFiles, setMentionedAssetFiles] = useState<AssetFile[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const activeCampaign = getActiveCampaign()

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatMessages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const hasMentions = mentionedFolders.length > 0 || mentionedFiles.length > 0 || mentionedAssetFiles.length > 0
    if (!message.trim() && !hasMentions) return

    // Build message content with mentioned items
    const campaignFileNames = mentionedFiles.map(f => `@${f}`).join(' ')
    const folderNames = mentionedFolders.map(f => `@${f.name}`).join(' ')
    const assetFileNames = mentionedAssetFiles.map(f => `@${f.name}`).join(' ')
    const mentionPrefix = [campaignFileNames, folderNames, assetFileNames].filter(Boolean).join(' ')
    const fullMessage = mentionPrefix
      ? `${mentionPrefix} ${message.trim()}`.trim()
      : message.trim()

    // Add user message
    addChatMessage({
      role: 'user',
      content: fullMessage,
      fileRefs: mentionedFiles,
      assetRefs: [...mentionedFolders.map(f => f.id), ...mentionedAssetFiles.map(f => f.id)]
    })

    setMessage('')
    setMentionedFolders([])
    setMentionedFiles([])
    setMentionedAssetFiles([])
    setIsTyping(true)

    // Simulate assistant response
    setTimeout(() => {
      let response = "I'll help you with that. What specific changes would you like me to make to the creatives?"

      if (mentionedFiles.length > 0 && activeCampaign) {
        const fileDescriptions = mentionedFiles.map(f => {
          switch (f) {
            case 'research': return 'brand research'
            case 'hooks': return 'ad hooks'
            case 'prompts': return 'image prompts'
            default: return f
          }
        })
        response = `I'll reference the ${fileDescriptions.join(' and ')} from "${activeCampaign.name}" to help with your request. What changes would you like me to make?`
      } else if (mentionedAssetFiles.length > 0) {
        response = `I'll use ${mentionedAssetFiles.map(f => f.name).join(', ')} to help with your request. What specific changes would you like me to make?`
      } else if (mentionedFolders.length > 0) {
        response = `I'll use the assets from ${mentionedFolders.map(f => f.name).join(', ')} to help with your request. What specific changes would you like me to make?`
      }

      addChatMessage({
        role: 'assistant',
        content: response,
        fileRefs: [],
        assetRefs: []
      })
      setIsTyping(false)
    }, 1500)
  }

  const showEmptyState = chatMessages.length === 0 && appState === 'empty'

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
              Start creating
            </p>
            <p className="text-xs text-text-muted">
              Enter a prompt to generate ad creatives
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {chatMessages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
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
      <div className="p-3 border-t border-border">
        <form onSubmit={handleSubmit} className="space-y-2">
          <AssetMention
            value={message}
            onChange={setMessage}
            onFolderMention={setMentionedFolders}
            onFileMention={setMentionedFiles}
            onAssetFileMention={setMentionedAssetFiles}
            mentionedFolders={mentionedFolders}
            mentionedFiles={mentionedFiles}
            mentionedAssetFiles={mentionedAssetFiles}
            placeholder="Type a message..."
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={(!message.trim() && mentionedFolders.length === 0 && mentionedFiles.length === 0 && mentionedAssetFiles.length === 0) || isTyping}
              variant="glow"
            >
              <Send className="w-4 h-4" />
              Send
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface ChatMessageProps {
  message: {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
  }
}

function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex flex-col', isUser && 'items-end')}>
      <div
        className={cn(
          'max-w-[90%] px-3 py-2 rounded-lg text-sm',
          isUser
            ? 'bg-accent text-white rounded-br-sm'
            : 'bg-bg-elevated text-text-secondary border border-border rounded-bl-sm'
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
      </div>
      <span className="text-[10px] text-text-muted mt-1 px-1">
        {isUser ? 'You' : 'Agent'} · {formatTime(message.timestamp)}
      </span>
    </div>
  )
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
