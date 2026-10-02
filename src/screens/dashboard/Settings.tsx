'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Sun, Moon, Monitor, Camera, Loader2, Eye, EyeOff, Trash2 } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { useHousehold } from '@/lib/household-context'
import { useAuth } from '@/lib/auth-context'
import { insforge } from '@/lib/insforge'
import { invalidateAvatarCache } from '@/services/householdService'
import { Switch } from '@/components/ui/Switch'

interface SectionProps {
  title: string
  children: React.ReactNode
}

interface NotificationPreferences {
  tasks: boolean
  expenses: boolean
  maintenance: boolean
  shopping: boolean
}

const DEFAULT_NOTIFS: NotificationPreferences = {
  tasks: true,
  expenses: true,
  maintenance: true,
  shopping: false,
}

function extractKeyFromAvatarUrl(url?: string | null): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    const pathname = decodeURIComponent(parsed.pathname)
    const match = pathname.match(/\/objects\/(.+)$/)
    if (match && match[1]) return match[1]
  } catch {
    const match = decodeURIComponent(url).match(/\/objects\/(.+)$/)
    if (match && match[1]) return match[1]
  }
  return null
}

function Section({ title, children }: SectionProps) {
  return (
    <div className="border border-line dark:border-dark-line rounded-[6px] overflow-hidden">
      <div className="px-6 py-4 border-b border-line dark:border-dark-line bg-bg dark:bg-dark-bg">
        <h3 className="text-[12px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted">{title}</h3>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const { refreshMembers } = useHousehold()
  const { user, updateProfile, changePassword } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [profile, setProfile] = useState({ name: (user?.profile?.name as string) || '' })
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })
  const [showPasswords, setShowPasswords] = useState<{
    current: boolean
    next: boolean
    confirm: boolean
  }>({
    current: false,
    next: false,
    confirm: false,
  })
  const [notifs, setNotifs] = useState<NotificationPreferences>(DEFAULT_NOTIFS)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    if (user?.profile?.name) {
      setProfile({ name: user.profile.name as string })
    }
  }, [user])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const notifPrefsKey = user?.id ? `homeos_notif_prefs_${user.id}` : 'homeos_notif_prefs_guest'
    let parsedLocal: Partial<NotificationPreferences> | null = null

    try {
      const rawLocal = localStorage.getItem(notifPrefsKey)
      if (rawLocal) {
        parsedLocal = JSON.parse(rawLocal)
      }
    } catch (e) {
      console.error('Error reading notification preferences from localStorage:', e)
    }

    const cloudPrefs = user?.profile?.notification_preferences as Partial<NotificationPreferences> | undefined

    if (cloudPrefs || parsedLocal) {
      const merged: NotificationPreferences = {
        ...DEFAULT_NOTIFS,
        ...(parsedLocal || {}),
        ...(cloudPrefs || {}),
      }
      setNotifs(merged)
      try {
        localStorage.setItem(notifPrefsKey, JSON.stringify(merged))
      } catch (e) {
        console.error('Error syncing notification preferences to localStorage:', e)
      }
    }
  }, [user])

  const handleToggleNotification = async (key: keyof NotificationPreferences, checked: boolean) => {
    const updatedNotifs: NotificationPreferences = {
      ...notifs,
      [key]: checked,
    }
    setNotifs(updatedNotifs)

    const notifPrefsKey = user?.id ? `homeos_notif_prefs_${user.id}` : 'homeos_notif_prefs_guest'
    try {
      localStorage.setItem(notifPrefsKey, JSON.stringify(updatedNotifs))
    } catch (err) {
      console.error('Error saving notification preferences to localStorage:', err)
    }

    if (user && updateProfile) {
      try {
        await updateProfile({
          ...user.profile,
          notification_preferences: updatedNotifs,
        })
      } catch (err) {
        console.error('Error syncing notification preferences to profile:', err)
      }
    }
    toast('Preferencia guardada.')
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (!file.type.startsWith('image/')) {
      toast('Por favor selecciona una imagen válida.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast('La imagen debe pesar menos de 5MB.')
      return
    }

    const previousKey = (user.profile?.avatar_key as string) || extractKeyFromAvatarUrl(user.profile?.avatar_url as string)

    setUploadingAvatar(true)
    toast('Subiendo foto de perfil...')

    try {
      const fileExt = file.name.split('.').pop() || 'jpg'
      const filePath = `${user.id}/avatar_${Date.now()}.${fileExt}`

      if (filePath.includes('..')) {
        throw new Error('Invalid file path')
      }

      const { data: uploadData, error: uploadError } = await insforge.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError || !uploadData) {
        throw uploadError || new Error('Error al subir imagen a almacenamiento')
      }

      const { error: profileError } = await updateProfile({
        avatar_url: uploadData.url,
        avatar_key: uploadData.key,
      })

      if (profileError) {
        throw profileError
      }

      // Synchronously await the purge of older avatar files
      try {
        const keysToDelete = new Set<string>()
        if (previousKey && previousKey !== uploadData.key) {
          keysToDelete.add(previousKey)
        }

        const { data: listData } = await insforge.storage
          .from('avatars')
          .list({ prefix: `${user.id}/` })

        if (listData?.objects && listData.objects.length > 0) {
          for (const obj of listData.objects) {
            if (obj.key !== uploadData.key) {
              keysToDelete.add(obj.key)
            }
          }
        }

        if (keysToDelete.size > 0) {
          await Promise.allSettled(
            Array.from(keysToDelete).map(key => insforge.storage.from('avatars').remove(key))
          )
        }
      } catch (cleanupErr) {
        console.warn('Automatic avatar cleanup warning:', cleanupErr)
      }

      invalidateAvatarCache(user.id)
      await refreshMembers()

      toast('Foto de perfil actualizada.')
    } catch (err: unknown) {
      const error = err as Error
      console.error('Error al subir avatar:', error)
      toast(error.message || 'Error al actualizar foto de perfil.')
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteAvatar = async () => {
    if (!user) return
    const previousKey = (user.profile?.avatar_key as string) || extractKeyFromAvatarUrl(user.profile?.avatar_url as string)
    setUploadingAvatar(true)
    toast('Eliminando foto de perfil...')
    try {
      if (previousKey) {
        await insforge.storage.from('avatars').remove(previousKey).catch(() => {})
      }
      const { error: profileError } = await updateProfile({
        avatar_url: null,
        avatar_key: null,
      })
      if (profileError) {
        throw profileError
      }
      invalidateAvatarCache(user.id)
      await refreshMembers()
      toast('Foto de perfil eliminada.')
    } catch (err: unknown) {
      const error = err as Error
      console.error('Error al eliminar avatar:', error)
      toast(error.message || 'Error al eliminar foto de perfil.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (user) {
      try {
        const { error } = await updateProfile({ name: profile.name })
        if (error) {
          toast('Error al actualizar perfil.')
          return
        }
      } catch {
        // Fall through
      }
    }
    toast('Perfil actualizado.')
  }

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwords.next !== passwords.confirm) {
      toast('Las contraseñas no coinciden.')
      return
    }
    if (user) {
      try {
        const { error } = await changePassword(passwords.current, passwords.next)
        if (error) {
          toast(error.message || 'Error al actualizar contraseña.')
          return
        }
      } catch {
        // Fall through
      }
    }
    toast('Contraseña actualizada.')
    setPasswords({ current: '', next: '', confirm: '' })
    setShowPasswords({ current: false, next: false, confirm: false })
  }

  const displayName = (user?.profile?.name as string) || profile.name || user?.email?.split('@')[0] || 'Usuario'
  const displayEmail = user?.email || ''
  const avatarUrl = user?.profile?.avatar_url as string | undefined
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U'

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[800px] mx-auto">
      {/* Header */}
      <div className="mb-10 border-b border-line dark:border-dark-line pb-8">
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted dark:text-dark-muted mb-2">Cuenta</p>
        <h1 className="text-[42px] font-light leading-[0.95] tracking-[-0.02em] text-ink dark:text-dark-ink">CONFIGURACIÓN</h1>
      </div>

      <div className="space-y-6">
        {/* Profile */}
        <Section title="Perfil">
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="flex items-center gap-4 mb-5">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-olive text-white text-[20px] font-semibold flex items-center justify-center shadow-sm overflow-hidden">
                  {uploadingAvatar ? (
                    <Loader2 size={24} className="animate-spin text-white" />
                  ) : avatarUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-surface dark:bg-dark-surface border border-line dark:border-dark-line rounded-full flex items-center justify-center text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors cursor-pointer disabled:opacity-50"
                  title="Cambiar foto de perfil"
                >
                  <Camera size={11} />
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleDeleteAvatar}
                    disabled={uploadingAvatar}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-surface dark:bg-dark-surface border border-line dark:border-dark-line rounded-full flex items-center justify-center text-muted dark:text-dark-muted hover:text-terracotta dark:hover:text-dark-terracotta transition-colors cursor-pointer disabled:opacity-50"
                    title="Eliminar foto de perfil"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold text-ink dark:text-dark-ink">{displayName}</div>
                <div className="text-[12px] text-muted dark:text-dark-muted">{displayEmail}</div>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">Nombre completo</label>
              <input
                value={profile.name}
                onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg focus:outline-none focus:border-olive"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">Email</label>
              <input
                value={displayEmail}
                disabled
                className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-muted dark:text-dark-muted bg-bg dark:bg-dark-bg cursor-not-allowed opacity-75"
              />
              <p className="text-[11px] text-muted dark:text-dark-muted mt-1">El email no se puede cambiar directamente.</p>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[13px] font-medium hover:opacity-80 transition-opacity"
              >
                Guardar cambios
              </button>
            </div>
          </form>
        </Section>

        {/* Security */}
        <Section title="Seguridad">
          <form onSubmit={savePassword} className="space-y-4">
            {(
              [
                { label: 'Contraseña actual', key: 'current' },
                { label: 'Nueva contraseña', key: 'next' },
                { label: 'Confirmar nueva contraseña', key: 'confirm' },
              ] as const
            ).map(f => {
              const isVisible = showPasswords[f.key]
              return (
                <div key={f.key}>
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">{f.label}</label>
                  <div className="relative">
                    <input
                      type={isVisible ? 'text' : 'password'}
                      value={passwords[f.key]}
                      onChange={e => setPasswords(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full px-3.5 pr-10 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg placeholder:text-muted/40 focus:outline-none focus:border-olive"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(p => ({ ...p, [f.key]: !p[f.key] }))}
                      aria-label={isVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      title={isVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink dark:text-dark-muted dark:hover:text-dark-ink transition-colors cursor-pointer"
                    >
                      {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )
            })}
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[13px] font-medium hover:opacity-80 transition-opacity"
              >
                Actualizar contraseña
              </button>
            </div>
          </form>
        </Section>

        {/* Theme */}
        <Section title="Apariencia">
          <div>
            <p className="text-[13px] text-muted dark:text-dark-muted mb-4">Elige cómo deseas que se vea HomeOS.</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: 'light', label: 'Claro', icon: Sun },
                { key: 'dark', label: 'Oscuro', icon: Moon },
                { key: 'system', label: 'Sistema', icon: Monitor },
              ] as const).map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTheme(t.key)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-[4px] border transition-colors ${
                    theme === t.key
                      ? 'border-olive dark:border-dark-olive bg-olive-soft dark:bg-dark-olive-soft'
                      : 'border-line dark:border-dark-line hover:border-muted'
                  }`}
                >
                  <t.icon size={18} className={theme === t.key ? 'text-olive dark:text-dark-olive' : 'text-muted dark:text-dark-muted'} />
                  <span className={`text-[12px] font-medium ${theme === t.key ? 'text-olive dark:text-dark-olive' : 'text-muted dark:text-dark-muted'}`}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Notifications */}
        <Section title="Notificaciones">
          <div className="space-y-4">
            {(
              [
                { key: 'tasks', label: 'Tareas', desc: 'Tareas asignadas y vencidas' },
                { key: 'expenses', label: 'Gastos', desc: 'Nuevos gastos registrados' },
                { key: 'maintenance', label: 'Mantenimiento', desc: 'Servicios próximos o atrasados' },
                { key: 'shopping', label: 'Compras', desc: 'Cambios en listas de compras' },
              ] as const
            ).map(n => (
              <div key={n.key} className="flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-medium text-ink dark:text-dark-ink">{n.label}</div>
                  <div className="text-[11px] text-muted dark:text-dark-muted">{n.desc}</div>
                </div>
                <Switch
                  checked={Boolean(notifs[n.key])}
                  onChange={checked => handleToggleNotification(n.key, checked)}
                  aria-label={n.label}
                />
              </div>
            ))}
            <div className="pt-2 border-t border-line dark:border-dark-line">
              <button
                type="button"
                onClick={() => toast('Notificación de prueba enviada.')}
                className="text-[12px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink border border-line dark:border-dark-line px-3 py-1.5 rounded transition-colors"
              >
                Probar notificaciones
              </button>
            </div>
          </div>
        </Section>
      </div>
    </div>
  )
}
