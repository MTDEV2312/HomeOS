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
  Home, Users, Copy, Shield, ShieldAlert, Trash2,
  User, Loader2, Pencil, RefreshCw, LogOut, Check, X,
  Calendar, Key, Crown,
} from 'lucide-react';

export default function HouseholdPage() {
  const { activeHousehold, activeRole, refreshHousehold } = useHousehold();
  const { user } = useAuth();
  const router = useRouter();

  const [members, setMembers] = useState<HouseholdMemberDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit name state
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Invite code state
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Local invite code to reflect regeneration immediately
  const [inviteCode, setInviteCode] = useState('');

  const isAdmin = activeRole === 'OWNER' || activeRole === 'ADMIN';

  useEffect(() => {
    if (activeHousehold) {
      fetchMembers();
      setInviteCode(activeHousehold.invite_code || '');
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

  // --- Name editing ---
  const handleStartEditName = () => {
    setNewName(activeHousehold.name);
    setEditingName(true);
  };

  const handleSaveName = async () => {
    if (!newName.trim() || newName.trim() === activeHousehold.name) {
      setEditingName(false);
      return;
    }
    try {
      setSavingName(true);
      await updateHousehold(activeHousehold.id, { name: newName.trim() });
      await refreshHousehold();
      setEditingName(false);
    } catch (err: any) {
      alert(err.message || 'Error al actualizar el nombre.');
    } finally {
      setSavingName(false);
    }
  };

  const handleCancelEditName = () => {
    setEditingName(false);
    setNewName('');
  };

  // --- Invite code ---
  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateCode = async () => {
    if (!confirm('¿Estás seguro? El código anterior dejará de funcionar para cualquier persona que lo tenga.')) return;
    try {
      setRegenerating(true);
      const updated = await regenerateInviteCode(activeHousehold.id);
      setInviteCode(updated.invite_code);
      await refreshHousehold();
    } catch (err: any) {
      alert(err.message || 'Error al regenerar el código.');
    } finally {
      setRegenerating(false);
    }
  };

  // --- Member management ---
  const handleRemoveMember = async (userIdToRemove: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar a este miembro del hogar?')) return;
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

  const handleLeave = async () => {
    if (!user) return;
    if (activeRole === 'OWNER') {
      alert('Como propietario, no podés abandonar el hogar. Transferí la propiedad primero o eliminá el hogar.');
      return;
    }
    if (!confirm('¿Estás seguro de que querés abandonar este hogar? Perderás el acceso a toda la información.')) return;
    try {
      await leaveHousehold(activeHousehold.id, user.id);
      await refreshHousehold();
      router.push('/household-setup');
    } catch (err: any) {
      alert(err.message || 'Error al abandonar el hogar.');
    }
  };

  const canManageMember = (targetRole: string) => {
    if (activeRole === 'OWNER') return targetRole !== 'OWNER';
    if (activeRole === 'ADMIN') return targetRole === 'MEMBER';
    return false;
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'OWNER':
        return (
          <span className="inline-flex items-center gap-1.5 text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full text-xs font-semibold">
            <Crown className="w-3.5 h-3.5" /> Propietario
          </span>
        );
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 text-secondary bg-secondary/10 border border-secondary/20 px-2.5 py-1 rounded-full text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" /> Admin
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-on-surface-variant bg-surface border border-outline-variant px-2.5 py-1 rounded-full text-xs font-semibold">
            <User className="w-3.5 h-3.5" /> Miembro
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-xl min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const createdDate = activeHousehold?.created_at
    ? new Date(activeHousehold.created_at).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  return (
    <div className="flex flex-col gap-xl max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="font-h2 text-h2 text-on-surface mb-xs">Gestión del Hogar</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Información, miembros y configuración de tu residencia.
        </p>
      </div>

      {error && (
        <div className="bg-error-container text-on-error-container p-md rounded-lg font-body-md text-body-md">
          {error}
        </div>
      )}

      {/* Household Info Card */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="p-md border-b border-outline-variant bg-surface flex items-center gap-sm">
          <Home className="w-5 h-5 text-primary" />
          <h2 className="font-h3 text-h3 text-on-surface">Información del Hogar</h2>
        </div>

        <div className="p-lg flex flex-col gap-lg">
          {/* Name row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-sm">
            <span className="font-label-md text-label-md text-on-surface-variant w-36 shrink-0">Nombre</span>
            {editingName ? (
              <div className="flex items-center gap-sm flex-1">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 rounded border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md px-3 py-1.5"
                  autoFocus
                  disabled={savingName}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') handleCancelEditName(); }}
                />
                <button onClick={handleSaveName} disabled={savingName} className="p-1.5 text-primary hover:bg-primary-container rounded transition-colors" title="Guardar">
                  {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
                <button onClick={handleCancelEditName} className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded transition-colors" title="Cancelar">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-sm flex-1">
                <span className="font-body-lg text-body-lg text-on-surface font-medium">{activeHousehold?.name}</span>
                {activeRole === 'OWNER' && (
                  <button onClick={handleStartEditName} className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary-container/50 rounded transition-colors" title="Editar nombre">
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Created date */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-sm">
            <span className="font-label-md text-label-md text-on-surface-variant w-36 shrink-0">Creado</span>
            <span className="font-body-md text-body-md text-on-surface flex items-center gap-xs">
              <Calendar className="w-4 h-4 text-on-surface-variant" />
              {createdDate}
            </span>
          </div>

          {/* Invite code — only admins/owners */}
          {isAdmin && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-sm">
              <span className="font-label-md text-label-md text-on-surface-variant w-36 shrink-0">Código de Unión</span>
              <div className="flex items-center gap-sm">
                <div className="bg-surface-container px-4 py-2 rounded-lg border border-outline-variant flex items-center gap-md">
                  <Key className="w-4 h-4 text-primary" />
                  <span className="font-mono text-body-lg font-bold tracking-[0.25em] text-primary select-all">{inviteCode}</span>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary-container/50 transition-colors border border-transparent hover:border-primary/20"
                  title="Copiar código"
                >
                  {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                </button>
                {activeRole === 'OWNER' && (
                  <button
                    onClick={handleRegenerateCode}
                    disabled={regenerating}
                    className="p-2 rounded-lg text-on-surface-variant hover:text-secondary hover:bg-secondary-container/50 transition-colors border border-transparent hover:border-secondary/20 disabled:opacity-50"
                    title="Regenerar código (invalidará el anterior)"
                  >
                    <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Member count */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-sm">
            <span className="font-label-md text-label-md text-on-surface-variant w-36 shrink-0">Miembros</span>
            <span className="font-body-md text-body-md text-on-surface">{members.length} miembro{members.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Tu Rol */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-sm">
            <span className="font-label-md text-label-md text-on-surface-variant w-36 shrink-0">Tu Rol</span>
            {getRoleBadge(activeRole || 'MEMBER')}
          </div>
        </div>
      </div>

      {/* Members Card */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="p-md border-b border-outline-variant bg-surface flex items-center justify-between">
          <div className="flex items-center gap-sm">
            <Users className="w-5 h-5 text-on-surface-variant" />
            <h2 className="font-h3 text-h3 text-on-surface">Miembros del Hogar ({members.length})</h2>
          </div>
        </div>

        <div className="divide-y divide-outline-variant">
          {members.map((member) => (
            <div key={member.member_id} className="p-md flex flex-col md:flex-row items-start md:items-center justify-between gap-md hover:bg-surface-container-low/50 transition-colors">
              <div className="flex items-center gap-md">
                <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-label-lg shrink-0">
                  {member.name ? member.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-label-lg text-label-lg text-on-surface flex items-center gap-xs">
                    {member.name || 'Usuario'}
                    {member.user_id === user?.id && (
                      <span className="bg-secondary-container text-on-secondary-container text-[10px] px-2 py-0.5 rounded-full font-bold ml-1">(Vos)</span>
                    )}
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{member.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-md w-full md:w-auto justify-between md:justify-end">
                {getRoleBadge(member.role)}

                {/* Actions */}
                {canManageMember(member.role) && (
                  <div className="flex items-center gap-sm">
                    {activeRole === 'OWNER' && member.role === 'MEMBER' && (
                      <button
                        onClick={() => handleUpdateRole(member.user_id, 'ADMIN')}
                        className="text-xs font-medium text-secondary hover:text-on-surface transition-colors px-2 py-1 rounded hover:bg-surface-container"
                      >
                        Hacer Admin
                      </button>
                    )}
                    {activeRole === 'OWNER' && member.role === 'ADMIN' && (
                      <button
                        onClick={() => handleUpdateRole(member.user_id, 'MEMBER')}
                        className="text-xs font-medium text-secondary hover:text-on-surface transition-colors px-2 py-1 rounded hover:bg-surface-container"
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
          ))}
        </div>
      </div>

      {/* Danger Zone — only for non-owners */}
      {activeRole !== 'OWNER' && (
        <div className="bg-surface-container-lowest rounded-xl border border-error/30 shadow-sm overflow-hidden">
          <div className="p-md border-b border-error/20 bg-error/5 flex items-center gap-sm">
            <ShieldAlert className="w-5 h-5 text-error" />
            <h2 className="font-h3 text-h3 text-error">Zona de Peligro</h2>
          </div>
          <div className="p-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-md">
            <div>
              <p className="font-label-md text-label-md text-on-surface mb-xs">Abandonar este hogar</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Perderás acceso a toda la información y tendrás que ser re-invitado para volver.</p>
            </div>
            <button
              onClick={handleLeave}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-error text-on-error font-label-md text-label-md hover:bg-error/80 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
              Abandonar Hogar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
