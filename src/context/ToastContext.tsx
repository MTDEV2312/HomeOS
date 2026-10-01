'use client'

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { X } from 'lucide-react'

export interface Toast {
  id: string
  message: string
  title?: string
  type?: 'default' | 'success' | 'error' | 'info' | 'warning'
  count?: number
}

export interface ToastContextType {
  toasts: Toast[]
  toast: (messageOrTitle: string, typeOrMessage?: Toast['type'] | string, maybeType?: Toast['type']) => void
  success: (titleOrMessage: string, message?: string) => void
  error: (titleOrMessage: string, message?: string) => void
  info: (titleOrMessage: string, message?: string) => void
  warning: (titleOrMessage: string, message?: string) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextType>({
  toasts: [],
  toast: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
  warning: () => {},
  dismiss: () => {},
})

const MAX_TOASTS = 3

const getToastDuration = (type?: Toast['type']): number => {
  return type === 'error' || type === 'warning' ? 5000 : 3500
}

const getToastStyle = (type?: Toast['type']) => {
  switch (type) {
    case 'error':
      return 'bg-terracotta-bg border-terracotta text-terracotta dark:bg-dark-surface dark:border-dark-terracotta dark:text-dark-terracotta'
    case 'warning':
      return 'bg-sand-bg border-sand text-ink dark:bg-dark-surface dark:border-dark-sand dark:text-dark-ink'
    case 'success':
      return 'bg-olive-soft border-olive text-olive dark:bg-dark-surface dark:border-dark-olive dark:text-dark-olive'
    case 'info':
    case 'default':
    default:
      return 'bg-surface border-line text-ink dark:bg-dark-surface dark:border-dark-line dark:text-dark-ink'
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastsRef = useRef<Toast[]>([])
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Keep toastsRef synchronized
  useEffect(() => {
    toastsRef.current = toasts
  }, [toasts])

  // Clear a timer for a specific toast ID
  const clearTimer = useCallback((id: string) => {
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  // Manual or automatic dismissal
  const dismiss = useCallback((id: string) => {
    clearTimer(id)
    const nextToasts = toastsRef.current.filter(t => t.id !== id)
    toastsRef.current = nextToasts
    setToasts(nextToasts)
  }, [clearTimer])

  // Schedule auto-dismiss timer
  const setDismissTimer = useCallback((id: string, duration: number) => {
    clearTimer(id)
    const timer = setTimeout(() => {
      dismiss(id)
    }, duration)
    timersRef.current.set(id, timer)
  }, [clearTimer, dismiss])

  // Clear all timers on unmount to avoid leaks
  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach(timer => clearTimeout(timer))
      timers.clear()
    }
  }, [])

  const addToast = useCallback((messageOrTitle: string, typeOrMessage?: Toast['type'] | string, maybeType?: Toast['type']) => {
    let message = messageOrTitle
    let title: string | undefined = undefined
    let type: Toast['type'] = 'default'

    // Redesign & legacy signatures support:
    // 1. toast(message, type)
    // 2. toast(title, message, type)
    // 3. toast(message)
    if (maybeType) {
      title = messageOrTitle
      message = typeof typeOrMessage === 'string' ? typeOrMessage : ''
      type = maybeType
    } else if (
      typeOrMessage === 'default' ||
      typeOrMessage === 'success' ||
      typeOrMessage === 'error' ||
      typeOrMessage === 'info' ||
      typeOrMessage === 'warning'
    ) {
      type = typeOrMessage
      message = messageOrTitle
    } else if (typeof typeOrMessage === 'string' && typeOrMessage.length > 0) {
      title = messageOrTitle
      message = typeOrMessage
      type = 'info'
    }

    const duration = getToastDuration(type)

    // Deduplication check: visible toast with matching message, type, and title
    const existingIndex = toastsRef.current.findIndex(t =>
      t.message === message &&
      (t.type || 'default') === (type || 'default') &&
      (t.title || undefined) === (title || undefined)
    )

    if (existingIndex !== -1) {
      const existing = toastsRef.current[existingIndex]
      const newCount = (existing.count || 1) + 1
      const updatedToast: Toast = {
        ...existing,
        count: newCount,
      }

      const nextToasts = [...toastsRef.current]
      nextToasts[existingIndex] = updatedToast
      toastsRef.current = nextToasts
      setToasts(nextToasts)

      // Restart fresh timer
      setDismissTimer(existing.id, duration)
      return
    }

    // New Toast (count: 1)
    const newId = Math.random().toString(36).slice(2)
    const newToast: Toast = {
      id: newId,
      title,
      message,
      type,
      count: 1,
    }

    let nextToasts = [...toastsRef.current]

    // Queue Limit: MAX_TOASTS = 3
    // Eviction candidate priority: oldest non-critical (type !== 'error' && type !== 'warning'),
    // else oldest toast
    while (nextToasts.length >= MAX_TOASTS) {
      const nonCriticalIndex = nextToasts.findIndex(t => t.type !== 'error' && t.type !== 'warning')
      const evictIndex = nonCriticalIndex !== -1 ? nonCriticalIndex : 0
      const evicted = nextToasts[evictIndex]
      clearTimer(evicted.id)
      nextToasts.splice(evictIndex, 1)
    }

    nextToasts.push(newToast)
    toastsRef.current = nextToasts
    setToasts(nextToasts)

    setDismissTimer(newId, duration)
  }, [clearTimer, setDismissTimer])

  const success = useCallback((titleOrMessage: string, message?: string) => {
    if (message) {
      addToast(titleOrMessage, message, 'success')
    } else {
      addToast(titleOrMessage, 'success')
    }
  }, [addToast])

  const error = useCallback((titleOrMessage: string, message?: string) => {
    if (message) {
      addToast(titleOrMessage, message, 'error')
    } else {
      addToast(titleOrMessage, 'error')
    }
  }, [addToast])

  const info = useCallback((titleOrMessage: string, message?: string) => {
    if (message) {
      addToast(titleOrMessage, message, 'info')
    } else {
      addToast(titleOrMessage, 'info')
    }
  }, [addToast])

  const warning = useCallback((titleOrMessage: string, message?: string) => {
    if (message) {
      addToast(titleOrMessage, message, 'warning')
    } else {
      addToast(titleOrMessage, 'warning')
    }
  }, [addToast])

  return (
    <ToastContext.Provider value={{ toasts, toast: addToast, success, error, info, warning, dismiss }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0">
        {toasts.map(t => (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            className={`
              animate-slide-up px-4 py-3 text-sm font-medium rounded-[4px] shadow-lg pointer-events-auto
              transition-all duration-300 border flex items-start justify-between gap-3
              ${getToastStyle(t.type)}
            `}
          >
            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
              {t.title ? (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[13px]">{t.title}</span>
                    {t.count && t.count > 1 ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-surface/80 dark:bg-dark-surface/80 border border-current/25 shrink-0">
                        ×{t.count}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-[13px] leading-relaxed break-words opacity-90">{t.message}</div>
                </>
              ) : (
                <div className="flex items-start gap-2 justify-between">
                  <div className="text-[13px] leading-relaxed break-words flex-1 min-w-0">{t.message}</div>
                  {t.count && t.count > 1 ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-surface/80 dark:bg-dark-surface/80 border border-current/25 shrink-0 mt-0.5">
                      ×{t.count}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="p-1 -mr-1 -mt-0.5 rounded text-current opacity-60 hover:opacity-100 hover:bg-current/10 transition-colors shrink-0 focus:outline-none focus:ring-1 focus:ring-current"
              aria-label="Cerrar notificación"
            >
              <X size={14} className="shrink-0" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
export default ToastContext
