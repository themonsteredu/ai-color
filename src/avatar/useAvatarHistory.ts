import { useCallback, useState } from 'react'
import type { AvatarState } from './types'

interface HistoryState {
  past: AvatarState[]
  present: AvatarState
  future: AvatarState[]
}

export function useAvatarHistory(initialState: AvatarState) {
  const [history, setHistory] = useState<HistoryState>(() => ({ past: [], present: initialState, future: [] }))

  const setAvatar = useCallback((next: AvatarState | ((current: AvatarState) => AvatarState)) => {
    setHistory((current) => {
      const resolved = typeof next === 'function' ? next(current.present) : next
      if (JSON.stringify(resolved) === JSON.stringify(current.present)) return current
      return { past: [...current.past.slice(-39), current.present], present: resolved, future: [] }
    })
  }, [])

  const undo = useCallback(() => {
    setHistory((current) => {
      const previous = current.past[current.past.length - 1]
      if (!previous) return current
      return { past: current.past.slice(0, -1), present: previous, future: [current.present, ...current.future] }
    })
  }, [])

  const redo = useCallback(() => {
    setHistory((current) => {
      const next = current.future[0]
      if (!next) return current
      return { past: [...current.past, current.present], present: next, future: current.future.slice(1) }
    })
  }, [])

  const reset = useCallback((next: AvatarState) => setHistory({ past: [], present: next, future: [] }), [])

  return { avatar: history.present, setAvatar, undo, redo, reset, canUndo: history.past.length > 0, canRedo: history.future.length > 0 }
}
