import ForgotPasswordClient from './forgot-password-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recuperar Contraseña',
  description: '¿Olvidaste tu contraseña? Ingresa tu dirección de correo electrónico en HomeOS y te enviaremos un código de recuperación para restablecer el acceso a tu cuenta.',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
