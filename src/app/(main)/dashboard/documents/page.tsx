import DocumentsClient from './documents-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentos',
  description: 'Bóveda y archivador seguro de tus recibos, contratos de alquiler, manuales de electrodomésticos y garantías del hogar.',
};

export default function DocumentsPage() {
  return <DocumentsClient />;
}
