import { CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StatusBlockData } from '@/types/chat'

interface StatusBlockProps {
  block: StatusBlockData
}

const variantStyles = {
  info: {
    container: 'border-accent/20 bg-accent/[0.06] text-accent',
    icon: Info,
  },
  success: {
    container: 'border-green-600/20 bg-green-600/[0.06] text-green-700',
    icon: CheckCircle2,
  },
  error: {
    container: 'border-red-500/20 bg-red-500/[0.06] text-red-600',
    icon: AlertCircle,
  },
} as const

export function StatusBlock({ block }: StatusBlockProps) {
  const variant = variantStyles[block.variant]
  const Icon = variant.icon

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium',
        variant.container,
      )}
    >
      <Icon className="h-3 w-3 shrink-0" />
      <span className="break-words">{block.text}</span>
    </div>
  )
}
