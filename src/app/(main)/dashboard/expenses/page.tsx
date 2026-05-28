import ExpensesClient from './expenses-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gastos y Presupuesto',
  description: 'Controla las finanzas familiares de tu hogar. Registra gastos comunes, divide cuentas equitativamente entre los miembros y monitorea presupuestos.',
};

export default function ExpensesPage() {
  return <ExpensesClient />;
}
