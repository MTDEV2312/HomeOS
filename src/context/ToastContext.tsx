'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

export interface Toast {
  id: string
  message: string
  title?: string
  type?: 'default' | 'success' | 'error' | 'info' | 'warning'
}

export interface ToastContextType {
  toasts: Toast[]
  toast: (messageOrTitle: string, typeOrMessage?: Toast['type'] | string, maybeType?: Toast['type']) => void
  success: (titleOrMessage: string, message?: string) => void
  error: (titleOrMessage: string, message?: string) => void
  info: (titleOrMessage: string, message?: string) => void
  warning?: (titleOrMessage: string, message?: string) => void
}

const ToastContext = createContext<ToastContextType>({
  toasts: [],
  toast: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
})

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((messageOrTitle: string, typeOrMessage?: Toast['type'] | string, maybeType?: Toast['type']) => {
    const id = Math.random().toString(36).slice(2)
    
    let message = messageOrTitle
    let title: string | undefined = undefined
    let type: Toast['type'] = 'default'

    // Redesign signature: toast(message, type)
    if (typeOrMessage === 'default' || typeOrMessage === 'success' || typeOrMessage === 'error' || typeOrMessage === 'info' || typeOrMessage === 'warning') {
      type = typeOrMessage
      message = messageOrTitle
    } else if (typeof typeOrMessage === 'string' && typeOrMessage.length > 0) {
      // Legacy signature: toast(title, message, type)
      title = messageOrTitle
      message = typeOrMessage
      type = maybeType || 'info'
    }

    setToasts(prev => [...prev, { id, title, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  const success = useCallback((titleOrMessage: string, message?: string) => {
    addToast(titleOrMessage, message || 'success', message ? 'success' : undefined)
  }, [addToast])

  const error = useCallback((titleOrMessage: string, message?: string) => {
    addToast(titleOrMessage, message || 'error', message ? 'error' : undefined)
  }, [addToast])

  const info = useCallback((titleOrMessage: string, message?: string) => {
    addToast(titleOrMessage, message || 'info', message ? 'info' : undefined)
  }, [addToast])

  return (
    <ToastContext.Provider value={{ toasts, toast: addToast, success, error, info, warning: error }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`
              px-4 py-3 text-sm font-medium rounded-[4px] shadow-lg pointer-events-auto
              transition-all duration-300 border flex flex-col gap-0.5
              ${t.type === 'error' || t.type === 'warning'
                ? 'bg-terracotta-bg border-terracotta text-terracotta dark:bg-dark-surface dark:border-dark-terracotta dark:text-dark-terracotta'
                : t.type === 'success'
                  ? 'bg-olive-soft border-olive text-olive dark:bg-dark-surface dark:border-dark-olive dark:text-dark-olive'
                  : 'bg-surface border-line text-ink dark:bg-dark-surface dark:border-dark-line dark:text-dark-ink'
              }
            `}
          >
            {t.title && <div className="font-semibold text-[13px]">{t.title}</div>}
            <div className="text-[13px]">{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
export default ToastContext
