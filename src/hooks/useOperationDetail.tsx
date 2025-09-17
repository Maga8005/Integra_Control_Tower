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
  // Additional fields that might be available directly from backend
  bancosProveedores?: {
    nombre_beneficiario: string;
    nombre_banco: string;
    numero_cuenta: string;
    swift: string;
    iban?: string;
    codigo_postal?: string;
    provincia_estado?: string;
    direccion?: string;
    pais?: string;
  };

  // Nueva estructura para múltiples bancos
  bancos?: Array<{
    id?: string;
    operacion_id: string;
    beneficiario: string;
    banco: string;
    direccion: string;
    codigo_postal: string;
    provincia: string;
    numero_cuenta: string;
    swift: string;
    banco_intermediario?: string;
    swift_intermediario?: string;
    pais_banco: string;
    created_at?: string;
  }>;
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
  
  // 🆕 NUEVOS CAMPOS FINANCIEROS DESDE SUPABASE
  costosLogisticos?: Array<{
    id: string;
    operacion_id: string;
    tipo_costo: string;
    descripcion: string;
    monto: number;
    moneda: string;
    fecha_pago?: string;
    estado: string;
    created_at: string;
  }>;
  extracostosOperacion?: Array<{
    id: string;
    operacion_id: string;
    concepto: string;
    monto: number;
    moneda: string;
    fecha_pago?: string;
    estado: string;
    created_at: string;
  }>;
  reembolsosOperacion?: Array<{
    id: string;
    operacion_id: string;
    monto_reembolso: number;
    moneda: string;
    fecha_reembolso?: string;
    concepto: string;
    estado: string;
    created_at: string;
  }>;
  pagosClientes?: Array<{
    id: string;
    operacion_id: string;
    timeline_step_id: number;
    tipo_pago: string;
    monto: number;
    moneda: string;
    estado: string;
    orden: number;
    fecha_pago?: string;
    descripcion: string;
    created_at: string;
  }>;
  pagosProveedores?: Array<{
    id: string;
    operacion_id: string;
    numero_pago: string;
    valor_pagado: number;
    porcentaje_pago: string;
    estado: string;
    fecha_solicitud?: string;
    fecha_pago_realizado?: string;
    valor_total_compra?: number;  // 🆕 Valor total de compra del proveedor
    moneda: string;
    nombre_proveedor?: string;
    // pais_exportador?: string; // ❌ Campo no existe en tabla
    terminos_pago?: string;  // 🆕 Términos de negociación del proveedor
    otros_terminos_pago?: string;  // 🆕 Otros términos específicos
    created_at: string;
  }>;
  // 🆕 TODOS los proveedores de la operación (no solo los que tienen pagos)
  proveedores?: Array<{
    id: string;
    nombre: string;
    pais?: string;
    valor_total_compra?: number;
    moneda?: string;
    terminos_pago?: string;
    otros_terminos_pago?: string;
    tiene_pagos?: boolean;
  }>;
  id_integra?: string | null;
  ids_paga?: string | null;
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

      // Try to find operation in both countries (Colombia first, then Mexico)
      let foundOperation = null;
      let searchedCountries = [];

      // First try Colombia
      console.log(`📞 Buscando operación en Colombia...`);
      let url = `${environment.apiBaseUrl}/admin-dashboard?country=CO`;
      let response = await fetch(url, { headers: supabaseHeaders });
      
      if (response.ok) {
        const coData = await response.json();
        if (coData.success) {
          const coOperations = coData.data?.operations || [];
          foundOperation = coOperations.find((op: any) => op.id === operationId);
          searchedCountries.push('Colombia');
        }
      }

      // If not found in Colombia, try Mexico
      if (!foundOperation) {
        console.log(`📞 Operación no encontrada en Colombia, buscando en México...`);
        url = `${environment.apiBaseUrl}/admin-dashboard?country=MX`;
        response = await fetch(url, { headers: supabaseHeaders });
        
        if (response.ok) {
          const mxData = await response.json();
          if (mxData.success) {
            const mxOperations = mxData.data?.operations || [];
            foundOperation = mxOperations.find((op: any) => op.id === operationId);
            searchedCountries.push('México');
          }
        }
      }

      if (!foundOperation) {
        console.log(`❌ Operación no encontrada en ningún país:`, { operationId, searchedCountries });
        throw new Error(`Operación con ID ${operationId} no encontrada`);
      }

      console.log(`✅ Operación encontrada en: ${foundOperation.paisImportador || 'País no especificado'}`)

      console.log('📄 Operación encontrada:', {
        operationId: foundOperation.id,
        clientName: foundOperation.clienteCompleto,
        valorTotalOperacion: foundOperation.valorTotal,
        valorCompraMercancia: foundOperation.valorOperacion,
        bancosProveedores: foundOperation.bancosProveedores,
        hasBankingData: !!foundOperation.bancosProveedores,
        pagosClientes: foundOperation.pagosClientes?.length || 0,
        pagosProveedores: foundOperation.pagosProveedores?.length || 0,
        proveedores: foundOperation.proveedores?.length || 0, // 🆕 Verificar proveedores
        extracostos: foundOperation.extracostos?.length || 0,
        reembolsos: foundOperation.reembolsos?.length || 0
      });

      // Debug de proveedores
      if (foundOperation.proveedores && foundOperation.proveedores.length > 0) {
        console.log('🏢 DEBUG - Proveedores del backend:', foundOperation.proveedores);
      } else {
        console.log('⚠️ DEBUG - No llegaron proveedores del backend');
      }

      // Debug detallado de pagos proveedores
      if (foundOperation.pagosProveedores && foundOperation.pagosProveedores.length > 0) {
        console.log('💰 DEBUG - Pagos Proveedores RAW del backend:', foundOperation.pagosProveedores);
        foundOperation.pagosProveedores.forEach((pago, index) => {
          console.log(`  Pago ${index + 1}:`, {
            numero: pago.numero_pago,
            valor: pago.valor_pagado,
            valor_total_compra: pago.valor_total_compra,
            moneda: pago.moneda,
            nombre_proveedor: pago.nombre_proveedor,
            todas_las_keys: Object.keys(pago)
          });
        });
      }

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
        // Pass through banking data directly from backend
        bancosProveedores: foundOperation.bancosProveedores,
        // Agregar array de múltiples bancos
        bancos: foundOperation.bancos || [],
        observaciones: foundOperation.observaciones || '',
        alertas: [],
        preciseProgress: {
          totalProgress: foundOperation.progresoGeneral || 0,
          completedPhases: Math.floor((foundOperation.progresoGeneral || 0) / 20),
          currentPhase: Math.floor((foundOperation.progresoGeneral || 0) / 20),
          nextPhase: foundOperation.progresoGeneral >= 100 ? null : Math.floor((foundOperation.progresoGeneral || 0) / 20) + 1,
          phaseDetails: []
        },
        validation: {
          isValid: true,
          warnings: [],
          errors: [],
          suggestions: []
        },
        
        // 🆕 NUEVOS CAMPOS FINANCIEROS DESDE SUPABASE
        costosLogisticos: foundOperation.costosLogisticos || [],
        extracostosOperacion: foundOperation.extracostos || [],
        reembolsosOperacion: foundOperation.reembolsos || [],
        pagosClientes: foundOperation.pagosClientes || [],
        pagosProveedores: foundOperation.pagosProveedores || [],
        proveedores: foundOperation.proveedores || [],  // 🆕 Todos los proveedores
        id_integra: foundOperation.idIntegra || null,
        ids_paga: foundOperation.idsPaga || null
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