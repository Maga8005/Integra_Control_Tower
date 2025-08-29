/**
 * Hook personalizado para obtener datos del dashboard desde el backend
 * Integra Control Tower MVP
 */

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { environment, supabaseHeaders } from '../config/environment';

// Timeline interfaces
export interface TimelineState {
  id: number;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  progress: number;
  description: string;
  completedAt?: string;
  notes?: string;
}

export interface Timeline {
  states: TimelineState[];
  currentState: number;
  overallProgress: number;
}

// Interface para los datos que llegan del backend
// Interface para liberaciones ejecutadas
export interface LiberacionEjecutada {
  numero: number;
  capital: number;
  fecha: string;
  estado: 'completado';
}

export interface BackendOperationCard {
  id: string;
  clientName: string;
  clientNit: string;
  providerName: string;      // NUEVO: Nombre del proveedor internacional
  totalValue: string;        // Formato: "$75,000 USD" - Valor total operación (más grande)
  totalValueNumeric: number; // NUEVO: Valor numérico para cálculos - Valor total operación
  operationValue?: string;   // NUEVO: Valor compra mercancía (formato: "$75,000 USD" o "-" si no existe)
  operationValueNumeric?: number; // NUEVO: Valor compra mercancía numérico para cálculos
  route: string;
  assignedPerson: string;
  progress: number;
  status: 'draft' | 'in-progress' | 'completed' | 'on-hold';
  currentPhaseName?: string; // NUEVO: Nombre de la fase actual del timeline
  timeline?: Timeline;       // NUEVO: Timeline de 5 estados
  incotermCompra?: string;   // NUEVO: Incoterm de compra (ej: FOB, DAP)
  incotermVenta?: string;    // NUEVO: Incoterm de venta (ej: CIF, DDP)
  liberaciones?: LiberacionEjecutada[]; // NUEVO: Liberaciones ejecutadas
  // Real document data
  documentCompletion?: number; // NUEVO: Porcentaje real de documentos completados
  documentsData?: any[]; // NUEVO: Datos reales de documentos de la BD
  createdAt?: string;
  updatedAt?: string;
  
  // 🆕 FINANCIAL DATA (from backend)
  pagosClientes?: Array<{
    id: string;
    timeline_step_id: number;
    tipo_pago: string;
    monto: number;
    moneda: string;
    estado: string;
    fecha_pago: string | null;
    descripcion: string | null;
  }>;
  costosLogisticos?: Array<{
    id: string;
    tipo_costo: string;
    monto: number;
    timeline_step_id: number;
  }>;
  extracostos?: Array<{
    id: string;
    concepto: string;
    monto: number;
    fecha_pago: string | null;
    timeline_step_id: number;
  }>;
  reembolsos?: Array<{
    id: string;
    monto_reembolso: number;
    fecha_pago_intercompania: string | null;
    fecha_pago_fideicomiso: string | null;
  }>;
  pagosProveedores?: Array<{
    id: string;
    numero_pago: string;
    valor_pagado: number;
    porcentaje_pago: string;
    estado: string;
    fecha_pago_realizado: string | null;
    fecha_solicitud: string | null;
  }>;
  // Financial totals
  totalPagosClientes?: number;
  totalCostosLogisticos?: number;
  totalExtracostos?: number;
  totalReembolsos?: number;
  // Internal IDs
  idIntegra?: string | null;
  idsPaga?: string[] | null;
  // Backend field names
  clienteCompleto?: string;
  proveedorBeneficiario?: string;
  valorOperacion?: number;
  valorTotal?: number;
  moneda?: string;
  personaAsignada?: string;
}

export interface DashboardResponse {
  success: boolean;
  data: BackendOperationCard[];
  metadata: {
    totalOperations: number;
    lastUpdated: string;
    processingStats?: {
      validOperations: number;
      errorCount: number;
      warningCount: number;
    };
  };
  message?: string;
  errors?: string[];
}

export interface UseDashboardDataReturn {
  operations: BackendOperationCard[];
  isLoading: boolean;
  error: string | null;
  metadata: DashboardResponse['metadata'] | null;
  refetch: () => void;
}

// Use Supabase configuration

