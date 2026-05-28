import SignupClient from './signup-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Crear Cuenta',
  description: 'Crea una cuenta en HomeOS para comenzar a gestionar tu hogar, invitar a miembros de tu familia, y organizar presupuestos y tareas en un solo lugar.',
};

export default function SignupPage() {
  return <SignupClient />;
}
