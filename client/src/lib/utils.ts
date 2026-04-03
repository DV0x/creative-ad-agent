import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Display a campaign name — truncates cleanly if too long */
export function formatCampaignName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return 'Untitled Campaign'
  if (trimmed.length <= 50) return trimmed
  return trimmed.substring(0, 47) + '...'
}
