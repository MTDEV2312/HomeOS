import Expenses from '@/screens/dashboard/Expenses';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gastos y Presupuestos - HomeOS',
  description: 'Controla las finanzas familiares de tu hogar. Registra gastos comunes, divide cuentas equitativamente entre los miembros y monitorea presupuestos.',
};

export default function ExpensesPage() {
  return <Expenses />;
}
