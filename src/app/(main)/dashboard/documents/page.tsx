'use client';

import { useEffect, useState, useRef } from 'react';
import { useHousehold } from '@/lib/household-context';
import { useAuth } from '@/lib/auth-context';
import { insforge } from '@/lib/insforge';
import {
  HouseholdDocument,
  DocumentCategory,
  getHouseholdDocuments,
  addHouseholdDocument,
  deleteHouseholdDocument,
  downloadHouseholdDocument
} from '@/services/documentService';
import { useToast } from '@/lib/toast-context';
import { getErrorMessage } from '@/lib/errors';

const CATEGORY_ICONS: Record<DocumentCategory, string> = {
  RECEIPT: 'receipt_long',
  WARRANTY: 'verified_user',
  CONTRACT: 'description',
  IDENTITY: 'badge',
  OTHER: 'folder'
};

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  RECEIPT: 'Recibo/Factura',
  WARRANTY: 'Garantía',
  CONTRACT: 'Contrato',
  IDENTITY: 'Identidad',
  OTHER: 'Otro'
};

export default function DocumentsDashboard() {
  const { activeHousehold } = useHousehold();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<HouseholdDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { success, error: showError } = useToast();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('OTHER');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (!activeHousehold) return;

    const loadDocs = async () => {
      try {
        setLoading(true);
        const docs = await getHouseholdDocuments(activeHousehold.id);
        setDocuments(docs);
      } catch (err) {
        console.error('Error loading documents:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDocs();

    const setupRealtime = async () => {
      try {
        await insforge.realtime.connect();
        const channelName = `household:${activeHousehold.id}`;
        await insforge.realtime.subscribe(channelName);
        
        insforge.realtime.on('INSERT_household_documents', () => loadDocs());
        insforge.realtime.on('UPDATE_household_documents', () => loadDocs());
        insforge.realtime.on('DELETE_household_documents', () => loadDocs());
      } catch (err) {
        console.error('Error setting up realtime:', err);
      }
    };

    setupRealtime();

    return () => {
      insforge.realtime.unsubscribe(`household:${activeHousehold.id}`);
    };
  }, [activeHousehold]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHousehold || !user || !selectedFile) return;

    try {
      setUploading(true);
      await addHouseholdDocument({
        household_id: activeHousehold.id,
        title,
        category,
        related_type: null,
        related_id: null,
        created_by: user.id
      }, selectedFile);

      setIsModalOpen(false);
      setTitle('');
      setCategory('OTHER');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      success('Documento subido', 'El documento se ha subido correctamente.');
    } catch (err: unknown) {
      console.error('Error uploading document:', err);
      showError('Error al subir el documento', getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc: HouseholdDocument) => {
    if (confirm('¿Estás seguro de que deseas eliminar este documento?')) {
      try {
        await deleteHouseholdDocument(doc.id, doc.file_key);
        success('Documento eliminado', 'El documento se ha eliminado correctamente.');
      } catch (err: unknown) {
        console.error('Error deleting document:', err);
        showError('Error al eliminar el documento', getErrorMessage(err));
      }
    }
  };

  const handleDownload = async (doc: HouseholdDocument) => {
    try {
      const blob = await downloadHouseholdDocument(doc.file_key);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.title;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      console.error('Error downloading document:', err);
      showError('Error al descargar el documento', getErrorMessage(err));
    }
  };

  if (!activeHousehold || !user) {
    return <div className="p-margin">Cargando contexto del hogar...</div>;
  }

  return (
    <div className="flex flex-col gap-xl w-full min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
        <div>
          <h1 className="font-h1 text-h1 text-on-surface">Documentos</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Almacenamiento seguro de recibos, garantías y contratos
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto px-lg py-sm rounded-lg font-label-md text-label-md bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm flex items-center justify-center gap-sm"
        >
          <span className="material-symbols-outlined">upload_file</span>
          Subir Documento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
        {loading && documents.length === 0 ? (
          <div className="col-span-full flex justify-center p-xl">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="col-span-full bg-surface-container-lowest p-xl rounded-xl border border-outline-variant text-center text-on-surface-variant font-body-md shadow-sm">
            No tienes documentos guardados. ¡Subí tu primer recibo o contrato!
          </div>
        ) : (
          documents.map(doc => (
            <div key={doc.id} className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant shadow-sm flex flex-col gap-md transition-shadow hover:shadow-md">
              <div className="flex items-start gap-md">
                <div className="w-12 h-12 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">{CATEGORY_ICONS[doc.category]}</span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="font-h3 text-h3 text-on-surface truncate" title={doc.title}>{doc.title}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{CATEGORY_LABELS[doc.category]}</p>
                </div>
              </div>

              <div className="mt-auto pt-4 flex gap-2">
                <button 
                  onClick={() => window.open(doc.file_url, '_blank')}
                  className="flex-1 py-1.5 bg-surface-container text-on-surface font-label-sm text-label-sm rounded hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1"
                  title="Ver online"
                >
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  Ver
                </button>
                <button 
                  onClick={() => handleDownload(doc)}
                  className="flex-1 py-1.5 bg-surface-container text-primary font-label-sm text-label-sm rounded hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1"
                  title="Descargar"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Bajar
                </button>
                <button 
                  onClick={() => handleDelete(doc)}
                  className="px-3 py-1.5 bg-surface-container text-error font-label-sm text-label-sm rounded hover:bg-error-container hover:text-on-error-container transition-colors flex items-center justify-center"
                  title="Eliminar"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 pb-20 md:pb-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-lg border-b border-outline-variant flex justify-between items-center bg-surface-container-low shrink-0">
              <h2 className="font-h3 text-h3 text-on-surface font-semibold flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">upload_file</span>
                Subir Documento
              </h2>
              <button 
                onClick={() => !uploading && setIsModalOpen(false)}
                disabled={uploading}
                className="text-on-surface-variant hover:text-error transition-colors p-1 rounded-full hover:bg-error-container disabled:opacity-50"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form id="uploadForm" onSubmit={handleUpload} className="p-lg flex flex-col gap-md">
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-on-surface font-medium">Título del Documento *</label>
                <input
                  type="text"
                  required
                  disabled={uploading}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-surface rounded-lg border border-outline-variant px-3 py-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none disabled:opacity-50"
                  placeholder="Ej. Factura Heladera Samsung"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-md text-on-surface font-medium">Categoría</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                  disabled={uploading}
                  className="w-full bg-surface rounded-lg border border-outline-variant px-3 py-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none disabled:opacity-50"
                >
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1 mt-2">
                <label className="font-label-md text-on-surface font-medium">Archivo *</label>
                <input
                  type="file"
                  required
                  disabled={uploading}
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="w-full bg-surface rounded-lg border border-outline-variant px-3 py-2 text-on-surface-variant text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-container file:text-on-primary-container hover:file:bg-primary/20 disabled:opacity-50 cursor-pointer"
                />
                <span className="text-xs text-on-surface-variant mt-1">
                  Formatos soportados: PDF, JPG, PNG. Max 10MB.
                </span>
              </div>
            </form>
            
            <div className="p-lg border-t border-outline-variant flex justify-end gap-md shrink-0 bg-surface-container-lowest">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                disabled={uploading}
                className="px-lg py-sm rounded-lg font-label-md text-label-md text-primary hover:bg-primary-container transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                form="uploadForm"
                disabled={uploading || !selectedFile}
                className="px-lg py-sm rounded-lg font-label-md text-label-md bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span>
                    Subiendo...
                  </>
                ) : (
                  'Subir'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
