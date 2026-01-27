import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer'
import { useStore } from '@/store'
import { cn } from '@/lib/utils'

interface MobileChatDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileChatDrawer({ open, onOpenChange }: MobileChatDrawerProps) {
  const { chatMessages, addChatMessage, appState } = useStore()
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current && open) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatMessages, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    addChatMessage({
      role: 'user',
      content: message.trim(),
      assetRefs: []
    })

    setMessage('')
    setIsTyping(true)

    setTimeout(() => {
      addChatMessage({
        role: 'assistant',
        content: "I'll help you with that. What specific changes would you like me to make to the creatives?",
        assetRefs: []
      })
      setIsTyping(false)
    }, 1500)
  }

  const showEmptyState = chatMessages.length === 0 && appState === 'empty'

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
        <div className="p-4 border-t border-border">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 h-10 text-base bg-bg-elevated border-border"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!message.trim() || isTyping}
              variant="glow"
              className="h-10 w-10 shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <p className="text-xs text-text-muted mt-2 px-1">
            Use @ to mention assets
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

interface MobileChatMessageProps {
  message: {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
  }
}

function MobileChatMessage({ message }: MobileChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex flex-col', isUser && 'items-end')}>
      <div
        className={cn(
          'max-w-[85%] px-3 py-2 rounded-lg text-sm',
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
