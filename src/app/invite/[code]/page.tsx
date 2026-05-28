import InviteClient from './invite-client';
import { Metadata } from 'next';

type Props = {
  params: Promise<{ code: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const code = (await params).code;
  return {
    title: `Invitación de Hogar ${code.toUpperCase()}`,
    description: `Acepta la invitación para unirte al hogar con el código ${code.toUpperCase()} en HomeOS y comienza a colaborar con los miembros de tu familia.`,
  };
}

export default function InvitePage() {
  return <InviteClient />;
}
