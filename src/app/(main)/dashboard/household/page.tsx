import Household from '@/screens/dashboard/Household';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mi Residencia - HomeOS',
  description: 'Detalles estructurales de tu hogar, administración de códigos de invitación QR, roles y configuración del multi-tenancy.',
};

export default function HouseholdPage() {
  return <Household />;
}