// Función para mapear estructura del backend a frontend
function mapBackendToFrontend(backendData: any[]): BackendOperationCard[] {
  return backendData.map((op: any) => {
    // Parsear Incoterms desde el campo "incoterms" del backend
    let incotermCompra: string | undefined;
    let incotermVenta: string | undefined;
    
    if (op.incoterms && op.incoterms !== ' → ' && op.incoterms.trim()) {
      // Si contiene " / ", dividir en compra y venta
      if (op.incoterms.includes(' / ')) {
        const [compra, venta] = op.incoterms.split(' / ');
        incotermCompra = compra?.trim() || undefined;
        incotermVenta = venta?.trim() || undefined;
      } else {
        // Si no contiene " / ", usar como compra únicamente
        incotermCompra = op.incoterms.trim();
      }
    }
    
    console.log(`🔍 [FRONTEND] Operación ${op.id}: valorTotal=${op.valorTotal}, valorOperacion=${op.valorOperacion}`)
    
    return {
      id: op.id,
      clientName: op.clienteCompleto,
      clientNit: op.clienteNit || op.clienteNIT || 'Sin NIT',
      providerName: op.proveedorBeneficiario || 'Proveedor no especificado',
      totalValue: `$${op.valorTotal?.toLocaleString() || '0'} ${op.moneda || 'USD'}`,
      totalValueNumeric: op.valorTotal || 0,
      operationValue: op.valorOperacion ? `$${op.valorOperacion.toLocaleString()} ${op.moneda || 'USD'}` : '-',
      operationValueNumeric: op.valorOperacion || 0,
      route: op.rutaComercial || 'Ruta no especificada',
      assignedPerson: op.personaAsignada || 'No asignado',
      progress: op.progresoGeneral || 0,
      status: mapBackendStatus(op.estados),
      currentPhaseName: getCurrentPhaseName(op.timeline),
      timeline: mapTimelineData(op.timeline), // NUEVO: Mapear timeline
      incotermCompra, // NUEVO: Incoterm de compra extraído
      incotermVenta,  // NUEVO: Incoterm de venta extraído
      liberaciones: mapLiberaciones(op.liberaciones), // NUEVO: Mapear liberaciones ejecutadas
      createdAt: op.fechaCreacion,
      updatedAt: op.ultimaActualizacion,
      // 🆕 FINANCIAL DATA
      pagosClientes: op.pagosClientes || [],
      costosLogisticos: op.costosLogisticos || [],
      extracostos: op.extracostos || [],
      reembolsos: op.reembolsos || [],
      pagosProveedores: op.pagosProveedores || [],
      totalPagosClientes: op.totalPagosClientes || 0,
      totalCostosLogisticos: op.totalCostosLogisticos || 0,
      totalExtracostos: op.totalExtracostos || 0,
      totalReembolsos: op.totalReembolsos || 0,
      idIntegra: op.idIntegra,
      idsPaga: op.idsPaga,
      // Backend field names for compatibility
      clienteCompleto: op.clienteCompleto,
      proveedorBeneficiario: op.proveedorBeneficiario,
      valorOperacion: op.valorOperacion,
      valorTotal: op.valorTotal,
      moneda: op.moneda,
      personaAsignada: op.personaAsignada
    } as BackendOperationCard;
  });
}

// Función helper para mapear status del backend
function mapBackendStatus(estados: any): 'draft' | 'in-progress' | 'completed' | 'on-hold' {
  if (!estados) return 'draft';
  
  const completedCount = Object.values(estados).filter(estado => estado === 'completado').length;
  const totalStates = Object.values(estados).length;
  
  if (completedCount === totalStates) return 'completed';
  if (completedCount > 0) return 'in-progress';
  return 'draft';
}

// Función helper para obtener nombre de fase actual
function getCurrentPhaseName(timeline: any[]): string | undefined {
  if (!timeline || !Array.isArray(timeline)) return undefined;
  
  const currentPhase = timeline.find(phase => phase.estado === 'en_proceso');
  return currentPhase?.fase;
}

