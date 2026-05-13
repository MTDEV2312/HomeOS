import { insforge } from '@/lib/insforge';

export type DocumentCategory = 'RECEIPT' | 'WARRANTY' | 'CONTRACT' | 'IDENTITY' | 'OTHER';

export type HouseholdDocument = {
  id: string;
  household_id: string;
  title: string;
  category: DocumentCategory;
  file_url: string;
  file_key: string;
  related_type: string | null;
  related_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export const getHouseholdDocuments = async (householdId: string): Promise<HouseholdDocument[]> => {
  const { data, error } = await insforge.database
    .from('household_documents')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as HouseholdDocument[];
};

export const addHouseholdDocument = async (
  payload: Omit<HouseholdDocument, 'id' | 'created_at' | 'updated_at'>,
  file: File
): Promise<HouseholdDocument> => {
  // 1. Upload to storage
  const fileExt = file.name.split('.').pop();
  const filePath = `${payload.household_id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  
  const { data: uploadData, error: uploadError } = await insforge.storage
    .from('household-documents')
    .upload(filePath, file);

  if (uploadError || !uploadData) throw uploadError || new Error('Upload failed');

  // 2. Insert record in DB
  const dbPayload = {
    ...payload,
    file_key: uploadData.key,
    file_url: uploadData.url
  };

  const { data, error } = await insforge.database
    .from('household_documents')
    .insert([dbPayload])
    .select()
    .single();

  if (error) throw error;
  return data as HouseholdDocument;
};

export const deleteHouseholdDocument = async (id: string, fileKey: string): Promise<void> => {
  // 1. Delete from storage
  const { error: storageError } = await insforge.storage
    .from('household-documents')
    .remove(fileKey);

  if (storageError) throw storageError;

  // 2. Delete from DB
  const { error: dbError } = await insforge.database
    .from('household_documents')
    .delete()
    .eq('id', id);

  if (dbError) throw dbError;
};

export const downloadHouseholdDocument = async (fileKey: string): Promise<Blob> => {
  const { data, error } = await insforge.storage
    .from('household-documents')
    .download(fileKey);

  if (error || !data) throw error || new Error('Download failed');
  return data;
};
