/**
 * Hook específico para obtener datos del dashboard de administrador
 * Integra Control Tower MVP - Administradores
 */

import { useState, useEffect, useCallback } from 'react';
import { BackendOperationCard, DashboardResponse } from './useDashboardData';

const BACKEND_URL = 'http://localhost:3001';

export interface UseAdminDashboardDataReturn {
  operations: BackendOperationCard[];
  isLoading: boolean;
  error: string | null;
  metadata: DashboardResponse['metadata'] | null;
  refetch: () => void;
}

export function useAdminDashboardData(): UseAdminDashboardDataReturn {
  const [operations, setOperations] = useState<BackendOperationCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<DashboardResponse['metadata'] | null>(null);

  const fetchAdminDashboardData = useCallback(async () => {
    try {
      console.log('👑 [ADMIN] Iniciando fetch de TODAS las operaciones...');
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${BACKEND_URL}/api/operations/dashboard`);
      
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

      if (!data.data || data.data.length === 0) {
        console.warn('⚠️ [ADMIN] No se recibieron operaciones del backend');
        console.log('Metadata:', data.metadata);
      }

      console.log('✅ [ADMIN] Datos procesados correctamente:', {
        operaciones: data.data.length,
        validOperations: data.metadata.processingStats?.validOperations,
        errorCount: data.metadata.processingStats?.errorCount
      });

      setOperations(data.data || []);
      setMetadata(data.metadata);

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
  }, []);

  // Fetch initial data
  useEffect(() => {
    console.log('👑 [ADMIN] Hook inicializado - Fetcheando datos...');
    fetchAdminDashboardData();
  }, []); // Empty dependency array - only run once

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