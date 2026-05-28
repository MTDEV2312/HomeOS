"use client";

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { Loader2 } from 'lucide-react';

type ChangePasswordStep = 'start' | 'verify-code' | 'new-password';

export default function SettingsPage() {
  const { user, updateProfile, sendResetPasswordEmail, exchangeResetPasswordToken, resetPassword } = useAuth();
  const { toast, success, error, info } = useToast();
  const [name, setName] = useState((user?.profile?.name as string) || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [passwordStep, setPasswordStep] = useState<ChangePasswordStep>('start');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await updateProfile({ name });
    
    setLoading(false);
    if (error) {
      setMessage('Error al actualizar el perfil.');
    } else {
      setMessage('Perfil actualizado con éxito.');
    }
  };

  const handleSendCode = async () => {
    if (!user?.email) return;
    setPasswordLoading(true);
    setPasswordError('');
    
    const { error } = await sendResetPasswordEmail(user.email);
    
    setPasswordLoading(false);
    if (error) {
      setPasswordError(error.message || 'Error al enviar el código');
    } else {
      setPasswordStep('verify-code');
    }
  };

  const handleVerifyCode = async () => {
    if (!user?.email || code.length !== 6) return;
    setPasswordLoading(true);
    setPasswordError('');
    
    const { error, token } = await exchangeResetPasswordToken(user.email, code);
    
    setPasswordLoading(false);
    if (error) {
      setPasswordError(error.message || 'Código inválido o expirado');
    } else if (token) {
      setPasswordStep('new-password');
    }
  };

  const handleChangePassword = async () => {
    if (!user?.email || !code) return;
    
    if (newPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }

    setPasswordLoading(true);
    setPasswordError('');

    const { error } = await resetPassword(newPassword, code);

    setPasswordLoading(false);
    if (error) {
      setPasswordError(error.message || 'Error al cambiar la contraseña');
    } else {
      setPasswordSuccess(true);
      setPasswordStep('start');
    }
  };

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex items-center gap-sm">
        <span className="material-symbols-outlined text-[32px] text-primary">settings</span>
        <h1 className="font-h2 text-h2 text-on-surface">Configuración</h1>
      </div>

      <div className="bg-surface-container-low rounded-xl border border-outline-variant p-lg max-w-2xl">
        <h2 className="font-h3 text-h3 text-on-surface mb-md">Perfil de Usuario</h2>
        
        {message && (
          <div className={`p-3 rounded-lg mb-4 text-sm ${message.includes('Error') ? 'bg-red-100/10 text-red-400 border border-red-500/50' : 'bg-green-100/10 text-green-400 border border-green-500/50'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleUpdate} className="flex flex-col gap-md">
          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-label-sm text-on-surface">Correo Electrónico</label>
            <input 
              type="email" 
              value={user?.email || ''} 
              disabled 
              className="w-full pl-md pr-md py-sm rounded-lg border border-outline-variant bg-surface-container-highest text-on-surface-variant cursor-not-allowed font-body-md text-body-md" 
            />
            <p className="text-[12px] text-on-surface-variant">El correo no puede ser modificado por seguridad.</p>
          </div>

          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-label-sm text-on-surface">Nombre Completo</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              className="w-full pl-md pr-md py-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-body-md text-body-md" 
            />
          </div>

          <div className="pt-sm border-t border-outline-variant flex justify-end">
            <button 
              type="submit" 
              disabled={loading}
              className="bg-primary text-on-primary font-label-sm text-label-sm py-sm px-lg rounded-lg hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm flex items-center justify-center gap-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-surface-container-low rounded-xl border border-outline-variant p-lg max-w-2xl">
        <div className="flex items-center gap-sm mb-md">
          <span className="material-symbols-outlined text-[24px] text-primary">lock</span>
          <h2 className="font-h3 text-h3 text-on-surface">Seguridad</h2>
        </div>

        {passwordSuccess && (
          <div className="p-3 rounded-lg mb-4 text-sm bg-green-100/10 text-green-400 border border-green-500/50">
            Contraseña cambiada exitosamente.
          </div>
        )}

        {passwordError && (
          <div className="p-3 rounded-lg mb-4 text-sm bg-red-100/10 text-red-400 border border-red-500/50">
            {passwordError}
          </div>
        )}

        {passwordStep === 'start' && (
          <div className="flex flex-col gap-md">
            <p className="text-on-surface-variant text-sm">
              ¿Deseas cambiar tu contraseña? Te enviaremos un código de verificación a tu correo.
            </p>
            <button 
              onClick={handleSendCode}
              disabled={passwordLoading}
              className="w-fit bg-secondary text-on-secondary font-label-sm text-label-sm py-sm px-lg rounded-lg hover:bg-secondary-container hover:text-on-secondary-container transition-colors shadow-sm flex items-center justify-center gap-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cambiar Contraseña'}
              {!passwordLoading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
            </button>
          </div>
        )}

        {passwordStep === 'verify-code' && (
          <div className="flex flex-col gap-md">
            <p className="text-on-surface-variant text-sm">
              Ingresa el código de 6 dígitos que enviamos a <span className="text-primary font-medium">{user?.email}</span>
            </p>
            <div className="flex flex-col gap-sm">
              <input 
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full max-w-[200px] pl-md pr-md py-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-body-md text-body-md text-center tracking-[0.5em] font-mono"
              />
              <button 
                onClick={handleVerifyCode}
                disabled={passwordLoading || code.length !== 6}
                className="w-fit bg-primary text-on-primary font-label-sm text-label-sm py-sm px-lg rounded-lg hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm flex items-center justify-center gap-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verificar Código'}
              </button>
            </div>
            <button 
              onClick={() => setPasswordStep('start')}
              className="text-on-surface-variant text-sm hover:text-primary transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}

        {passwordStep === 'new-password' && (
          <div className="flex flex-col gap-md">
            <p className="text-on-surface-variant text-sm">
              Ingresa tu nueva contraseña
            </p>
            <div className="flex flex-col gap-sm">
              <input 
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nueva contraseña"
                className="w-full pl-md pr-md py-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-body-md text-body-md"
              />
              <input 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmar contraseña"
                className="w-full pl-md pr-md py-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-body-md text-body-md"
              />
              <button 
                onClick={handleChangePassword}
                disabled={passwordLoading || newPassword.length < 6 || !confirmPassword}
                className="w-fit bg-primary text-on-primary font-label-sm text-label-sm py-sm px-lg rounded-lg hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm flex items-center justify-center gap-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Nueva Contraseña'}
              </button>
            </div>
            <button 
              onClick={() => { setPasswordStep('start'); setCode(''); setNewPassword(''); setConfirmPassword(''); setPasswordSuccess(false); }}
              className="text-on-surface-variant text-sm hover:text-primary transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* ═══ Toast Testing Playground ═══ */}
      <div className="bg-surface-container-low rounded-xl border border-outline-variant p-lg max-w-2xl">
        <div className="flex items-center gap-sm mb-md">
          <span className="material-symbols-outlined text-[24px] text-primary">notifications_active</span>
          <h2 className="font-h3 text-h3 text-on-surface">Prueba de Notificaciones (Toasts)</h2>
        </div>
        <p className="text-on-surface-variant text-sm mb-4">
          Haz clic en los botones para disparar notificaciones y probar el posicionamiento, responsividad y su animación.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
          <button 
            onClick={() => success('¡Operación Exitosa!', 'Los datos del hogar se han guardado con éxito.')}
            className="flex items-center justify-center gap-2 bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600/20 px-4 py-3 rounded-lg border border-emerald-500/25 transition-all text-sm font-semibold active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            Gatillar Éxito (Success)
          </button>
          <button 
            onClick={() => error('Error del Sistema', 'No se pudieron sincronizar los datos con InsForge.')}
            className="flex items-center justify-center gap-2 bg-rose-600/10 text-rose-500 hover:bg-rose-600/20 px-4 py-3 rounded-lg border border-rose-500/25 transition-all text-sm font-semibold active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px]">error</span>
            Gatillar Error (Error)
          </button>
          <button 
            onClick={() => toast('Alerta de Inventario', 'Quedan pocos suministros en la despensa.', 'warning')}
            className="flex items-center justify-center gap-2 bg-amber-600/10 text-amber-500 hover:bg-amber-600/20 px-4 py-3 rounded-lg border border-amber-500/25 transition-all text-sm font-semibold active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px]">warning</span>
            Gatillar Alerta (Warning)
          </button>
          <button 
            onClick={() => info('Información del Hogar', 'Sincronización en tiempo real activa.')}
            className="flex items-center justify-center gap-2 bg-sky-600/10 text-sky-500 hover:bg-sky-600/20 px-4 py-3 rounded-lg border border-sky-500/25 transition-all text-sm font-semibold active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px]">info</span>
            Gatillar Info (Info)
          </button>
        </div>
      </div>
    </div>
  );
}
