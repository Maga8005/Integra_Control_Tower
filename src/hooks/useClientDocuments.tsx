/**
 * Hook for managing client documents with Supabase integration
 * Integra Control Tower MVP
 */

import { useState, useEffect } from 'react';
import { environment, supabaseHeaders } from '../config/environment';
import type { DocumentItem, DocumentStatus, DocumentChecklist } from '../types/Documents';
import { 
  getDocumentsByCountry, 
  calculateCompletionPercentage, 
  getCountryFromOperation 
} from '../types/Documents';

// Interface for database document record
interface DatabaseDocumentRecord {
  id: string;
  operacion_id: string;
  documento_checklist_id: string;
  tipo_input: 'file' | 'text' | 'checkbox' | 'select' | 'date';
  completado: boolean;
  valor_texto?: string;
  valor_boolean?: boolean;
  valor_fecha?: string;
  pais_checklist: 'MX' | 'CO';
  es_obligatorio: boolean;
  nombre_archivo?: string;
  url_archivo?: string;
  tamano_archivo?: number;
  tipo_documento?: string;
  subido_por?: string;
  fecha_subida?: string;
  notas_adicionales?: string;
  created_at: string;
}

interface UseClientDocumentsReturn {
  checklist: DocumentChecklist | null;
  isLoading: boolean;
  error: string | null;
  updateDocument: (documentId: string, updates: Partial<DocumentStatus>) => Promise<void>;
  uploadFile: (documentId: string, file: File) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useClientDocuments(operationId: string, operation: any): UseClientDocumentsReturn {
  const [checklist, setChecklist] = useState<DocumentChecklist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get country and documents for this operation
  const country = getCountryFromOperation(operation);
  const documents = getDocumentsByCountry(country === 'MX' ? 'MEXICO' : 'COLOMBIA');

  // Fetch documents from database
  const fetchDocuments = async () => {
    try {
      console.log('📄 [DOCUMENTS] Fetching documents for operation:', operationId);
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `https://gfdaygaujovmyuqtehrv.supabase.co/functions/v1/client-documents?operacion_id=${operationId}`,
        {
          headers: supabaseHeaders
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📄 [DOCUMENTS] Database response:', data);

      if (!data.success) {
        throw new Error(data.message || 'Error fetching documents');
      }

      const dbDocuments: DatabaseDocumentRecord[] = data.data || [];
      
      // Convert database records to frontend format
      const statuses: DocumentStatus[] = documents.map(doc => {
        const dbDoc = dbDocuments.find(d => d.documento_checklist_id === doc.id);
        
        if (dbDoc) {
          // Map database record to DocumentStatus
          let value: string | boolean | File | null = null;
          
          if (doc.type === 'text' || doc.type === 'select') {
            value = dbDoc.valor_texto || '';
          } else if (doc.type === 'checkbox') {
            value = dbDoc.valor_boolean || false;
          } else if (doc.type === 'date') {
            value = dbDoc.valor_fecha || '';
          } else if (doc.type === 'file') {
            value = dbDoc.url_archivo || null;
          }

          return {
            documentId: doc.id,
            completed: dbDoc.completado,
            value,
            fileName: dbDoc.nombre_archivo,
            uploadedAt: dbDoc.fecha_subida,
            notes: dbDoc.notas_adicionales
          };
        } else {
          // Create empty status for documents not in database
          return {
            documentId: doc.id,
            completed: false,
            value: doc.type === 'checkbox' ? false : null
          };
        }
      });

      const completionPercentage = calculateCompletionPercentage(documents, statuses);

      const newChecklist: DocumentChecklist = {
        operationId,
        country,
        documents,
        statuses,
        lastUpdated: new Date().toISOString(),
        completionPercentage
      };

      setChecklist(newChecklist);
      console.log('✅ [DOCUMENTS] Checklist created:', newChecklist);

    } catch (err) {
      console.error('❌ [DOCUMENTS] Error fetching documents:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      
      // Create fallback checklist with empty statuses
      const fallbackStatuses: DocumentStatus[] = documents.map(doc => ({
        documentId: doc.id,
        completed: false,
        value: doc.type === 'checkbox' ? false : null
      }));

      setChecklist({
        operationId,
        country,
        documents,
        statuses: fallbackStatuses,
        lastUpdated: new Date().toISOString(),
        completionPercentage: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update a document status
  const updateDocument = async (documentId: string, updates: Partial<DocumentStatus>) => {
    if (!checklist) {
      console.error('❌ [DOCUMENTS] No checklist available for update');
      throw new Error('No checklist available');
    }

    try {
      console.log('📝 [DOCUMENTS] Starting document update:', {
        documentId,
        updates,
        checklistExists: !!checklist,
        operationId
      });

      const document = documents.find(d => d.id === documentId);
      if (!document) throw new Error('Document not found');

      // Prepare data for database
      const dbData: any = {
        operacion_id: operationId,
        documento_checklist_id: documentId,
        tipo_input: document.type,
        completado: updates.completed ?? false,
        pais_checklist: country,
        es_obligatorio: document.required,
        valor_texto: null,
        valor_boolean: null,
        valor_fecha: null,
        notas_adicionales: updates.notes || null
      };

      // Set appropriate value field based on document type
      if (document.type === 'text' || document.type === 'select') {
        dbData.valor_texto = updates.value as string;
      } else if (document.type === 'checkbox') {
        dbData.valor_boolean = updates.value as boolean;
      } else if (document.type === 'date') {
        dbData.valor_fecha = updates.value as string;
      }

      // Make API call to save/update document
      const response = await fetch(`https://gfdaygaujovmyuqtehrv.supabase.co/functions/v1/client-documents`, {
        method: 'POST',
        headers: {
          ...supabaseHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dbData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Error saving document');
      }

      // Update local state
      const newStatuses = checklist.statuses.map(status =>
        status.documentId === documentId
          ? { ...status, ...updates }
          : status
      );

      const newCompletionPercentage = calculateCompletionPercentage(documents, newStatuses);

      setChecklist({
        ...checklist,
        statuses: newStatuses,
        completionPercentage: newCompletionPercentage,
        lastUpdated: new Date().toISOString()
      });

      console.log('✅ [DOCUMENTS] Document updated successfully');

    } catch (err) {
      console.error('❌ [DOCUMENTS] Error updating document:', err);
      throw err;
    }
  };

  // Upload file (this would integrate with Supabase Storage)
  const uploadFile = async (documentId: string, file: File) => {
    try {
      console.log('📤 [DOCUMENTS] Starting file upload:', {
        fileName: file.name,
        documentId,
        fileSize: file.size,
        operationId
      });

      // For now, simulate file upload
      // In production, this would upload to Supabase Storage
      const mockFileUrl = `https://example.com/files/${Date.now()}_${file.name}`;

      console.log('📤 [DOCUMENTS] Calling updateDocument with file data');
      
      await updateDocument(documentId, {
        completed: true,
        value: file,
        fileName: file.name,
        uploadedAt: new Date().toISOString()
      });

      console.log('✅ [DOCUMENTS] File uploaded successfully');

    } catch (err) {
      console.error('❌ [DOCUMENTS] Error uploading file:', err);
      console.error('❌ [DOCUMENTS] Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        documentId,
        fileName: file.name
      });
      throw err;
    }
  };

  // Initialize and fetch documents
  useEffect(() => {
    if (operationId) {
      fetchDocuments();
    }
  }, [operationId]);

  // Delete a document
  const deleteDocument = async (documentId: string) => {
    if (!checklist) return;

    try {
      console.log('🗑️ [DOCUMENTS] Deleting document:', documentId);

      // Find the document record ID from the database
      const documentStatus = checklist.statuses.find(s => s.documentId === documentId);
      if (!documentStatus) {
        throw new Error('Document status not found');
      }

      // First, get the database record ID by querying the API
      const getResponse = await fetch(
        `https://gfdaygaujovmyuqtehrv.supabase.co/functions/v1/client-documents?operacion_id=${operationId}`,
        {
          headers: supabaseHeaders
        }
      );

      if (!getResponse.ok) {
        throw new Error(`HTTP error! status: ${getResponse.status}`);
      }

      const getData = await getResponse.json();
      if (!getData.success) {
        throw new Error(getData.message || 'Error fetching documents');
      }

      // Find the specific document record
      const dbRecord = getData.data.find((record: any) => record.documento_checklist_id === documentId);
      if (!dbRecord) {
        throw new Error('Document record not found in database');
      }

      console.log('🗑️ [DOCUMENTS] Found database record:', dbRecord.id);

      // Instead of deleting, reset the document to empty state in database
      const document = documents.find(d => d.id === documentId);
      const resetData = {
        operacion_id: operationId,
        documento_checklist_id: documentId,
        tipo_input: document?.type || 'file',
        completado: false,
        pais_checklist: country,
        es_obligatorio: document?.required || false,
        valor_texto: null,
        valor_boolean: null,
        valor_fecha: null,
        nombre_archivo: null,
        url_archivo: null,
        tamano_archivo: null,
        tipo_documento: null,
        notas_adicionales: null
      };

      // Make API call to reset document using POST (update existing)
      const response = await fetch(`https://gfdaygaujovmyuqtehrv.supabase.co/functions/v1/client-documents`, {
        method: 'POST',
        headers: {
          ...supabaseHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(resetData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Error resetting document');
      }

      // Update local state - reset document to empty state  
      const newStatuses = checklist.statuses.map(status =>
        status.documentId === documentId
          ? {
              documentId,
              completed: false,
              value: document?.type === 'checkbox' ? false : null,
              fileName: undefined,
              uploadedAt: undefined,
              notes: undefined
            }
          : status
      );

      const newCompletionPercentage = calculateCompletionPercentage(documents, newStatuses);

      const updatedChecklist = {
        ...checklist,
        statuses: newStatuses,
        completionPercentage: newCompletionPercentage,
        lastUpdated: new Date().toISOString()
      };

      setChecklist(updatedChecklist);

      console.log('✅ [DOCUMENTS] Local state updated after deletion:', {
        documentId,
        newCompletionPercentage,
        totalCompleted: newStatuses.filter(s => s.completed).length
      });

      console.log('✅ [DOCUMENTS] Document deleted successfully');

    } catch (err) {
      console.error('❌ [DOCUMENTS] Error deleting document:', err);
      throw err;
    }
  };

  // Refetch function
  const refetch = async () => {
    await fetchDocuments();
  };

  return {
    checklist,
    isLoading,
    error,
    updateDocument,
    uploadFile,
    deleteDocument,
    refetch
  };
}