'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Sun, Moon, Monitor, Camera, Loader2 } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/lib/auth-context'
import { insforge } from '@/lib/insforge'
import { Switch } from '@/components/ui/Switch'

interface SectionProps {
  title: string
  children: React.ReactNode
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
  const { user, updateProfile, changePassword } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [profile, setProfile] = useState({ name: (user?.profile?.name as string) || '' })
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })
  const [notifs, setNotifs] = useState({ tasks: true, expenses: true, maintenance: true, shopping: false })
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    if (user?.profile?.name) {
      setProfile({ name: user.profile.name as string })
    }
  }, [user])

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

    setUploadingAvatar(true)
    toast('Subiendo foto de perfil...')

    try {
      const fileExt = file.name.split('.').pop() || 'jpg'
      const filePath = `${user.id}/avatar_${Date.now()}.${fileExt}`

      const { data: uploadData, error: uploadError } = await insforge.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError || !uploadData) {
        throw uploadError || new Error('Error al subir imagen a almacenamiento')
      }

      const { error: profileError } = await updateProfile({
        avatar_url: uploadData.url,
      })

      if (profileError) {
        throw profileError
      }

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
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-surface dark:bg-dark-surface border border-line dark:border-dark-line rounded-full flex items-center justify-center text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors cursor-pointer"
                  title="Cambiar foto de perfil"
                >
                  <Camera size={11} />
                </button>
              </div>
              <div>
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
            {[
              { label: 'Contraseña actual', key: 'current' },
              { label: 'Nueva contraseña', key: 'next' },
              { label: 'Confirmar nueva contraseña', key: 'confirm' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-1.5">{f.label}</label>
                <input
                  type="password"
                  value={passwords[f.key as keyof typeof passwords]}
                  onChange={e => setPasswords(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg placeholder:text-muted/40 focus:outline-none focus:border-olive"
                />
              </div>
            ))}
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
            <p className="text-[13px] text-muted dark:text-dark-muted mb-4">Elegí cómo querés que se vea HomeOS.</p>
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
            {[
              { key: 'tasks', label: 'Tareas', desc: 'Tareas asignadas y vencidas' },
              { key: 'expenses', label: 'Gastos', desc: 'Nuevos gastos registrados' },
              { key: 'maintenance', label: 'Mantenimiento', desc: 'Servicios próximos o atrasados' },
              { key: 'shopping', label: 'Compras', desc: 'Cambios en listas de compras' },
            ].map(n => (
              <div key={n.key} className="flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-medium text-ink dark:text-dark-ink">{n.label}</div>
                  <div className="text-[11px] text-muted dark:text-dark-muted">{n.desc}</div>
                </div>
                <Switch
                  checked={Boolean(notifs[n.key as keyof typeof notifs])}
                  onChange={checked => setNotifs(p => ({ ...p, [n.key]: checked }))}
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
