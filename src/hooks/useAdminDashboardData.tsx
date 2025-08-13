/**
 * Hook específico para obtener datos del dashboard de administrador
 * Integra Control Tower MVP - Administradores
 */

import { useState, useEffect, useCallback } from 'react';
import { BackendOperationCard, DashboardResponse } from './useDashboardData';
import { environment, supabaseHeaders } from '../config/environment';
import { mockDashboardData } from '../services/mockAuthService';

// Helper functions for data mapping
function formatCurrency(amount: number, currency: string = 'USD'): string {
  return `$${amount.toLocaleString()} ${currency}`;
}

function mapOperationStatus(progress: number): 'draft' | 'in-progress' | 'completed' | 'on-hold' {
  if (progress >= 100) return 'completed';
  if (progress >= 20) return 'in-progress';
  if (progress > 0) return 'draft';
  return 'on-hold';
}

function getCurrentPhaseName(timeline: any[]): string {
  if (!timeline || timeline.length === 0) return 'Sin información';
  
  // Find current phase (in progress or last completed)
  const currentPhase = timeline.find(phase => phase.estado === 'en_proceso') || 
                      timeline.filter(phase => phase.estado === 'completado').pop() ||
                      timeline[0];
  
  return currentPhase?.fase || 'Sin fase';
}

function mapTimeline(backendTimeline: any[]): any {
  if (!backendTimeline || backendTimeline.length === 0) {
    return {
      states: [],
      currentState: 0,
      overallProgress: 0
    };
  }

  const states = backendTimeline.map((phase, index) => ({
    id: index + 1,
    name: phase.fase,
    status: phase.estado === 'completado' ? 'completed' : 
            phase.estado === 'en_proceso' ? 'in-progress' : 'pending',
    progress: phase.progreso || 0,
    description: phase.descripcion || phase.notas || '',
    completedAt: phase.fecha,
    notes: phase.notas
  }));

  const currentState = states.findIndex(state => state.status === 'in-progress') + 1 || 
                      states.filter(state => state.status === 'completed').length;
                      
  const overallProgress = states.reduce((acc, state) => acc + state.progress, 0) / states.length;

  return {
    states,
    currentState,
    overallProgress
  };
}

export interface UseAdminDashboardDataReturn {
  operations: BackendOperationCard[];
  isLoading: boolean;
  error: string | null;
  metadata: DashboardResponse['metadata'] | null;
  refetch: () => void;
}

