import DashboardClient from './dashboard-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Panel de Control',
  description: 'Visualiza el estado general de tu hogar, tareas pendientes, presupuestos de gastos mensuales, stock de inventario y mantenimientos programados.',
};

export default function DashboardPage() {
  return <DashboardClient />;
}
