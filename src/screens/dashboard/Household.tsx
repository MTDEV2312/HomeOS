'use client'

import { useState, useEffect } from 'react'
import { Copy, QrCode, Share2, LogOut, Trash2, Check, RefreshCw, X, Loader2 } from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import { useHousehold } from '@/context/HouseholdContext'
import { useAuth } from '@/context/AuthContext'
import { QRCode } from '@/components/QRCode'
import {
  updateHousehold,
  regenerateInviteCode,
  leaveHousehold,
  deleteHousehold,
  getHouseholdMembers,
  HouseholdMemberDetails,
} from '@/services/householdService'
import { useRouter } from '@/lib/navigation'

export default function Household() {
  const { toast } = useToast()
  const router = useRouter()
  const { currentHousehold, refreshHouseholds } = useHousehold()
  const { user } = useAuth()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(currentHousehold?.name || '')
  const [code, setCode] = useState(currentHousehold?.invite_code || '')
  const [membersList, setMembersList] = useState<HouseholdMemberDetails[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [showConfirmLeave, setShowConfirmLeave] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)

  useEffect(() => {
    if (currentHousehold) {
      setName(currentHousehold.name)
      setCode(currentHousehold.invite_code)
      setLoadingMembers(true)
      getHouseholdMembers(currentHousehold.id)
        .then(res => {
          if (res) {
            setMembersList(res)
          }
        })
        .catch(err => {
          console.error('Error fetching members:', err)
        })
        .finally(() => {
          setLoadingMembers(false)
        })
    }
  }, [currentHousehold])

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast(`${label} copiado.`)
  }

  const handleUpdateName = async () => {
    if (!name.trim()) return
    setEditing(false)
    toast('Nombre actualizado.')
    if (currentHousehold) {
      try {
        await updateHousehold(currentHousehold.id, { name })
        refreshHouseholds()
      } catch (err) {
        console.error('Failed to update household name:', err)
      }
    }
  }

  const handleRegenerateCode = async () => {
    if (currentHousehold) {
      try {
        const newCode = await regenerateInviteCode(currentHousehold.id)
        setCode(newCode)
        toast('Código regenerado.')
        refreshHouseholds()
      } catch {
        toast('Error al regenerar código.')
      }
    }
  }

  const handleLeave = async () => {
    setShowConfirmLeave(false)
    if (currentHousehold && user) {
      try {
        await leaveHousehold(currentHousehold.id, user.id)
        toast('Abandonaste el hogar.')
        await refreshHouseholds()
        router.push('/dashboard')
      } catch (err: unknown) {
        const error = err as Error
        toast(error.message || 'Error al abandonar el hogar.')
      }
    }
  }

  const handleDelete = async () => {
    setShowConfirmDelete(false)
    if (currentHousehold) {
      try {
        await deleteHousehold(currentHousehold.id)
        toast('Hogar eliminado.')
        await refreshHouseholds()
        router.push('/dashboard')
      } catch (err: unknown) {
        const error = err as Error
        toast(error.message || 'Error al eliminar el hogar.')
      }
    }
  }

  const inviteUrl = typeof window !== 'undefined' ? `${window.location.origin}/invite/${code}` : `https://homeos.mathiast.me/invite/${code}`

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1280px] mx-auto">
      {/* Header */}
      <div className="mb-10 border-b border-line dark:border-dark-line pb-8">
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted dark:text-dark-muted mb-2">Tu espacio</p>
        <h1 className="text-[42px] lg:text-[56px] font-light leading-[0.95] tracking-[-0.02em] text-ink dark:text-dark-ink">MI RESIDENCIA</h1>
        <p className="text-[14px] text-muted dark:text-dark-muted mt-3">La identidad digital de tu hogar.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-10">
        {/* Left */}
        <div className="space-y-6">
          {/* Identity card */}
          <div className="border border-line dark:border-dark-line rounded-[6px] overflow-hidden">
            <div className="relative h-48 bg-sage-soft dark:bg-dark-surface-2 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=384&fit=crop&auto=format"
                alt="Interior doméstico"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
              <div className="absolute bottom-4 left-6 right-6">
                {editing ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="bg-surface/90 text-ink text-[22px] font-semibold px-3 py-1 rounded focus:outline-none border border-olive"
                      autoFocus
                    />
                    <button onClick={handleUpdateName} className="p-1.5 bg-olive text-white rounded hover:opacity-90">
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <h2 className="text-[28px] font-semibold text-white drop-shadow">{name || 'Mi residencia'}</h2>
                )}
              </div>
            </div>
            <div className="px-6 py-5 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-muted dark:text-dark-muted">
                  Creado {currentHousehold?.created_at ? new Date(currentHousehold.created_at).toLocaleDateString('es-AR') : '—'} · {membersList.length} {membersList.length === 1 ? 'miembro' : 'miembros'}
                </div>
                <div className="text-[12px] font-semibold text-ink dark:text-dark-ink mt-0.5">
                  Residencia activa
                </div>
              </div>
              <button
                onClick={() => setEditing(true)}
                className="text-[12px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink border border-line dark:border-dark-line px-3 py-1.5 rounded transition-colors"
              >
                Editar nombre
              </button>
            </div>
          </div>

          {/* Invitation */}
          <div className="border border-line dark:border-dark-line rounded-[6px] p-5">
            <h3 className="text-[13px] font-semibold text-ink dark:text-dark-ink mb-4">Código de invitación</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 font-mono text-[22px] tracking-[0.15em] font-semibold text-ink dark:text-dark-ink bg-bg dark:bg-dark-bg px-4 py-3 rounded-[4px] border border-line dark:border-dark-line">
                {code || '--------'}
              </div>
              <button
                onClick={() => copy(code, 'Código')}
                disabled={!code}
                className="p-3 border border-line dark:border-dark-line rounded-[4px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink hover:border-olive transition-colors disabled:opacity-50"
                title="Copiar código"
              >
                <Copy size={16} />
              </button>
              <button
                onClick={handleRegenerateCode}
                className="p-3 border border-line dark:border-dark-line rounded-[4px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors"
                title="Regenerar código"
              >
                <RefreshCw size={16} />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copy(inviteUrl, 'Enlace')}
                disabled={!code}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[12px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors disabled:opacity-50"
              >
                <Copy size={13} /> Copiar enlace
              </button>
              <button
                onClick={() => setShowQRModal(true)}
                disabled={!code}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[12px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors cursor-pointer disabled:opacity-50"
              >
                <QrCode size={13} /> Ver QR
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: `Unite a ${name} en HomeOS`, url: inviteUrl }).catch(() => {})
                  } else {
                    copy(inviteUrl, 'Enlace')
                  }
                }}
                disabled={!code}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[12px] text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors disabled:opacity-50"
              >
                <Share2 size={13} /> Compartir
              </button>
            </div>
          </div>
        </div>

        {/* Right — Members preview */}
        <div className="space-y-6">
          <div className="border border-line dark:border-dark-line rounded-[6px] p-5">
            <h3 className="text-[13px] font-semibold text-ink dark:text-dark-ink mb-4">Miembros</h3>
            <div className="space-y-3">
              {loadingMembers ? (
                <div className="flex items-center justify-center py-6 text-muted dark:text-dark-muted gap-2 text-[12px]">
                  <Loader2 size={16} className="animate-spin" /> Cargando miembros...
                </div>
              ) : membersList.length > 0 ? (
                membersList.map(m => (
                  <div key={m.member_id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-olive text-white text-[11px] font-semibold flex items-center justify-center flex-shrink-0">
                      {m.name?.[0]?.toUpperCase() || m.email?.[0]?.toUpperCase() || 'M'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-ink dark:text-dark-ink truncate">{m.name || m.email}</div>
                      <div className="text-[11px] text-muted dark:text-dark-muted capitalize">{m.role.toLowerCase()}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-[12px] text-muted dark:text-dark-muted py-4 text-center">
                  No hay otros miembros registrados en este hogar.
                </div>
              )}
            </div>
          </div>

          {/* Danger zone */}
          <div className="border border-terracotta/30 dark:border-dark-terracotta/30 rounded-[6px] p-5">
            <h3 className="text-[12px] font-semibold tracking-widest uppercase text-terracotta dark:text-dark-terracotta mb-3">Zona de riesgo</h3>
            <div className="space-y-2">
              <button
                onClick={() => setShowConfirmLeave(true)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-terracotta dark:text-dark-terracotta border border-terracotta/20 dark:border-dark-terracotta/20 rounded-[4px] hover:bg-terracotta-bg dark:hover:bg-dark-surface transition-colors cursor-pointer"
              >
                <LogOut size={14} /> Abandonar hogar
              </button>
              <button
                onClick={() => setShowConfirmDelete(true)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-terracotta dark:text-dark-terracotta border border-terracotta/20 dark:border-dark-terracotta/20 rounded-[4px] hover:bg-terracotta-bg dark:hover:bg-dark-surface transition-colors cursor-pointer"
              >
                <Trash2 size={14} /> Eliminar hogar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" onClick={() => setShowQRModal(false)}>
          <div className="bg-surface dark:bg-dark-surface border border-line dark:border-dark-line rounded-[8px] p-6 max-w-sm w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-semibold text-ink dark:text-dark-ink">Código QR de invitación</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="p-1 text-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-ink transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-[12px] text-muted dark:text-dark-muted mb-4">
              Escaneá este código con la cámara para unirte directamente a <strong className="text-ink dark:text-dark-ink">{name}</strong>.
            </p>
            <div className="flex justify-center p-4 bg-white rounded-[6px] border border-line mb-4">
              <QRCode value={inviteUrl} size={200} />
            </div>
            <div className="text-center mb-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted dark:text-dark-muted mb-1">Código de invitación</div>
              <div className="font-mono text-[20px] font-bold tracking-[0.2em] text-ink dark:text-dark-ink">{code}</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copy(inviteUrl, 'Enlace de invitación')}
                className="flex-1 py-2 bg-ink dark:bg-dark-ink text-surface dark:text-dark-bg text-[12px] font-medium rounded-[4px] hover:opacity-90 transition-opacity cursor-pointer"
              >
                Copiar enlace
              </button>
              <button
                onClick={() => setShowQRModal(false)}
                className="px-4 py-2 border border-line dark:border-dark-line text-muted dark:text-dark-muted text-[12px] rounded-[4px] hover:text-ink dark:hover:text-dark-ink transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm modals */}
      {(showConfirmDelete || showConfirmLeave) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/20 dark:bg-black/40" onClick={() => { setShowConfirmDelete(false); setShowConfirmLeave(false) }} />
          <div className="relative bg-surface dark:bg-dark-surface border border-line dark:border-dark-line rounded-[8px] shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-[16px] font-semibold text-ink dark:text-dark-ink mb-2">
              {showConfirmDelete ? '¿Eliminar este hogar?' : '¿Abandonar este hogar?'}
            </h3>
            <p className="text-[13px] text-muted dark:text-dark-muted mb-6 leading-relaxed">
              {showConfirmDelete
                ? 'Esta acción es irreversible. Se eliminarán todos los datos, miembros y registros del hogar.'
                : 'Dejará de tener acceso al hogar. Podés ser invitado de nuevo en el futuro.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => { setShowConfirmDelete(false); setShowConfirmLeave(false) }} className="flex-1 py-2.5 border border-line dark:border-dark-line rounded-[4px] text-[13px] text-muted dark:text-dark-muted hover:text-ink transition-colors">
                Cancelar
              </button>
              <button
                onClick={showConfirmDelete ? handleDelete : handleLeave}
                className="flex-1 py-2.5 bg-terracotta dark:bg-dark-terracotta text-white rounded-[4px] text-[13px] font-medium hover:opacity-80 transition-opacity"
              >
                {showConfirmDelete ? 'Eliminar' : 'Abandonar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
