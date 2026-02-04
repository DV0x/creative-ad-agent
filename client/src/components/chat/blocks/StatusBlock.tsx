import { CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StatusBlockData } from '@/types/chat'

interface StatusBlockProps {
  block: StatusBlockData
}

const variantStyles = {
  info: {
    container: 'border-accent/20 bg-accent/5 text-accent',
    icon: Info,
  },
  success: {
    container: 'border-green-500/20 bg-green-500/5 text-green-600',
    icon: CheckCircle2,
  },
  error: {
    container: 'border-red-500/20 bg-red-500/5 text-red-500',
    icon: AlertCircle,
  },
} as const

export function StatusBlock({ block }: StatusBlockProps) {
  const variant = variantStyles[block.variant]
  const Icon = variant.icon

  return (
    <div className={cn('inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs', variant.container)}>
      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
      <span className="break-words">{block.text}</span>
    </div>
  )
}
