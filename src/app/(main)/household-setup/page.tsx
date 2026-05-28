import HouseholdSetupClient from './household-setup-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Configurar Hogar',
  description: 'Comienza tu experiencia familiar en HomeOS. Crea un espacio privado totalmente nuevo para tu familia o únete a un hogar existente ingresando un código de invitación.',
};

export default function HouseholdSetupPage() {
  return <HouseholdSetupClient />;
}
