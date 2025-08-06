/**
 * Hook personalizado para obtener detalles de una operación específica
 * Utiliza el endpoint optimizado del backend para operaciones individuales
 * Integra Control Tower MVP
 */

import { useState, useEffect } from 'react';

const BACKEND_URL = 'http://localhost:3001';

// Interface que coincide exactamente con la estructura del backend
export interface BackendOperationDetail {
  id: string;
  numeroOperacion: string;
  clienteCompleto: string;
  clienteNit: string;
  tipoEmpresa: string;
  proveedorBeneficiario: string;
  paisProveedor: string;
  valorTotal: number;
  valorOperacion: number;
  moneda: string;
  progresoGeneral: number;
  personaAsignada: string;
  paisExportador: string;
  paisImportador: string;
  rutaComercial: string;
  incoterms: string; // "FOB / DAP"
  montoTotal: number;
  montosLiberados: number;
  montosPendientes: number;
  extracostos: {
    comisionBancaria: number;
    gastosLogisticos: number;
    seguroCarga: number;
    totalExtracostos: number;
  };
  estados: {
    [key: string]: string; // "completado", "en_proceso", etc.
  };
  giros: Array<{
    valorSolicitado: number;
    numeroGiro: string;
    porcentajeGiro: string;
    estado: string;
    fechaVencimiento: string;
  }>;
  liberaciones: Array<{
    numero: number;
    capital: number;
    fecha: string;
    estado: string;
    fechaVencimiento: string;
  }>;
  documentos: any[];
  timeline: Array<{
    id: string;
    fase: string;
    descripcion: string;
    estado: string;
    progreso: number;
    responsable: string;
    fecha: string;
    notas: string;
  }>;
  fechaCreacion: string;
  ultimaActualizacion: string;
  datosBancarios: {
    beneficiario: string;
    banco: string;
    direccion: string;
    numeroCuenta: string;
    swift: string;
    paisBanco: string;
  };
  observaciones: string;
  alertas: any[];
  preciseProgress: {
    totalProgress: number;
    completedPhases: number;
    currentPhase: number;
    nextPhase: number | null;
    phaseDetails: Array<any>;
  };
  validation: {
    isValid: boolean;
    warnings: Array<any>;
    errors: Array<any>;
    suggestions: Array<string>;
  };
}

export interface OperationDetailResponse {
  success: boolean;
  data: BackendOperationDetail;
  message: string;
  timestamp: string;
}

export interface UseOperationDetailReturn {
  operation: BackendOperationDetail | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useOperationDetail(operationId: string): UseOperationDetailReturn {
  const [operation, setOperation] = useState<BackendOperationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOperationDetail = async () => {
    if (!operationId) {
      setError('ID de operación requerido');
      setIsLoading(false);
      return;
    }

    try {
      console.log(`🔍 Buscando operación específica: ${operationId}`);
      setIsLoading(true);
      setError(null);

      // Use the dedicated operation endpoint
      const url = `${BACKEND_URL}/api/operations/${operationId}`;
      console.log(`📞 Llamando a: ${url}`);
      
      const response = await fetch(url);
      console.log(`📡 Respuesta: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Operación no encontrada');
        }
        throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
      }

      const data: OperationDetailResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Error obteniendo detalles de operación');
      }

      const operation = data.data;
      
      console.log('📄 Datos de operación recibidos:', {
        operationId: operation.id,
        clientName: operation.clienteCompleto,
        incoterms: operation.incoterms,
        liberaciones: operation.liberaciones?.length || 0,
        hasTimeline: !!operation.timeline
      });

      console.log('✅ Operación procesada correctamente:', {
        id: operation.id,
        cliente: operation.clienteCompleto,
        proveedor: operation.proveedorBeneficiario,
        progress: operation.progresoGeneral,
        hasTimeline: !!operation.timeline,
        incoterms: operation.incoterms,
        liberacionesCount: operation.liberaciones?.length || 0
      });

      setOperation(operation);

    } catch (err) {
      console.error('❌ Error obteniendo detalles de operación:', {
        operationId,
        endpoint: `${BACKEND_URL}/api/operations/${operationId}`,
        error: err,
        message: err instanceof Error ? err.message : 'Error desconocido',
        stack: err instanceof Error ? err.stack : undefined
      });
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setOperation(null);
    } finally {
      setIsLoading(false);
      console.log('🏁 Fetch de operación completado');
    }
  };

  useEffect(() => {
    console.log('🔍 [OPERATION DETAIL HOOK] useEffect triggered:', {
      operationId,
      hasOperationId: !!operationId,
      operationIdType: typeof operationId
    });
    
    if (operationId) {
      fetchOperationDetail();
    } else {
      setIsLoading(false);
      setError('ID de operación no válido');
    }
  }, [operationId]);

  const refetch = () => {
    console.log('🔄 Refrescando detalles de operación:', operationId);
    fetchOperationDetail();
  };

  return {
    operation,
    isLoading,
    error,
    refetch
  };
}