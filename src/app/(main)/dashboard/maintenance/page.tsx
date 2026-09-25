import Maintenance from '@/screens/dashboard/Maintenance';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mantenimiento - HomeOS',
  description: 'Programa servicios de mantenimiento preventivo del hogar, como filtros de aire, limpieza profunda y reparaciones técnicas de electrodomésticos.',
};

export default function MaintenancePage() {
  return <Maintenance />;
}
