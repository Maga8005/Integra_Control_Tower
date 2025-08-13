/**
 * Hook personalizado para obtener detalles de una operación específica
 * Utiliza el endpoint optimizado del backend para operaciones individuales
 * Integra Control Tower MVP
 */

import { useState, useEffect } from 'react';
import { environment, supabaseHeaders } from '../config/environment';

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

      // Use the admin-dashboard function and filter by operation ID
      const url = `${environment.apiBaseUrl}/admin-dashboard`;
      console.log(`📞 Llamando a: ${url} (filtrando por ID: ${operationId})`);
      
      const response = await fetch(url, {
        headers: supabaseHeaders
      });
      console.log(`📡 Respuesta: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Operación no encontrada');
        }
        throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Error obteniendo detalles de operación');
      }

      // Filter operations to find the specific one
      const operations = data.data?.operations || [];
      const foundOperation = operations.find((op: any) => op.id === operationId);
      
      if (!foundOperation) {
        throw new Error(`Operación con ID ${operationId} no encontrada`);
      }

      console.log('📄 Operación encontrada:', {
        operationId: foundOperation.id,
        clientName: foundOperation.clienteCompleto,
        totalPagos: foundOperation.totalPagos,
        numeroGiros: foundOperation.numeroGiros,
        numeroEntregas: foundOperation.numeroEntregas
      });

      // Map the operation data to match the expected interface
      const mappedOperation: BackendOperationDetail = {
        id: foundOperation.id,
        numeroOperacion: foundOperation.operacionId || foundOperation.id,
        clienteCompleto: foundOperation.clienteCompleto,
        clienteNit: foundOperation.clienteNit,
        tipoEmpresa: 'Importador', // Default value
        proveedorBeneficiario: foundOperation.proveedorBeneficiario,
        paisProveedor: foundOperation.paisExportador,
        valorTotal: foundOperation.valorTotal,
        valorOperacion: foundOperation.valorOperacion || foundOperation.valorTotal,
        moneda: foundOperation.moneda || foundOperation.monedaPago,
        progresoGeneral: foundOperation.progresoGeneral,
        personaAsignada: foundOperation.personaAsignada,
        paisExportador: foundOperation.paisExportador,
        paisImportador: foundOperation.paisImportador,
        rutaComercial: foundOperation.rutaComercial,
        incoterms: `${foundOperation.incotermCompra || ''} / ${foundOperation.incotermVenta || ''}`.trim(),
        montoTotal: foundOperation.valorTotal,
        montosLiberados: foundOperation.totalEntregas || 0,
        montosPendientes: (foundOperation.valorTotal || 0) - (foundOperation.totalEntregas || 0),
        extracostos: {
          comisionBancaria: 0,
          gastosLogisticos: 0,
          seguroCarga: 0,
          totalExtracostos: 0
        },
        estados: {
          general: foundOperation.progresoGeneral > 80 ? 'completado' : 'en_proceso'
        },
        // Map pagos to giros format for compatibility
        giros: (foundOperation.pagosProveedores || []).map((pago: any) => ({
          valorSolicitado: pago.valor_pagado,
          numeroGiro: pago.numero_pago,
          porcentajeGiro: pago.porcentaje_pago,
          estado: pago.estado,
          fechaVencimiento: pago.created_at
        })),
        // Map entregas to liberaciones format for compatibility  
        liberaciones: (foundOperation.entregasClientes || []).map((entrega: any) => ({
          numero: entrega.numero_entrega,
          capital: entrega.capital,
          fecha: entrega.fecha_entrega,
          estado: entrega.estado
        })),
        timeline: foundOperation.timeline || [],
        fechaCreacion: foundOperation.createdAt,
        ultimaActualizacion: foundOperation.ultimaActualizacion,
        datosBancarios: foundOperation.bancosProveedores ? {
          beneficiario: foundOperation.bancosProveedores.nombre_beneficiario,
          banco: foundOperation.bancosProveedores.nombre_banco,
          direccion: '',
          numeroCuenta: foundOperation.bancosProveedores.numero_cuenta,
          swift: foundOperation.bancosProveedores.swift,
          paisBanco: foundOperation.bancosProveedores.provincia_estado || ''
        } : {
          beneficiario: '',
          banco: '',
          direccion: '',
          numeroCuenta: '',
          swift: '',
          paisBanco: ''
        },
        // New normalized data
        pagosProveedores: foundOperation.pagosProveedores || [],
        entregasClientes: foundOperation.entregasClientes || [],
        bancosProveedores: foundOperation.bancosProveedores,
        totalPagos: foundOperation.totalPagos || 0,
        totalEntregas: foundOperation.totalEntregas || 0,
        numeroGiros: foundOperation.numeroGiros || 0,
        numeroEntregas: foundOperation.numeroEntregas || 0,
        terminosPago: foundOperation.terminosPago,
        inconvenientes: foundOperation.inconvenientes,
        descripcionInconvenientes: foundOperation.descripcionInconvenientes,
        nps: foundOperation.nps,
        observaciones: foundOperation.observaciones,
        preciseProgress: {
          currentPhase: Math.floor((foundOperation.progresoGeneral || 0) / 20),
          nextPhase: foundOperation.progresoGeneral >= 100 ? null : Math.floor((foundOperation.progresoGeneral || 0) / 20) + 1,
          phaseDetails: []
        },
        validation: {
          isValid: true,
          warnings: [],
          errors: [],
          suggestions: []
        }
      };

      setOperation(mappedOperation);

    } catch (err) {
      console.error('❌ Error obteniendo detalles de operación:', {
        operationId,
        endpoint: `${environment.apiBaseUrl}/operation-detail?id=${operationId}`,
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