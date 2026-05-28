import ResetPasswordClient from './reset-password-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Restablecer Contraseña',
  description: 'Ingresa el código OTP de verificación y establece una nueva contraseña para recuperar de forma segura el acceso a tu cuenta HomeOS.',
};

export default function ResetPasswordPage() {
  return <ResetPasswordClient />;
}