export function useAdminDashboardData(countryCode: 'CO' | 'MX' = 'CO'): UseAdminDashboardDataReturn {
  const [operations, setOperations] = useState<BackendOperationCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<DashboardResponse['metadata'] | null>(null);

  const fetchAdminDashboardData = useCallback(async () => {
    try {
      const countryName = countryCode === 'CO' ? 'Colombia' : 'México';
      console.log(`👑 [ADMIN] Iniciando fetch de operaciones de ${countryName}...`);
      console.log('🌍 Usando mock backend:', environment.useMockBackend);
      setIsLoading(true);
      setError(null);

      if (environment.useMockBackend) {
        // Usar datos mock en producción
        console.log('📦 Usando mock dashboard data');
        const data = mockDashboardData;
        console.log('👑 [ADMIN] Datos mock:', data);
        
        // Usar los datos mock (operaciones vacías por ahora)
        setOperations(data.operations || []);
        setMetadata({
          totalRecords: 0,
          validRecords: 0,
          errors: [],
          warnings: [],
          processedAt: new Date().toISOString(),
          source: 'mock'
        });
        setError(null);
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${environment.apiBaseUrl}/admin-dashboard?country=${countryCode}`, {
        headers: supabaseHeaders
      });
      
      console.log('👑 [ADMIN] Respuesta HTTP:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [ADMIN] Error HTTP:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data: DashboardResponse = await response.json();
      
      console.log('👑 [ADMIN] Datos recibidos:', {
        success: data.success,
        operaciones: data.data?.length || 0,
        errores: data.errors?.length || 0,
        metadata: data.metadata
      });

      if (!data.success) {
        console.error('❌ [ADMIN] Backend reportó error:', data.message, data.errors);
        throw new Error(data.message || 'Error obteniendo datos del dashboard');
      }

      // Extract operations from the country-data structure
      const rawOperations = data.data?.operations || [];
      const validation = data.data?.validation || {};

      if (!rawOperations || rawOperations.length === 0) {
        console.warn('⚠️ [ADMIN] No se recibieron operaciones del backend');
        console.log('Validation:', validation);
      }

      // Map backend data to frontend structure
      const mappedOperations = rawOperations.map((op: any) => {
        console.log(`🔍 [ADMIN FRONTEND] Operación ${op.id}:`, {
          id: op.id,
          operacionId: op.operacionId,
          clienteCompleto: op.clienteCompleto,
          clienteNit: op.clienteNit,
          proveedorBeneficiario: op.proveedorBeneficiario,
          valorTotal: op.valorTotal,
          valorOperacion: op.valorOperacion
        });
        
        return {
        id: op.id,
        operationId: op.operacionId || 'Sin ID',  // ID único de la operación
        clientName: op.clienteCompleto || op.clientName || 'Sin nombre',  // Nombre real del cliente del parser
        clientNit: op.clienteNit || 'Sin NIT',
        providerName: op.proveedorBeneficiario || op.providerName || 'Sin proveedor',
        totalValue: formatCurrency(op.valorTotal || 0, op.moneda || 'USD'),
        totalValueNumeric: op.valorTotal || 0,
        operationValue: op.valorOperacion ? formatCurrency(op.valorOperacion, op.moneda || 'USD') : '-',
        operationValueNumeric: op.valorOperacion || 0,
        route: op.rutaComercial || `${op.paisExportador || 'N/A'} → ${op.paisImportador || 'N/A'}`,
        assignedPerson: op.personaAsignada || 'Sin asignar',
        progress: op.progresoGeneral || op.progress || 0,
        status: mapOperationStatus(op.progresoGeneral || 0),
        currentPhaseName: getCurrentPhaseName(op.timeline),
        timeline: mapTimeline(op.timeline),
        updatedAt: op.ultimaActualizacion || op.updatedAt
        }
      });

      console.log('✅ [ADMIN] Datos procesados correctamente:', {
        operaciones: mappedOperations.length,
        validationErrors: validation.errors?.length || 0,
        validationWarnings: validation.warnings?.length || 0,
        sampleOperation: mappedOperations[0] // Log first operation for debugging
      });

      setOperations(mappedOperations);
      
      // Create metadata compatible with the expected structure
      const processedMetadata = {
        totalRecords: mappedOperations.length,
        validRecords: mappedOperations.length,
        errors: validation.errors || [],
        warnings: validation.warnings || [],
        processedAt: data.timestamp || new Date().toISOString(),
        source: 'backend'
      };
      setMetadata(processedMetadata);

    } catch (err) {
      console.error('❌ [ADMIN] Error completo fetching dashboard data:', {
        error: err,
        message: err instanceof Error ? err.message : 'Error desconocido',
        stack: err instanceof Error ? err.stack : undefined
      });
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setOperations([]);
      setMetadata(null);
    } finally {
      setIsLoading(false);
      console.log('🏁 [ADMIN] Fetch completado');
    }
  }, [countryCode]);

  // Fetch initial data
  useEffect(() => {
    console.log(`👑 [ADMIN] Hook inicializado - Fetcheando datos de ${countryCode}...`);
    fetchAdminDashboardData();
  }, [fetchAdminDashboardData]); // Re-run when country changes

  const refetch = useCallback(() => {
    console.log('🔄 [ADMIN] REFETCH llamado - Volviendo a fetchear datos...');
    fetchAdminDashboardData();
  }, [fetchAdminDashboardData]);

  return {
    operations,
    isLoading,
    error,
    metadata,
    refetch
  };
}