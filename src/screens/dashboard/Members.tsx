'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Copy, QrCode, ChevronDown, Loader2 } from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import { useHousehold } from '@/context/HouseholdContext'
import { QRCode } from '@/components/QRCode'
import {
  getHouseholdMembers,
  updateMemberRole,
  removeMember,
} from '@/services/householdService'

export interface MemberDisplayItem {
  id: string
  name: string
  email: string
  role: string
  joinedAt: string
  avatar: string
  color: string
}

const colors = ['#9D9652', '#7A8B7B', '#8FA89B', '#C97963', '#B8977E']
const roleLabels: Record<string, string> = {
  OWNER: 'Propietario',
  ADMIN: 'Administrador',
  MEMBER: 'Miembro',
  Propietaria: 'Propietario',
  Propietario: 'Propietario',
  Administrador: 'Administrador',
  Miembro: 'Miembro',
}

const roles = ['Propietario', 'Administrador', 'Miembro']

export default function Members() {
  const { toast } = useToast()
  const { currentHousehold } = useHousehold()
  const [members, setMembers] = useState<MemberDisplayItem[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [showQR, setShowQR] = useState(false)

  const householdCode = currentHousehold?.invite_code || ''
  const householdName = currentHousehold?.name || 'Mi residencia'

  useEffect(() => {
    if (!currentHousehold) {
      setLoading(false)
      return
    }
    let mounted = true
    setLoading(true)
    getHouseholdMembers(currentHousehold.id)
      .then(res => {
        if (mounted && res) {
          setMembers(
            res.map((m, idx) => ({
              id: m.user_id,
              name: m.name || m.email.split('@')[0],
              email: m.email,
              role: roleLabels[m.role] || 'Miembro',
              joinedAt: new Date(m.joined_at).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }),
              avatar: (m.name || m.email)?.[0]?.toUpperCase() || 'U',
              color: colors[idx % colors.length],
            }))
          )
        }
      })
      .catch(err => {
        console.error('Failed to load members:', err)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [currentHousehold])

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast('Código copiado.')
  }

  const changeRole = async (id: string, newRoleText: string) => {
    setMembers(prev => prev.map(m => (m.id === id ? { ...m, role: newRoleText } : m)))
    toast('Rol actualizado.')

    if (currentHousehold) {
      try {
        const backendRole = newRoleText === 'Administrador' ? 'ADMIN' : 'MEMBER'
        await updateMemberRole(currentHousehold.id, id, backendRole)
      } catch (err) {
        console.error('Failed to update member role on server:', err)
      }
    }
  }

  const remove = async (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id))
    toast('Miembro eliminado.')

    if (currentHousehold) {
      try {
        await removeMember(currentHousehold.id, id)
      } catch (err) {
        console.error('Failed to remove member on server:', err)
      }
    }
  }

  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/invite/${householdCode}`
    : `https://homeos.mathiast.me/invite/${householdCode}`

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1280px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 border-b border-line dark:border-dark-line pb-8">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted dark:text-dark-muted mb-2">Comunidad</p>
          <h1 className="text-[42px] lg:text-[56px] font-light leading-[0.95] tracking-[-0.02em] text-ink dark:text-dark-ink">MIEMBROS</h1>
          <p className="text-[14px] text-muted dark:text-dark-muted mt-3">
            {members.length} {members.length === 1 ? 'persona con' : 'personas con'} acceso a {householdName}
          </p>
        </div>
        <button
          onClick={() => {
            setInviteOpen(true)
            setShowQR(false)
          }}
          disabled={!householdCode}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg rounded-[4px] text-[13px] font-medium hover:opacity-80 transition-opacity cursor-pointer disabled:opacity-50"
        >
          <Plus size={14} /> Invitar miembro
        </button>
      </div>

      {/* Members list */}
      <div className="border border-line dark:border-dark-line rounded-[6px] divide-y divide-line dark:divide-dark-line overflow-hidden">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-muted dark:text-dark-muted gap-2">
            <Loader2 size={24} className="animate-spin text-olive" />
            <span className="text-[13px]">Cargando miembros...</span>
          </div>
        ) : members.length === 0 ? (
          <div className="py-12 px-6 text-center">
            <p className="text-[14px] text-ink dark:text-dark-ink font-medium mb-1">No hay miembros registrados</p>
            <p className="text-[12px] text-muted dark:text-dark-muted max-w-sm mx-auto mb-4">
              Invita a personas compartiendo el enlace o código de invitación para administrar el hogar juntos.
            </p>
            <button
              onClick={() => {
                setInviteOpen(true)
                setShowQR(false)
              }}
              className="px-4 py-2 border border-line dark:border-dark-line rounded-[4px] text-[12px] text-ink dark:text-dark-ink hover:border-olive transition-colors"
            >
              Generar invitación
            </button>
          </div>
        ) : (
          members.map(m => (
            <div key={m.id} className="p-5 flex items-center gap-4 hover:bg-bg/40 dark:hover:bg-dark-surface/40 transition-colors group">
              <div
                className="w-10 h-10 rounded-full text-white text-[13px] font-semibold flex items-center justify-center flex-shrink-0"
                style={{ background: m.color }}
              >
                {m.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold text-ink dark:text-dark-ink truncate">{m.name}</div>
                <div className="text-[12px] text-muted dark:text-dark-muted truncate">{m.email}</div>
              </div>
              <div className="text-[12px] text-muted dark:text-dark-muted hidden md:block">
                Se unió {m.joinedAt}
              </div>
              <div className="relative">
                {m.role === 'Propietario' || m.role === 'Propietaria' ? (
                  <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded bg-olive-soft dark:bg-dark-surface text-olive dark:text-dark-olive">
                    Propietario
                  </span>
                ) : (
                  <select
                    value={m.role}
                    onChange={e => changeRole(m.id, e.target.value)}
                    className="text-[12px] bg-transparent border border-line dark:border-dark-line rounded px-2 py-1 text-ink dark:text-dark-ink focus:outline-none focus:border-olive cursor-pointer"
                  >
                    {roles.map(r => (
                      <option key={r} value={r} className="bg-surface dark:bg-dark-surface text-ink dark:text-dark-ink">{r}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex items-center gap-1 ml-auto lg:ml-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {m.role !== 'Propietario' && m.role !== 'Propietaria' && (
                  <button
                    onClick={() => remove(m.id)}
                    className="p-1.5 text-muted dark:text-dark-muted hover:text-terracotta dark:hover:text-dark-terracotta transition-colors cursor-pointer"
                    title="Eliminar miembro"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Invite modal */}
      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/20 dark:bg-black/40" onClick={() => setInviteOpen(false)} />
          <div className="relative bg-surface dark:bg-dark-surface border border-line dark:border-dark-line rounded-[8px] shadow-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-semibold text-ink dark:text-dark-ink truncate pr-2">
                Invitar a {householdName}
              </h3>
              <button onClick={() => setInviteOpen(false)} className="text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink cursor-pointer"><X size={16} /></button>
            </div>

            <div className="mb-5">
              <p className="text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-2">Código de invitación</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 font-mono text-[18px] tracking-[0.12em] font-semibold text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg px-3 py-2.5 rounded-[4px] border border-line dark:border-dark-line">
                  {householdCode || '--------'}
                </div>
                <button
                  onClick={() => copy(householdCode)}
                  disabled={!householdCode}
                  className="p-2.5 border border-line dark:border-dark-line rounded-[4px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink hover:border-olive transition-colors cursor-pointer disabled:opacity-50"
                  title="Copiar código"
                >
                  <Copy size={15} />
                </button>
              </div>
            </div>

            <div className="mb-5">
              <p className="text-[11px] font-semibold tracking-widest uppercase text-muted dark:text-dark-muted mb-2">Enlace de invitación</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 text-[11px] font-mono text-muted dark:text-dark-muted bg-bg dark:bg-dark-bg px-3 py-2.5 rounded-[4px] border border-line dark:border-dark-line truncate">
                  {inviteUrl}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(inviteUrl)
                    toast('Enlace copiado.')
                  }}
                  disabled={!householdCode}
                  className="p-2.5 border border-line dark:border-dark-line rounded-[4px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink hover:border-olive transition-colors cursor-pointer disabled:opacity-50"
                  title="Copiar enlace"
                >
                  <Copy size={15} />
                </button>
              </div>
            </div>

            {/* QR Toggle / Container */}
            <div className="mb-5">
              {showQR ? (
                <div className="flex flex-col items-center p-4 bg-white rounded-[6px] border border-line">
                  <QRCode value={inviteUrl} size={180} />
                  <button
                    onClick={() => setShowQR(false)}
                    className="mt-3 text-[11px] text-muted hover:text-ink underline cursor-pointer"
                  >
                    Ocultar QR
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowQR(true)}
                  disabled={!householdCode}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[12px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors cursor-pointer disabled:opacity-50"
                >
                  <QrCode size={13} /> Mostrar código QR
                </button>
              )}
            </div>

            <div className="pt-4 border-t border-line dark:border-dark-line">
              <p className="text-[11px] text-muted dark:text-dark-muted">Cualquier persona con el código podrá unirse a este hogar.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
