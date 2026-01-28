import { useState } from 'react'
import { ChevronUp, ChevronDown, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useStore } from '@/store'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
}

const DUMMY_MESSAGES: Message[] = [
  { id: 1, role: 'user', content: 'Create ads for nike.com' },
  {
    id: 2,
    role: 'assistant',
    content:
      "I researched Nike and created 6 ad concepts:\n• 2 stat-based (social proof)\n• 2 story-based (emotional)\n• 2 urgency-based (FOMO)"
  }
]

export function ChatBar() {
  const { chatExpanded, setChatExpanded } = useStore()
  const [message, setMessage] = useState('')
  const [messages] = useState<Message[]>(DUMMY_MESSAGES)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      // Would send message here
      setMessage('')
    }
  }

  if (!chatExpanded) {
    // Collapsed view
    return (
      <div className="border-t border-border bg-bg-raised">
        <button
          onClick={() => setChatExpanded(true)}
          className="w-full max-w-5xl mx-auto px-4 py-3 flex items-center gap-2 text-left hover:bg-bg-elevated transition-colors"
        >
          <span className="text-lg">💬</span>
          <span className="text-sm text-text-muted flex-1">
            Type to edit: "make image 3 brighter" or "@nike/hooks"
          </span>
          <ChevronUp className="w-4 h-4 text-text-muted" />
        </button>
      </div>
    )
  }

  // Expanded view
  return (
    <div className="border-t border-border bg-bg-raised shadow-xl animate-slideUp">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-medium text-text-primary">Chat</span>
          <button
            onClick={() => setChatExpanded(false)}
            className="p-1 hover:bg-bg-elevated rounded transition-colors"
          >
            <ChevronDown className="w-4 h-4 text-text-muted" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="max-w-5xl mx-auto px-4 py-4 h-64 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`${msg.role === 'user' ? 'text-right' : ''}`}
          >
            <div
              className={`inline-block max-w-[80%] px-4 py-2 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-accent text-white'
                  : 'bg-bg-elevated text-text-secondary border border-border'
              }`}
            >
              <p className="text-sm whitespace-pre-line">{msg.content}</p>
            </div>
            <p className="text-xs text-text-muted mt-1">
              {msg.role === 'user' ? 'You' : 'Agent'}
            </p>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-border">
        <form
          onSubmit={handleSubmit}
          className="max-w-5xl mx-auto px-4 py-3 flex gap-2"
        >
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type here... @mentions for files"
            className="flex-1"
          />
          <Button type="submit" disabled={!message.trim()} variant="glow">
            <Send className="w-4 h-4" />
            Send
          </Button>
        </form>
      </div>
    </div>
  )
}
