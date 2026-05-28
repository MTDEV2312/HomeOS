import { Suspense } from 'react';
import LoginClient from './login-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Iniciar Sesión',
  description: 'Inicia sesión en HomeOS para acceder al panel de control de tu hogar familiar y colaborar en tareas y presupuestos.',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginClient />
    </Suspense>
  );
}

function LoginFallback() {
  return (
    <div className="bg-surface-dim min-h-screen flex items-center justify-center p-md text-on-surface font-body-md">
      <div className="w-full max-w-md bg-surface-container-low rounded-xl shadow-[0px_4px_30px_rgba(0,0,0,0.3)] border border-outline-variant p-lg md:p-xl flex items-center justify-center">
        Cargando...
      </div>
    </div>
  );
}
