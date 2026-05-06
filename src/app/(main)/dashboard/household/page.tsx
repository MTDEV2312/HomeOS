"use client";

import React, { useEffect, useState } from 'react';
import { useHousehold } from '@/lib/household-context';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import {
  getHouseholdMembers,
  removeMember,
  updateMemberRole,
  updateHousehold,
  regenerateInviteCode,
  leaveHousehold,
  HouseholdMemberDetails,
} from '@/services/householdService';
import {
  Copy, Shield, ShieldAlert, Trash2, User, Loader2, Users,
  Pencil, Check, X, RefreshCw, Home, Calendar, KeyRound, Crown,
  LogOut, Link, Share2,
} from 'lucide-react';

export default function HouseholdAdminPage() {
  const { activeHousehold, activeRole, refreshHousehold } = useHousehold();
  const { user } = useAuth();
  const router = useRouter();

  const [members, setMembers] = useState<HouseholdMemberDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  // Invite code
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [localInviteCode, setLocalInviteCode] = useState('');

  const [leaving, setLeaving] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const isOwner = activeRole === 'OWNER';
  const isAdmin = activeRole === 'ADMIN';
  const canManage = isOwner || isAdmin;

  useEffect(() => {
    if (activeHousehold) {
      fetchMembers();
      setLocalInviteCode(activeHousehold.invite_code);
    }
  }, [activeHousehold]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await getHouseholdMembers(activeHousehold.id);
      setMembers(data);
    } catch (err: any) {
      console.error(err);
      setError('Error al cargar los miembros del hogar.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!editName.trim() || editName.trim() === activeHousehold.name) {
      setIsEditingName(false);
      return;
    }
    try {
      setSaving(true);
      await updateHousehold(activeHousehold.id, { name: editName.trim() });
      await refreshHousehold();
      setIsEditingName(false);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el nombre.');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateCode = async () => {
    if (!confirm('¿Regenerar el código de invitación? El código anterior dejará de funcionar.')) return;
    try {
      setRegenerating(true);
      const newCode = await regenerateInviteCode(activeHousehold.id);
      setLocalInviteCode(newCode);
      await refreshHousehold();
    } catch (err: any) {
      setError(err.message || 'Error al regenerar el código.');
    } finally {
      setRegenerating(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(localInviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/invite/${localInviteCode}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleLeaveHousehold = async () => {
    if (!user) return;
    if (!confirm('¿Estás seguro de que querés abandonar este hogar? Perderás acceso a toda su información.')) return;
    try {
      setLeaving(true);
      await leaveHousehold(activeHousehold.id, user.id);
      await refreshHousehold();
      router.push('/household-setup');
    } catch (err: any) {
      alert(err.message || 'Error al abandonar el hogar.');
    } finally {
      setLeaving(false);
    }
  };

  const handleRemoveMember = async (userIdToRemove: string) => {
    if (!confirm('¿Estás seguro de que deseas expulsar a este miembro del hogar?')) return;
    try {
      await removeMember(activeHousehold.id, userIdToRemove);
      setMembers(members.filter(m => m.user_id !== userIdToRemove));
    } catch (err: any) {
      alert(err.message || 'Error al eliminar al miembro.');
    }
  };

  const handleUpdateRole = async (userIdToUpdate: string, newRole: 'ADMIN' | 'MEMBER') => {
    try {
      await updateMemberRole(activeHousehold.id, userIdToUpdate, newRole);
      setMembers(members.map(m => m.user_id === userIdToUpdate ? { ...m, role: newRole } : m));
    } catch (err: any) {
      alert(err.message || 'Error al actualizar el rol.');
    }
  };

  const canManageMember = (targetRole: string) => {
    if (isOwner) return targetRole !== 'OWNER';
    if (isAdmin) return targetRole === 'MEMBER';
    return false;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-xl min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!activeHousehold) {
    return (
      <div className="flex justify-center items-center p-xl min-h-[60vh]">
        <p className="text-on-surface-variant font-body-lg text-body-lg">No hay hogar seleccionado.</p>
      </div>
    );
  }

  const ownerMember = members.find(m => m.role === 'OWNER');

  return (
    <div className="flex flex-col gap-xl max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="font-h2 text-h2 text-on-surface mb-xs">Mi Residencia</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Información y administración de tu hogar.
        </p>
      </div>

      {error && (
        <div className="bg-error-container text-on-error-container p-md rounded-lg font-body-md text-body-md">
          {error}
        </div>
      )}

      {/* ─── Household Info Card ─── */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="p-md border-b border-outline-variant bg-surface flex items-center justify-between">
          <div className="flex items-center gap-sm">
            <Home className="w-5 h-5 text-primary" />
            <h2 className="font-h3 text-h3 text-on-surface">Información del Hogar</h2>
          </div>
          {isOwner && !isEditingName && (
            <button
              onClick={() => {
                setEditName(activeHousehold.name);
                setIsEditingName(true);
              }}
              className="flex items-center gap-1 text-primary hover:bg-primary-container/50 px-3 py-1.5 rounded-lg transition-colors font-label-md text-label-md"
            >
              <Pencil className="w-4 h-4" />
              Editar
            </button>
          )}
        </div>

        <div className="p-lg space-y-lg">
          {/* Name */}
          <div className="flex flex-col gap-xs">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Nombre del Hogar
            </span>
            {isEditingName ? (
              <div className="flex items-center gap-sm">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary px-3 py-2 font-body-lg text-body-lg"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                />
                <button
                  onClick={handleSaveName}
                  disabled={saving}
                  className="p-2 rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsEditingName(false)}
                  className="p-2 rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-surface-variant transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <span className="font-h3 text-h3 text-on-surface">{activeHousehold.name}</span>
            )}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
            {/* Owner */}
            <div className="flex flex-col gap-xs">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" /> Propietario
              </span>
              <span className="font-body-md text-body-md text-on-surface">
                {ownerMember?.name || 'Desconocido'}
              </span>
            </div>

            {/* Created At */}
            <div className="flex flex-col gap-xs">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Fecha de Creación
              </span>
              <span className="font-body-md text-body-md text-on-surface">
                {activeHousehold.created_at ? formatDate(activeHousehold.created_at) : '—'}
              </span>
            </div>

            {/* Member Count */}
            <div className="flex flex-col gap-xs">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> Miembros
              </span>
              <span className="font-body-md text-body-md text-on-surface">
                {members.length} {members.length === 1 ? 'persona' : 'personas'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Invite Code Card ─── */}
      {canManage && (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <div className="p-md border-b border-outline-variant bg-surface flex items-center gap-sm">
            <KeyRound className="w-5 h-5 text-primary" />
            <h2 className="font-h3 text-h3 text-on-surface">Código de Invitación</h2>
          </div>
          <div className="p-lg">
            <p className="font-body-md text-body-md text-on-surface-variant mb-md">
              Compartí este código con las personas que quieras invitar a tu hogar. Cualquiera con el código puede unirse.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-md">
              <div className="flex-1 bg-surface-container-low rounded-lg border border-outline-variant p-md flex items-center justify-center">
                <span className="font-mono text-h2 font-bold tracking-[0.3em] text-primary select-all">
                  {localInviteCode}
                </span>
              </div>
              <div className="flex flex-wrap gap-sm">
                <button
                  onClick={handleCopyCode}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-colors font-label-md text-label-md"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? '¡Copiado!' : 'Código'}
                </button>
                <button
                  onClick={handleCopyLink}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80 transition-colors font-label-md text-label-md"
                >
                  <Share2 className="w-4 h-4" />
                  {linkCopied ? '¡Enlace copiado!' : 'Enlace'}
                </button>
                {isOwner && (
                  <button
                    onClick={handleRegenerateCode}
                    disabled={regenerating}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-surface-container-high text-on-surface border border-outline-variant hover:bg-surface-variant transition-colors font-label-md text-label-md disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
                    Regenerar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Members List Card ─── */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="p-md border-b border-outline-variant bg-surface flex items-center justify-between">
          <div className="flex items-center gap-sm">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="font-h3 text-h3 text-on-surface">Miembros ({members.length})</h2>
          </div>
        </div>

        <div className="divide-y divide-outline-variant">
          {members.length === 0 ? (
            <div className="p-lg text-center text-on-surface-variant font-body-md text-body-md">
              No hay miembros en este hogar todavía.
            </div>
          ) : (
            members.map((member) => (
              <div key={member.member_id} className="p-md flex flex-col md:flex-row items-start md:items-center justify-between gap-md hover:bg-surface-container transition-colors">
                <div className="flex items-center gap-md">
                  <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-label-lg shrink-0">
                    {member.name ? member.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-label-lg text-label-lg text-on-surface flex items-center gap-xs">
                      {member.name || 'Usuario'}
                      {member.user_id === user?.id && (
                        <span className="bg-secondary-container text-on-secondary-container text-[10px] px-2 py-0.5 rounded-full font-bold ml-1">Tú</span>
                      )}
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{member.email}</p>
                    <p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">
                      Se unió el {member.joined_at ? formatDate(member.joined_at) : '—'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-md w-full md:w-auto justify-between md:justify-end">
                  {/* Role Badge */}
                  <div className="flex items-center">
                    {member.role === 'OWNER' && (
                      <span className="flex items-center gap-1.5 text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full text-xs font-medium">
                        <ShieldAlert className="w-3.5 h-3.5" /> Propietario
                      </span>
                    )}
                    {member.role === 'ADMIN' && (
                      <span className="flex items-center gap-1.5 text-secondary bg-secondary/10 border border-secondary/20 px-3 py-1 rounded-full text-xs font-medium">
                        <Shield className="w-3.5 h-3.5" /> Admin
                      </span>
                    )}
                    {member.role === 'MEMBER' && (
                      <span className="flex items-center gap-1.5 text-on-surface-variant bg-surface border border-outline-variant px-3 py-1 rounded-full text-xs font-medium">
                        <User className="w-3.5 h-3.5" /> Miembro
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  {canManageMember(member.role) && (
                    <div className="flex items-center gap-sm">
                      {isOwner && member.role === 'MEMBER' && (
                        <button
                          onClick={() => handleUpdateRole(member.user_id, 'ADMIN')}
                          className="text-xs font-medium text-secondary hover:text-on-surface transition-colors px-2 py-1 rounded hover:bg-surface-container-high"
                        >
                          Hacer Admin
                        </button>
                      )}
                      {isOwner && member.role === 'ADMIN' && (
                        <button
                          onClick={() => handleUpdateRole(member.user_id, 'MEMBER')}
                          className="text-xs font-medium text-secondary hover:text-on-surface transition-colors px-2 py-1 rounded hover:bg-surface-container-high"
                        >
                          Quitar Admin
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveMember(member.user_id)}
                        className="p-1.5 text-error hover:bg-error-container hover:text-on-error-container rounded transition-colors"
                        title="Expulsar Miembro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── Your Role Info ─── */}
      <div className="bg-surface-container-low rounded-xl border border-outline-variant p-lg flex items-center gap-md">
        <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <p className="font-label-md text-label-md text-on-surface">Tu rol en este hogar</p>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {activeRole === 'OWNER' && 'Propietario — Tenés control total sobre el hogar, miembros y configuración.'}
            {activeRole === 'ADMIN' && 'Administrador — Podés gestionar miembros e invitaciones.'}
            {activeRole === 'MEMBER' && 'Miembro — Podés ver la información del hogar y participar en las actividades.'}
          </p>
        </div>
      </div>

      {/* ─── Leave Household (Danger Zone) ─── */}
      {!isOwner && (
        <div className="bg-error-container/20 rounded-xl border border-error/30 p-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-md">
          <div className="flex items-center gap-md">
            <div className="w-10 h-10 rounded-full bg-error/10 text-error flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <p className="font-label-md text-label-md text-on-surface">Abandonar este hogar</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Perderás acceso a toda la información y actividades de este hogar.
              </p>
            </div>
          </div>
          <button
            onClick={handleLeaveHousehold}
            disabled={leaving}
            className="px-4 py-2 rounded-lg bg-error text-on-error hover:bg-error/90 transition-colors font-label-md text-label-md disabled:opacity-50 flex items-center gap-2 shrink-0"
          >
            {leaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            Abandonar
          </button>
        </div>
      )}
    </div>
  );
}
