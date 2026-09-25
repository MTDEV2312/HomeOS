import Reports from '@/screens/dashboard/Reports';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reportes y Analítica - HomeOS',
  description: 'Métricas integrales de gastos, cumplimiento de tareas del hogar y mantenimiento preventivo de activos.',
};

export default function ReportsPage() {
  return <Reports />;
}
