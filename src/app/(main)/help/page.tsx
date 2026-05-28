import HelpClient from './help-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ayuda y Soporte',
  description: 'Consulta guías de usuario, respuestas a preguntas frecuentes sobre sincronización y roles, y envía consultas de soporte técnico para HomeOS.',
};

export default function HelpPage() {
  return <HelpClient />;
}
