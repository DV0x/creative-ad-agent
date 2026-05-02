import { useCallback, useState } from 'react'

/**
 * useState that syncs to localStorage. Reads synchronously on first render
 * (no flicker). Writes on every change.
 *
 * Designed for UI preferences — sidebar open/closed, panel widths, etc. Don't use
 * for data that needs cross-tab consistency or app-state coherence; use the store
 * (which has its own persist middleware) for those.
 */
export function useLocalStorageState<T>(
  key: string,
  defaultValue: T,
  options?: {
    parse?: (raw: string) => T | undefined
    serialize?: (value: T) => string
  }
): [T, (value: T | ((prev: T) => T)) => void] {
  const parse = options?.parse ?? defaultParse
  const serialize = options?.serialize ?? defaultSerialize

  const [value, setValueState] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue
    const raw = localStorage.getItem(key)
    if (raw === null) return defaultValue
    const parsed = parse(raw) as T | undefined
    return parsed === undefined ? defaultValue : parsed
  })

  const setValue = useCallback((next: T | ((prev: T) => T)) => {
    setValueState(prev => {
      const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next
      try {
        localStorage.setItem(key, serialize(resolved))
      } catch {
        // Storage full / disabled / private mode — fail silently. The in-memory
        // state still updates so the UI works for the session.
      }
      return resolved
    })
  }, [key, serialize])

  return [value, setValue]
}

function defaultParse<T>(raw: string): T | undefined {
  try {
    return JSON.parse(raw) as T
  } catch {
    return undefined
  }
}

function defaultSerialize<T>(value: T): string {
  return JSON.stringify(value)
}

/**
 * Numeric variant with bounds clamping. Used for resizable panel widths.
 */
export function useLocalStorageNumber(
  key: string,
  defaultValue: number,
  min: number,
  max: number
): [number, (value: number | ((prev: number) => number)) => void] {
  return useLocalStorageState<number>(key, defaultValue, {
    parse: (raw) => {
      const n = parseInt(raw, 10)
      if (isNaN(n) || n < min || n > max) return undefined
      return n
    },
    serialize: (value) => String(value),
  })
}
