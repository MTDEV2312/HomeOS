import InventoryClient from './inventory-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inventario',
  description: 'Control de existencias de despensa, limpieza y suministros del hogar. Monitorea límites mínimos de stock y fechas de vencimiento de alimentos.',
};

export default function InventoryPage() {
  return <InventoryClient />;
}
