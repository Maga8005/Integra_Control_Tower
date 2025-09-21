// =====================================================
// HOOK PARA MANEJO DE PAGOS INTEGRA CO - Simplificado
// =====================================================

import { useState, useCallback } from 'react';
import { PaymentService } from '../services/PaymentService';

interface UsePaymentsReturn {
  // Estados
  loading: boolean;
  error: string | null;

  // Datos
  operations: any[];
  selectedOperation: any | null;
  stats: any | null;

  // Acciones
  loadOperaciones: () => Promise<void>;
  loadOperacionDetalle: (operacionId: string) => Promise<void>;
  avanzarWorkflow: (operacionId: string, pasoActual: number) => Promise<void>;
  marcarPago: (operacionId: string, pagoId: string, referencia: string) => Promise<void>;
  agregarProveedor: (operacionId: string, proveedorData: any) => Promise<void>;
}

export function usePayments(): UsePaymentsReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [operations, setOperations] = useState<any[]>([]);
  const [selectedOperation, setSelectedOperation] = useState<any | null>(null);
  const [stats, setStats] = useState<any | null>(null);

  // Cargar lista de operaciones
  const loadOperaciones = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await PaymentService.getOperaciones();
      setOperations(data.operations || []);
      setStats(data.stats || null);

    } catch (err) {
      setError('Error cargando operaciones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar detalle de una operación
  const loadOperacionDetalle = useCallback(async (operacionId: string) => {
    try {
      setLoading(true);
      setError(null);

      const data = await PaymentService.getOperacionDetalle(operacionId);
      setSelectedOperation(data);

    } catch (err) {
      setError('Error cargando detalle de operación');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Avanzar paso del workflow
  const avanzarWorkflow = useCallback(async (operacionId: string, pasoActual: number) => {
    try {
      setLoading(true);
      setError(null);

      await PaymentService.avanzarPaso(operacionId, pasoActual);

      // Recargar detalle de la operación
      await loadOperacionDetalle(operacionId);

    } catch (err) {
      setError('Error avanzando workflow');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadOperacionDetalle]);

  // Marcar pago como realizado
  const marcarPago = useCallback(async (
    operacionId: string,
    pagoId: string,
    referencia: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      await PaymentService.marcarPago(operacionId, pagoId, referencia);

      // Recargar detalle de la operación
      await loadOperacionDetalle(operacionId);

    } catch (err) {
      setError('Error marcando pago');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadOperacionDetalle]);

  // Agregar proveedor
  const agregarProveedor = useCallback(async (operacionId: string, proveedorData: any) => {
    try {
      setLoading(true);
      setError(null);

      await PaymentService.agregarProveedor(operacionId, proveedorData);

      // Recargar detalle de la operación
      await loadOperacionDetalle(operacionId);

    } catch (err) {
      setError('Error agregando proveedor');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadOperacionDetalle]);

  return {
    loading,
    error,
    operations,
    selectedOperation,
    stats,
    loadOperaciones,
    loadOperacionDetalle,
    avanzarWorkflow,
    marcarPago,
    agregarProveedor
  };
}