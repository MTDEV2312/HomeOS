import MaintenanceClient from './maintenance-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mantenimiento',
  description: 'Programa servicios de mantenimiento preventivo del hogar, como filtros de aire, limpieza profunda y reparaciones técnicas de electrodomésticos.',
};

export default function MaintenancePage() {
  return <MaintenanceClient />;
}