// Función helper para mapear timeline del backend al frontend
function mapTimelineData(backendTimeline: any[]): Timeline | undefined {
  if (!backendTimeline || !Array.isArray(backendTimeline)) return undefined;
  
  const states: TimelineState[] = backendTimeline.map((phase: any, index: number) => ({
    id: index + 1,
    name: phase.fase || `Fase ${index + 1}`,
    status: mapTimelineStatus(phase.estado),
    progress: phase.progreso || 0,
    description: phase.descripcion || '',
    completedAt: phase.fecha,
    notes: phase.notas
  }));
  
  // Encontrar el estado actual (el primer "in-progress" o el último "completed")
  let currentState = 1;
  const inProgressState = states.find(state => state.status === 'in-progress');
  if (inProgressState) {
    currentState = inProgressState.id;
  } else {
    const completedStates = states.filter(state => state.status === 'completed');
    if (completedStates.length > 0) {
      currentState = Math.min(completedStates[completedStates.length - 1].id + 1, states.length);
    }
  }
  
  // Calcular progreso general
  const overallProgress = Math.round(
    states.reduce((sum, state) => sum + state.progress, 0) / states.length
  );
  
  return {
    states,
    currentState,
    overallProgress
  };
}

// Función helper para mapear estado de timeline
function mapTimelineStatus(backendStatus: string): 'pending' | 'in-progress' | 'completed' | 'blocked' {
  switch (backendStatus?.toLowerCase()) {
    case 'completado':
    case 'completed':
      return 'completed';
    case 'en_proceso':
    case 'en proceso':
    case 'in_progress':
      return 'in-progress';
    case 'bloqueado':
    case 'blocked':
      return 'blocked';
    default:
      return 'pending';
  }
}

// Función helper para mapear liberaciones del backend
function mapLiberaciones(backendLiberaciones: any[]): LiberacionEjecutada[] | undefined {
  if (!backendLiberaciones || !Array.isArray(backendLiberaciones) || backendLiberaciones.length === 0) {
    return undefined;
  }
  
  // Solo mapear liberaciones que están realmente ejecutadas
  return backendLiberaciones
    .filter(lib => lib.estado === 'COMPLETADO' || lib.estado === 'completado')
    .map(lib => ({
      numero: lib.numero || 1,
      capital: lib.capital || 0,
      fecha: lib.fecha || '',
      estado: 'completado' as const
    }))
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()); // Más reciente primero
}

