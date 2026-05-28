import SettingsClient from './settings-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Configuración',
  description: 'Administración de tu perfil de usuario de HomeOS, preferencias de visualización, tema claro/oscuro y configuración de seguridad.',
};

export default function SettingsPage() {
  return <SettingsClient />;
}
