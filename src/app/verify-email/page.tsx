import VerifyEmailClient from './verify-email-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verificar Email',
  description: 'Verifica tu dirección de correo electrónico en HomeOS para confirmar tu registro e iniciar la configuración del panel familiar.',
};

export default function VerifyEmailPage() {
  return <VerifyEmailClient />;
}
