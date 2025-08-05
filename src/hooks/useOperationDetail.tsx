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

      const response = await fetch(`${BACKEND_URL}/api/operations/${operationId}`);
      
      console.log('🌐 Respuesta HTTP:', response.status, response.statusText);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Operación con ID ${operationId} no encontrada`);
        }
        const errorText = await response.text();
        console.error('❌ Error HTTP:', response.status, errorText);
        throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
      }

      const data: OperationDetailResponse = await response.json();
      
      console.log('📄 Datos de operación recibidos:', {
        success: data.success,
        operationId: data.data?.id,
        clientName: data.data?.clienteCompleto,
        incoterms: data.data?.incoterms,
        liberaciones: data.data?.liberaciones?.length || 0
      });

      if (!data.success) {
        console.error('❌ Backend reportó error:', data.message);
        throw new Error(data.message || 'Error obteniendo detalles de la operación');
      }

      if (!data.data) {
        console.warn('⚠️ No se recibieron datos de la operación');
        throw new Error('No se encontraron datos para esta operación');
      }

      console.log('✅ Operación procesada correctamente:', {
        id: data.data.id,
        cliente: data.data.clienteCompleto,
        proveedor: data.data.proveedorBeneficiario,
        progress: data.data.progresoGeneral,
        hasTimeline: !!data.data.timeline,
        incoterms: data.data.incoterms,
        liberacionesCount: data.data.liberaciones?.length || 0
      });

      setOperation(data.data);

    } catch (err) {
      console.error('❌ Error obteniendo detalles de operación:', {
        operationId,
        error: err,
        message: err instanceof Error ? err.message : 'Error desconocido'
      });
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setOperation(null);
    } finally {
      setIsLoading(false);
      console.log('🏁 Fetch de operación completado');
    }
  };

  useEffect(() => {
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