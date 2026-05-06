"use client";

import React, { useEffect, useState } from 'react';
import { useHousehold } from '@/lib/household-context';
import { useAuth } from '@/lib/auth-context';
import { getHouseholdMembers, removeMember, updateMemberRole, HouseholdMemberDetails } from '@/services/householdService';
import { Copy, Shield, ShieldAlert, Trash2, User, Loader2, Users } from 'lucide-react';

export default function MembersPage() {
  const { activeHousehold, activeRole } = useHousehold();
  const { user } = useAuth();
  
  const [members, setMembers] = useState<HouseholdMemberDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (activeHousehold) {
      fetchMembers();
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

  const handleCopyCode = () => {
    if (activeHousehold?.invite_code) {
      navigator.clipboard.writeText(activeHousehold.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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

  const canManageMember = (targetRole: string) => {
    if (activeRole === 'OWNER') return targetRole !== 'OWNER';
    if (activeRole === 'ADMIN') return targetRole === 'MEMBER';
    return false;
  };

  if (loading) {
    return (
      <div className="flex justify-center p-xl">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md">
        <div>
          <h1 className="font-h2 text-h2 text-on-surface mb-xs">Gestión de Miembros</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Administra quién tiene acceso a {activeHousehold?.name}
          </p>
        </div>
        
        {/* Invite Code Box */}
        {(activeRole === 'OWNER' || activeRole === 'ADMIN') && (
          <div className="bg-surface-container rounded-lg border border-outline-variant p-md flex items-center gap-md shadow-sm">
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">Código de Invitación</p>
              <p className="font-mono text-body-lg font-bold tracking-wider text-primary">
                {activeHousehold?.invite_code}
              </p>
            </div>
            <button 
              onClick={handleCopyCode}
              className="p-sm rounded bg-surface border border-outline hover:border-primary hover:text-primary transition-colors text-on-surface-variant flex flex-col items-center"
              title="Copiar Código"
            >
              <Copy className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-medium">{copied ? '¡Copiado!' : 'Copiar'}</span>
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-error-container text-on-error-container p-md rounded font-body-md text-body-md">
          {error}
        </div>
      )}

      {/* Members List */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="p-md border-b border-outline-variant bg-surface flex items-center gap-sm">
          <Users className="w-5 h-5 text-on-surface-variant" />
          <h2 className="font-h3 text-h3 text-on-surface">Miembros del Hogar ({members.length})</h2>
        </div>
        
        <div className="divide-y divide-outline-variant">
          {members.map((member) => (
            <div key={member.member_id} className="p-md flex flex-col md:flex-row items-start md:items-center justify-between gap-md hover:bg-surface-container-lowest/50 transition-colors">
              <div className="flex items-center gap-md">
                <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-label-lg shrink-0">
                  {member.name ? member.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-label-lg text-label-lg text-on-surface flex items-center gap-xs">
                    {member.name || 'Usuario'}
                    {member.user_id === user?.id && <span className="bg-secondary-container text-on-secondary-container text-[10px] px-2 py-0.5 rounded-full font-bold ml-2">(Tú)</span>}
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{member.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-md w-full md:w-auto justify-between md:justify-end">
                {/* Role Badge */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border">
                  {member.role === 'OWNER' && (
                    <span className="flex items-center gap-1.5 text-primary border-primary/20 bg-primary/10 px-2 py-0.5 rounded-full">
                      <ShieldAlert className="w-3.5 h-3.5" /> PROPIETARIO
                    </span>
                  )}
                  {member.role === 'ADMIN' && (
                    <span className="flex items-center gap-1.5 text-secondary border-secondary/20 bg-secondary/10 px-2 py-0.5 rounded-full">
                      <Shield className="w-3.5 h-3.5" /> ADMIN
                    </span>
                  )}
                  {member.role === 'MEMBER' && (
                    <span className="flex items-center gap-1.5 text-on-surface-variant border-outline-variant bg-surface px-2 py-0.5 rounded-full">
                      <User className="w-3.5 h-3.5" /> MIEMBRO
                    </span>
                  )}
                </div>

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
                        Remover Admin
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
    </div>
  );
}