export function useDashboardData(): UseDashboardDataReturn {
  const [operations, setOperations] = useState<BackendOperationCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<DashboardResponse['metadata'] | null>(null);
  
  // Get auth context to check for client operations
  const { user, clientOperations, authToken } = useAuth();

  const fetchDashboardData = async () => {
    try {
      console.log('🔄 Iniciando fetch de datos del dashboard desde Supabase...');
      setIsLoading(true);
      setError(null);

      // Default to Colombia for regular dashboard data
      const response = await fetch(`${environment.apiBaseUrl}/admin-dashboard?country=CO`, {
        headers: supabaseHeaders
      });
      
      console.log('🌐 Respuesta HTTP:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error HTTP:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      console.log('📄 Datos recibidos de Supabase:', {
        success: data.success,
        operaciones: data.data?.operations?.length || 0,
        metadata: data.metadata
      });

      if (!data.success) {
        console.error('❌ Supabase reportó error:', data.message);
        throw new Error(data.message || 'Error obteniendo datos del dashboard');
      }

      const operations = data.data?.operations || [];
      if (!operations || operations.length === 0) {
        console.warn('⚠️ No se recibieron operaciones de Supabase');
        console.log('Metadata:', data.metadata);
      }

      console.log('✅ Datos del dashboard procesados correctamente:', {
        operaciones: operations.length,
        totalValue: data.metadata?.totalValue || 0,
        completedOperations: data.metadata?.completedOperations || 0
      });

      // Map Supabase data to frontend structure with timeline info
      const mappedOperations = operations.map((op: any) => {
        // Convert timeline from Supabase format to frontend format
        const timeline = op.timeline ? {
          states: op.timeline.map((t: any, index: number) => ({
            id: index + 1,
            name: t.fase,
            status: t.estado === 'completado' ? 'completed' : 
                   t.estado === 'en_proceso' ? 'in-progress' : 'pending',
            progress: t.progreso || 0,
            description: t.descripcion || '',
            completedAt: t.fecha,
            notes: t.notas
          })),
          currentState: op.timeline.findIndex((t: any) => t.estado === 'en_proceso') + 1 || 
                       op.timeline.filter((t: any) => t.estado === 'completado').length,
          overallProgress: op.progresoGeneral || 0
        } : undefined;

        return {
          id: op.id,
          clientName: op.clienteCompleto,
          clientNit: op.clienteNit,
          providerName: op.proveedorBeneficiario,
          totalValue: `$${op.valorTotal?.toLocaleString() || '0'} ${op.moneda || 'USD'}`,
          totalValueNumeric: op.valorTotal || 0,
          operationValue: op.valorOperacion ? `$${op.valorOperacion.toLocaleString()} ${op.moneda || 'USD'}` : '-',
          operationValueNumeric: op.valorOperacion || 0,
          route: op.rutaComercial || 'Ruta no especificada',
          assignedPerson: op.personaAsignada || 'No asignado',
          progress: op.progresoGeneral || 0,
          status: op.progresoGeneral >= 100 ? 'completed' : 
                 op.progresoGeneral > 0 ? 'in-progress' : 'draft',
          currentPhaseName: op.timeline?.[0]?.fase || 'Sin fase',
          timeline,
          updatedAt: op.ultimaActualizacion,
          createdAt: op.created_at
        };
      });
      
      setOperations(mappedOperations);
      setMetadata(data.metadata || {
        totalOperations: operations.length,
        lastUpdated: new Date().toISOString()
      });

    } catch (err) {
      console.error('❌ Error completo fetching dashboard data:', {
        error: err,
        message: err instanceof Error ? err.message : 'Error desconocido',
        stack: err instanceof Error ? err.stack : undefined
      });
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setOperations([]);
      setMetadata(null);
    } finally {
      setIsLoading(false);
      console.log('🏁 Fetch completado');
    }
  };

  // Logic to determine data source
  useEffect(() => {
    console.log('🔍 useDashboardData useEffect - Estado:', {
      user: user?.name,
      userRole: user?.role,
      userNit: user?.nit,
      hasClientOperations: !!clientOperations,
      clientOperationsCount: clientOperations?.length || 0,
      hasAuthToken: !!authToken
    });

    // Administrators always fetch ALL operations from backend
    if (user?.role === 'administrator') {
      console.log('👑 Usuario administrador - Fetcheando TODAS las operaciones del backend');
      fetchDashboardData();
      
      // Revalidar cada 30 segundos para administradores para detectar cambios en CSV
      const interval = setInterval(() => {
        console.log('🔄 Revalidación automática del dashboard (admin)');
        fetchDashboardData();
      }, 30000); // 30 segundos
      
      return () => clearInterval(interval);
    }

    // If user is authenticated via NIT and has client operations, use those
    if (user?.nit && clientOperations && authToken && user?.role !== 'administrator') {
      console.log('✅ Usando operaciones del cliente autenticado por NIT:', clientOperations.length);
      console.log('🔍 Datos originales de clientOperations:', clientOperations[0]); // Ver estructura de la primera operación
      
      setIsLoading(false);
      setError(null);
      
      // Map client operations to the expected format
      const mappedClientOperations = clientOperations.map((op: any) => {
        console.log('🔄 Mapeando operación del cliente:', op.id, {
          proveedorBeneficiario: op.proveedorBeneficiario,
          valorTotal: op.valorTotal,
          personaAsignada: op.personaAsignada,
          status: op.status,
          documentCompletion: op.documentCompletion,
          documentsCount: op.documentos?.length || 0
        });
        
        return {
          id: op.id,
          clientName: op.clienteCompleto,
          clientNit: op.clienteNit,
          providerName: op.proveedorBeneficiario, // MAPEO CORRECTO
          totalValue: `$${op.valorTotal?.toLocaleString() || '0'} ${op.moneda || 'USD'}`, // FORMATO CORRECTO
          totalValueNumeric: op.valorTotal || 0,
          operationValue: op.valorOperacion ? `$${op.valorOperacion.toLocaleString()} ${op.moneda || 'USD'}` : undefined,
          operationValueNumeric: op.valorOperacion || 0,
          route: op.rutaComercial || 'Ruta no especificada',
          assignedPerson: op.personaAsignada || 'No asignado', // MAPEO CORRECTO
          progress: op.progresoGeneral || 0,
          status: op.status || (op.progresoGeneral >= 100 ? 'completed' : 
                               op.progresoGeneral > 0 ? 'in-progress' : 'draft'),
          currentPhaseName: (() => {
            // Encontrar el último estado en progreso o el último completado
            if (op.timeline && Array.isArray(op.timeline)) {
              // Buscar primero el estado "en_proceso"
              const enProceso = op.timeline.find((t: any) => t.estado === 'en_proceso');
              if (enProceso) {
                return enProceso.fase;
              }
              
              // Si no hay en proceso, buscar el último completado
              const completados = op.timeline.filter((t: any) => t.estado === 'completado');
              if (completados.length > 0) {
                return completados[completados.length - 1].fase;
              }
              
              // Si no hay completados, el primer pendiente
              const pendiente = op.timeline.find((t: any) => t.estado === 'pendiente');
              if (pendiente) {
                return pendiente.fase;
              }
            }
            return 'Sin fase';
          })(),
          timeline: op.timeline ? {
            states: op.timeline.map((t: any, index: number) => ({
              id: index + 1,
              name: t.fase,
              status: t.estado === 'completado' ? 'completed' : 
                     t.estado === 'en_proceso' ? 'in-progress' : 'pending',
              progress: t.progreso || 0,
              description: t.descripcion || '',
              completedAt: t.fecha,
              notes: t.notas
            })),
            currentState: op.timeline.findIndex((t: any) => t.estado === 'en_proceso') + 1 || 
                         op.timeline.filter((t: any) => t.estado === 'completado').length,
            overallProgress: op.progresoGeneral || 0
          } : undefined,
          // Real document data from database
          documentCompletion: op.documentCompletion || 0,
          documentsData: op.documentos || [],
          updatedAt: op.ultimaActualizacion,
          createdAt: op.createdAt
        };
      });
      
      console.log('✅ Operaciones del cliente mapeadas correctamente:', mappedClientOperations[0]);
      setOperations(mappedClientOperations);
      
      // Create metadata for client operations
      setMetadata({
        totalOperations: mappedClientOperations.length,
        lastUpdated: new Date().toISOString(),
        processingStats: {
          validOperations: mappedClientOperations.length,
          errorCount: 0,
          warningCount: 0
        }
      });
    } else if (user?.role !== 'administrator') {
      // For non-NIT users or demo users, fetch all operations from backend
      console.log('🌐 Fetching todas las operaciones del backend para usuario:', user?.email || 'no autenticado');
      fetchDashboardData();
      
      // Revalidar cada 30 segundos para usuarios que usan backend
      const interval = setInterval(() => {
        console.log('🔄 Revalidación automática del dashboard (usuario backend)');
        fetchDashboardData();
      }, 30000); // 30 segundos
      
      return () => clearInterval(interval);
    }
  }, [user?.role, user?.nit, clientOperations, authToken]);

  const refetch = () => {
    console.log('🔄 REFETCH llamado por usuario:', {
      userRole: user?.role,
      userNit: user?.nit,
      hasClientOperations: !!clientOperations,
      clientOperationsCount: clientOperations?.length || 0
    });

    // Administrators always refetch from backend
    if (user?.role === 'administrator') {
      console.log('👑 Refrescando datos de administrador - Fetcheando del backend');
      fetchDashboardData();
      return;
    }

    // If using client operations, just refresh the current data
    if (user?.nit && clientOperations && authToken && user?.role !== 'administrator') {
      console.log('🔄 Refrescando operaciones del cliente autenticado');
      setOperations([...clientOperations]); // Force re-render
    } else {
      // Otherwise fetch from backend
      console.log('🌐 Refrescando desde backend para usuario no-NIT');
      fetchDashboardData();
    }
  };

  return {
    operations,
    isLoading,
    error,
    metadata,
    refetch
  };
}