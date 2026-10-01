'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react'

export interface NotificationItem {
  id: string
  title: string
  description: string
  timestamp: string // ISO format
  read: boolean
  type: 'info' | 'success' | 'warning' | 'alert'
  link?: string
}

export type NewNotificationInput = Omit<NotificationItem, 'id' | 'timestamp' | 'read'> & {
  id?: string
  timestamp?: string
  read?: boolean
}

export interface NotificationContextType {
  notifications: NotificationItem[]
  unreadCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
  clearAll: () => void
  addNotification: (item: NewNotificationInput) => void
}

const STORAGE_KEY = 'homeos_notifications_v1'

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'notif_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36)
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Hydrate from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setNotifications(parsed)
        }
      }
    } catch (e) {
      console.error('[NotificationContext] Failed to load notifications from localStorage', e)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Sync to localStorage when notifications change (after initial mount)
  useEffect(() => {
    if (!isLoaded) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
    } catch (e) {
      console.error('[NotificationContext] Failed to save notifications to localStorage', e)
    }
  }, [notifications, isLoaded])

  // Sync with other browser tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          if (Array.isArray(parsed)) {
            setNotifications(parsed)
          }
        } catch {
          // Ignore parse errors from other tabs
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const addNotification = useCallback((item: NewNotificationInput) => {
    const newItem: NotificationItem = {
      id: item.id || generateId(),
      title: item.title,
      description: item.description,
      timestamp: item.timestamp || new Date().toISOString(),
      read: item.read ?? false,
      type: item.type || 'info',
      link: item.link,
    }

    setNotifications(prev => [newItem, ...prev])
  }, [])

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(item => (item.id === id ? { ...item, read: true } : item))
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(item => (item.read ? item : { ...item, read: true })))
  }, [])

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(item => item.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const unreadCount = useMemo(() => {
    return notifications.filter(item => !item.read).length
  }, [notifications])

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAll,
      addNotification,
    }),
    [notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll, addNotification]
  )

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

export default NotificationContext
