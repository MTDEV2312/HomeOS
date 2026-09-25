import Inventory from '@/screens/dashboard/Inventory';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inventario - HomeOS',
  description: 'Control de existencias de despensa, limpieza y suministros del hogar. Monitorea límites mínimos de stock y fechas de vencimiento de alimentos.',
};

export default function InventoryPage() {
  return <Inventory />;
}
