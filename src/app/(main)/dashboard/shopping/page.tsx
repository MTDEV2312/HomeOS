import ShoppingClient from './shopping-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lista de Compras',
  description: 'Colabora en tiempo real con las listas de compras y suministros de tu hogar. Agrega cantidades, categorías y asigna miembros responsables.',
};

export default function ShoppingPage() {
  return <ShoppingClient />;
}
