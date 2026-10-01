'use client'

import React, { useEffect, useRef } from 'react'
import {
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  ExternalLink,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  X,
} from 'lucide-react'
import { useNotifications, NotificationItem } from '@/context/NotificationContext'
import { useRouter } from '@/lib/navigation'

interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
  anchorRef?: React.RefObject<HTMLElement | null>
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    if (diffMs < 0) return 'Recién'
    const diffSec = Math.floor(diffMs / 1000)
    if (diffSec < 60) return 'Recién'
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `Hace ${diffMin} min`
    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return `Hace ${diffHour} h`
    const diffDays = Math.floor(diffHour / 24)
    if (diffDays === 1) return 'Ayer'
    if (diffDays < 7) return `Hace ${diffDays} d`
    return date.toLocaleDateString('es-AR', { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

function NotificationIcon({ type }: { type: NotificationItem['type'] }) {
  switch (type) {
    case 'success':
      return <CheckCircle2 size={16} className="text-olive dark:text-dark-olive shrink-0" />
    case 'warning':
      return <AlertTriangle size={16} className="text-sand dark:text-dark-sand shrink-0" />
    case 'alert':
      return <AlertCircle size={16} className="text-terracotta dark:text-dark-terracotta shrink-0" />
    case 'info':
    default:
      return <Info size={16} className="text-softblue dark:text-dark-softblue shrink-0" />
  }
}

export default function NotificationPanel({
  isOpen,
  onClose,
  anchorRef,
}: NotificationPanelProps) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications()

  const router = useRouter()
  const panelRef = useRef<HTMLDivElement>(null)

  // Click outside and escape key listener
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node
      if (panelRef.current && !panelRef.current.contains(target)) {
        if (anchorRef?.current && anchorRef.current.contains(target)) {
          return
        }
        onClose()
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, anchorRef])

  if (!isOpen) return null

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.read) {
      markAsRead(item.id)
    }
    if (item.link) {
      router.push(item.link)
      onClose()
    }
  }

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Notificaciones"
      className="absolute right-0 top-11 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-surface dark:bg-dark-surface border border-line dark:border-dark-line rounded-[8px] shadow-2xl z-50 overflow-hidden flex flex-col max-h-[80vh] sm:max-h-[500px] animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-line dark:border-dark-line bg-surface dark:bg-dark-surface shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-[13px] font-semibold tracking-tight text-ink dark:text-dark-ink">
            Notificaciones
          </h3>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-olive-soft dark:bg-dark-olive-soft text-olive dark:text-dark-olive rounded-full">
              {unreadCount} {unreadCount === 1 ? 'nueva' : 'nuevas'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-[11px] font-medium text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink px-2 py-1 rounded hover:bg-olive-soft/40 dark:hover:bg-dark-olive-soft/40 transition-colors flex items-center gap-1.5"
              title="Marcar todas como leídas"
            >
              <CheckCheck size={13} className="text-olive dark:text-dark-olive" />
              <span>Marcar leídas</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink rounded hover:bg-olive-soft/40 dark:hover:bg-dark-olive-soft/40 transition-colors"
            aria-label="Cerrar"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto divide-y divide-line/60 dark:divide-dark-line/60">
        {notifications.length === 0 ? (
          <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-olive-soft/60 dark:bg-dark-olive-soft/60 flex items-center justify-center mb-3">
              <BellOff size={18} className="text-olive dark:text-dark-olive" />
            </div>
            <p className="text-[13px] font-medium text-ink dark:text-dark-ink mb-1">
              No tenés notificaciones pendientes
            </p>
            <p className="text-[11px] text-muted dark:text-dark-muted max-w-[220px]">
              Te avisaremos cuando haya novedades o avisos en tu hogar.
            </p>
          </div>
        ) : (
          notifications.map(item => (
            <div
              key={item.id}
              onClick={() => handleNotificationClick(item)}
              className={`group flex items-start gap-3 p-3 text-left transition-colors cursor-pointer ${
                item.read
                  ? 'bg-transparent hover:bg-bg/60 dark:hover:bg-dark-bg/60 border-l-2 border-transparent'
                  : 'bg-olive-soft/20 dark:bg-dark-olive-soft/20 border-l-2 border-olive dark:border-dark-olive hover:bg-olive-soft/30 dark:hover:bg-dark-olive-soft/30'
              }`}
            >
              <div className="pt-0.5">
                <NotificationIcon type={item.type} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {!item.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-terracotta shrink-0" />
                    )}
                    <span
                      className={`text-[12px] truncate ${
                        item.read
                          ? 'font-medium text-ink/80 dark:text-dark-ink/80'
                          : 'font-semibold text-ink dark:text-dark-ink'
                      }`}
                    >
                      {item.title}
                    </span>
                    {item.link && (
                      <ExternalLink size={11} className="text-muted shrink-0" />
                    )}
                  </div>
                  <span className="text-[10px] text-muted dark:text-dark-muted shrink-0">
                    {formatRelativeTime(item.timestamp)}
                  </span>
                </div>

                <p className="text-[11px] text-muted dark:text-dark-muted leading-relaxed line-clamp-2">
                  {item.description}
                </p>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pt-0.5">
                {!item.read && (
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      markAsRead(item.id)
                    }}
                    className="p-1 rounded text-muted hover:text-olive hover:bg-olive-soft/50 dark:hover:bg-dark-olive-soft/50 transition-colors"
                    title="Marcar como leída"
                  >
                    <Check size={12} />
                  </button>
                )}
                <button
                  onClick={e => {
                    e.stopPropagation()
                    deleteNotification(item.id)
                  }}
                  className="p-1 rounded text-muted hover:text-terracotta hover:bg-terracotta-bg/60 dark:hover:bg-dark-surface-2 transition-colors"
                  title="Eliminar notificación"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-2 border-t border-line dark:border-dark-line bg-bg/50 dark:bg-dark-bg/50 flex items-center justify-between text-[11px] shrink-0">
          <span className="text-muted dark:text-dark-muted">
            {notifications.length} {notifications.length === 1 ? 'notificación' : 'notificaciones'}
          </span>
          <button
            onClick={clearAll}
            className="text-terracotta dark:text-dark-terracotta hover:underline font-medium flex items-center gap-1 transition-colors"
          >
            <Trash2 size={11} />
            <span>Limpiar todo</span>
          </button>
        </div>
      )}
    </div>
  )
}
