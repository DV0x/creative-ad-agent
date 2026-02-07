import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Extract a clean display name from a raw campaign prompt */
export function formatCampaignName(name: string): string {
  let cleaned = name
    .replace(/^create\s+(an?\s+)?(single\s+|two\s+|three\s+|\d+\s+)?(\d+\s+)?ads?\s+for\s+/i, '')
    .trim()
  cleaned = cleaned.replace(/^https?:\/\/(www\.)?/i, '')
  cleaned = cleaned.replace(/\/$/, '')
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
  }
  return cleaned || name
}
