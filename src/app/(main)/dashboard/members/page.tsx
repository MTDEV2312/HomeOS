import Members from '@/screens/dashboard/Members';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Miembros - HomeOS',
  description: 'Gestión de integrantes del hogar, asignación de roles de propietario, administrador o miembro, y consulta de perfiles familiares.',
};

export default function MembersPage() {
  return <Members />;
}
