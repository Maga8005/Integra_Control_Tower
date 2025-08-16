import { useState } from 'react';
import {
  FileText,
  Upload,
  Check,
  AlertCircle,
  Calendar,
  Download,
  X,
  Plus,
  Info,
  Trash2
} from 'lucide-react';
import { cn } from '../../utils/cn';
import type {
  DocumentItem,
  DocumentStatus,
  DocumentChecklist
} from '../../types/Documents';
import { useClientDocuments } from '../../hooks/useClientDocuments';

interface DocumentsTabProps {
  operation: any;
  onDocumentUpdate?: (checklist: DocumentChecklist) => void;
}

export default function DocumentsTab({ operation, onDocumentUpdate }: DocumentsTabProps) {
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  
  // Use the new hook for database integration
  const { 
    checklist, 
    isLoading: loading, 
    error: dbError, 
    updateDocument, 
    uploadFile,
    deleteDocument,
    refetch 
  } = useClientDocuments(operation.id, operation);

  // Handle file upload with database integration
  const handleFileUpload = async (documentId: string, file: File) => {
    console.log('📤 [DOCUMENTS-TAB] handleFileUpload called:', {
      documentId,
      fileName: file.name,
      fileSize: file.size
    });
    
    try {
      setUploadingFiles(prev => new Set(prev).add(documentId));
      await uploadFile(documentId, file);
      onDocumentUpdate?.(checklist!);
      console.log('✅ [DOCUMENTS-TAB] File upload completed successfully');
    } catch (error) {
      console.error('❌ [DOCUMENTS-TAB] Error uploading file:', error);
      alert(`Error al subir archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setUploadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  // Handle text/date/select input with database integration
  const handleInputChange = async (documentId: string, value: string | boolean) => {
    try {
      await updateDocument(documentId, {
        completed: value !== '' && value !== null && value !== false,
        value
      });
      onDocumentUpdate?.(checklist!);
    } catch (error) {
      console.error('Error updating document:', error);
      // You could show a toast notification here
    }
  };

  // Handle document deletion
  const handleDeleteDocument = async (documentId: string) => {
    try {
      if (confirm('¿Estás seguro de que quieres borrar este documento?')) {
        console.log('🗑️ [DOCUMENTS-TAB] Starting document deletion:', documentId);
        await deleteDocument(documentId);
        
        // Force a complete refetch to ensure state consistency
        console.log('🔄 [DOCUMENTS-TAB] Forcing complete refetch after deletion');
        await refetch();
        
        setTimeout(() => {
          if (checklist) {
            console.log('🔄 [DOCUMENTS-TAB] Notifying parent of updated checklist:', checklist.completionPercentage);
            onDocumentUpdate?.(checklist);
          }
        }, 200);
        
        console.log('✅ [DOCUMENTS-TAB] Document deletion completed');
      }
    } catch (error) {
      console.error('❌ [DOCUMENTS-TAB] Error deleting document:', error);
      alert('Error al borrar el documento');
    }
  };

  // Handle file download
  const handleFileDownload = async (documentId: string, fileName: string) => {
    try {
      console.log(`📥 [DOCUMENTS] Downloading file: ${fileName} for document: ${documentId}`);
      
      // Find the document status to get the file
      const documentStatus = getDocumentStatus(documentId);
      
      if (!documentStatus?.value || !(documentStatus.value instanceof File)) {
        console.error('❌ [DOCUMENTS] No file found for download');
        alert('No se encontró el archivo para descargar');
        return;
      }
      
      // Get the original file that was uploaded
      const file = documentStatus.value as File;
      
      // Create download link with the original file
      const url = window.URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log(`✅ [DOCUMENTS] File download initiated: ${fileName}`);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error al descargar el archivo');
    }
  };

  // Get status for a document
  const getDocumentStatus = (documentId: string): DocumentStatus | undefined => {
    return checklist?.statuses.find(s => s.documentId === documentId);
  };

  // Group documents by category
  const groupedDocuments = checklist?.documents.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = [];
    }
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, DocumentItem[]>) || {};

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Error al Cargar Documentos
        </h3>
        <p className="text-gray-600 mb-4">
          {dbError || 'No se pudo cargar la lista de documentos para esta operación.'}
        </p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const countryName = checklist.country === 'MX' ? 'México' : 'Colombia';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-900">
            Documentos del Cliente - {countryName}
          </h4>
          <p className="text-sm text-gray-600 mt-1">
            Checklist de documentos requeridos antes del inicio de la operación
          </p>
        </div>
        
        {/* Progress indicator */}
        <div className="text-right">
          <div className="text-2xl font-bold text-primary-600">
            {checklist.completionPercentage}%
          </div>
          <div className="text-sm text-gray-600">Completado</div>
          <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${checklist.completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Document Categories */}
      <div className="space-y-6">
        {Object.entries(groupedDocuments).map(([category, documents]) => (
          <DocumentCategory
            key={category}
            category={category}
            documents={documents}
            getStatus={getDocumentStatus}
            onFileUpload={handleFileUpload}
            onInputChange={handleInputChange}
            onFileDownload={handleFileDownload}
            onDeleteDocument={handleDeleteDocument}
            allStatuses={checklist.statuses}
          />
        ))}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4 border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-gray-900">Resumen del Checklist</span>
          </div>
          <div className="text-sm text-gray-600">
            Última actualización: {new Date(checklist.lastUpdated).toLocaleDateString('es-ES')}
          </div>
        </div>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total documentos:</span>
            <span className="font-medium ml-2">{checklist.documents.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Obligatorios:</span>
            <span className="font-medium ml-2">
              {checklist.documents.filter(d => d.required).length}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Completados:</span>
            <span className="font-medium ml-2 text-green-600">
              {checklist.statuses.filter(s => s.completed).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Document Category Component
interface DocumentCategoryProps {
  category: string;
  documents: DocumentItem[];
  getStatus: (id: string) => DocumentStatus | undefined;
  onFileUpload: (documentId: string, file: File) => void;
  onInputChange: (documentId: string, value: string | boolean) => void;
  onFileDownload: (documentId: string, fileName: string) => void;
  onDeleteDocument: (documentId: string) => void;
  allStatuses: DocumentStatus[];
}

function DocumentCategory({
  category,
  documents,
  getStatus,
  onFileUpload,
  onInputChange,
  onFileDownload,
  onDeleteDocument,
  allStatuses
}: DocumentCategoryProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h5 className="font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary-600" />
          {category}
        </h5>
      </div>
      
      <div className="p-4 space-y-4">
        {documents.map((document) => (
          <DocumentItem
            key={document.id}
            document={document}
            status={getStatus(document.id)}
            onFileUpload={onFileUpload}
            onInputChange={onInputChange}
            onFileDownload={onFileDownload}
            onDeleteDocument={onDeleteDocument}
            allStatuses={allStatuses}
          />
        ))}
      </div>
    </div>
  );
}

// Individual Document Item Component
interface DocumentItemProps {
  document: DocumentItem;
  status?: DocumentStatus;
  onFileUpload: (documentId: string, file: File) => void;
  onInputChange: (documentId: string, value: string | boolean) => void;
  onFileDownload: (documentId: string, fileName: string) => void;
  onDeleteDocument: (documentId: string) => void;
  allStatuses?: DocumentStatus[];
}

function DocumentItem({ 
  document, 
  status, 
  onFileUpload, 
  onInputChange, 
  onFileDownload,
  onDeleteDocument,
  allStatuses = [] 
}: DocumentItemProps) {
  const isCompleted = status?.completed || false;
  
  // Helper function to check if document should be visible based on dependencies
  const isDocumentVisible = (): boolean => {
    // Logic for Mexico conditional fields
    if (document.id === 'mx_normatividad_rrna') {
      const rrnaRequired = allStatuses.find(s => s.documentId === 'mx_requiere_rrna')?.value;
      return rrnaRequired === 'Sí';
    }
    
    if (document.id === 'mx_tipo_padron_sectorial') {
      const sectorialRequired = allStatuses.find(s => s.documentId === 'mx_requiere_inscripcion_sectorial')?.value;
      return sectorialRequired === 'Sí';
    }
    
    if (document.id === 'mx_inscripcion_sectorial_doc') {
      const sectorialRequired = allStatuses.find(s => s.documentId === 'mx_requiere_inscripcion_sectorial')?.value;
      return sectorialRequired === 'Sí';
    }
    
    if (document.id === 'mx_acuse_encargo_cliente') {
      const despachoType = allStatuses.find(s => s.documentId === 'mx_despacho_aduanal')?.value;
      return despachoType === 'Importador/Cliente';
    }
    
    if (document.id === 'mx_pedimentos_finkargo') {
      const despachoType = allStatuses.find(s => s.documentId === 'mx_despacho_aduanal')?.value;
      return despachoType === 'Finkargo';
    }
    
    // All other documents are always visible
    return true;
  };
  
  // Don't render if document should not be visible
  if (!isDocumentVisible()) {
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 [DOCUMENT-ITEM] File input changed:', e.target.files);
    const file = e.target.files?.[0];
    if (file) {
      console.log('📁 [DOCUMENT-ITEM] File selected:', {
        name: file.name,
        size: file.size,
        documentId: document.id
      });
      onFileUpload(document.id, file);
    } else {
      console.log('❌ [DOCUMENT-ITEM] No file selected');
    }
  };

  const handleFileDownload = (documentId: string, fileName: string) => {
    onFileDownload(documentId, fileName);
  };

  return (
    <div className={cn(
      "border rounded-lg p-4 transition-colors",
      isCompleted ? "border-green-200 bg-green-50" : "border-gray-200"
    )}>
      <div className="flex items-start gap-3">
        {/* Status Icon */}
        <div className={cn(
          "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5",
          isCompleted ? "bg-green-500" : document.required ? "bg-orange-100" : "bg-gray-100"
        )}>
          {isCompleted ? (
            <Check className="h-4 w-4 text-white" />
          ) : document.required ? (
            <AlertCircle className="h-4 w-4 text-orange-500" />
          ) : (
            <FileText className="h-4 w-4 text-gray-400" />
          )}
        </div>

        {/* Document Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h6 className="font-medium text-gray-900">
                {document.name}
                {document.required && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </h6>
              {document.description && (
                <p className="text-sm text-gray-600 mt-1">{document.description}</p>
              )}
            </div>
          </div>

          {/* Input based on document type */}
          <div className="mt-3">
            {document.type === 'file' && (
              <FileUploadInput
                document={document}
                status={status}
                onChange={handleFileChange}
              />
            )}
            
            {document.type === 'text' && (
              <input
                type="text"
                placeholder={document.placeholder}
                value={status?.value as string || ''}
                onChange={(e) => onInputChange(document.id, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            )}
            
            {document.type === 'date' && (
              <input
                type="date"
                value={status?.value as string || ''}
                onChange={(e) => onInputChange(document.id, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            )}
            
            {document.type === 'checkbox' && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={status?.value as boolean || false}
                  onChange={(e) => onInputChange(document.id, e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Sí / Confirmado</span>
              </label>
            )}
            
            {document.type === 'select' && (
              <select
                value={status?.value as string || ''}
                onChange={(e) => onInputChange(document.id, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Seleccionar opción...</option>
                {document.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* File info if uploaded */}
          {status?.fileName && (
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="h-4 w-4" />
                <span>Archivo: {status.fileName}</span>
                {status.uploadedAt && (
                  <span className="text-gray-500">
                    • {new Date(status.uploadedAt).toLocaleDateString('es-ES')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleFileDownload(document.id, status.fileName!)}
                  className="flex items-center gap-1 px-3 py-1 text-xs bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200 transition-colors"
                  title="Descargar archivo"
                >
                  <Download className="h-3 w-3" />
                  Descargar
                </button>
                <button
                  onClick={() => onDeleteDocument(document.id)}
                  className="flex items-center gap-1 px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                  title="Borrar documento"
                >
                  <Trash2 className="h-3 w-3" />
                  Borrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// File Upload Input Component
interface FileUploadInputProps {
  document: DocumentItem;
  status?: DocumentStatus;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function FileUploadInput({ document, status, onChange }: FileUploadInputProps) {
  const acceptedTypes = document.fileTypes?.map(type => `.${type}`).join(',');
  
  // Create unique key to force re-render after delete
  const inputKey = `file-${document.id}-${status?.completed ? 'completed' : 'empty'}-${Date.now()}`;

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-400 transition-colors">
      <input
        key={inputKey}
        type="file"
        accept={acceptedTypes}
        onChange={onChange}
        className="hidden"
        id={`file-${document.id}`}
      />
      <label htmlFor={`file-${document.id}`} className="cursor-pointer">
        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <div className="text-sm">
          <span className="font-medium text-primary-600 hover:text-primary-500">
            Seleccionar archivo
          </span>
          <span className="text-gray-500"> o arrastra aquí</span>
        </div>
        {document.fileTypes && (
          <p className="text-xs text-gray-500 mt-1">
            Tipos permitidos: {document.fileTypes.join(', ').toUpperCase()}
          </p>
        )}
      </label>
    </div>
  );
}