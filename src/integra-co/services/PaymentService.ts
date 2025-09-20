// =====================================================
// SERVICIO DE PAGOS INTEGRA CO - Usando Edge Functions
// =====================================================

import { environment, supabaseHeaders } from '../../config/environment';
import type {
  ResumenPagosOperacion
} from '../types';

export class PaymentService {
  /**
   * Obtener lista de operaciones con datos de pagos
   */
  static async getOperaciones(): Promise<any> {
    try {
      const response = await fetch(`${environment.apiBaseUrl}/integra-co-operations`, {
        method: 'GET',
        headers: supabaseHeaders
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error obteniendo operaciones:', error);
      throw error;
    }
  }

  /**
   * Obtener detalles de una operación específica
   */
  static async getOperacionDetalle(operacionId: string): Promise<any> {
    try {
      const response = await fetch(
        `${environment.apiBaseUrl}/integra-co-operations?operacion_id=${operacionId}`,
        {
          method: 'GET',
          headers: supabaseHeaders
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error obteniendo detalle de operación:', error);
      throw error;
    }
  }

  /**
   * Avanzar al siguiente paso del workflow
   */
  static async avanzarPaso(operacionId: string, pasoActual: number): Promise<void> {
    try {
      const response = await fetch(`${environment.apiBaseUrl}/integra-co-workflow`, {
        method: 'POST',
        headers: supabaseHeaders,
        body: JSON.stringify({
          operacionId,
          accion: 'avanzar_paso',
          pasoActual
        })
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Paso avanzado:', result.message);
    } catch (error) {
      console.error('Error avanzando paso:', error);
      throw error;
    }
  }

  /**
   * Marcar pago como realizado
   */
  static async marcarPago(
    operacionId: string,
    pagoId: string,
    referenciaPago: string
  ): Promise<void> {
    try {
      const response = await fetch(`${environment.apiBaseUrl}/integra-co-workflow`, {
        method: 'POST',
        headers: supabaseHeaders,
        body: JSON.stringify({
          operacionId,
          accion: 'marcar_pago',
          pagoId,
          referenciaPago
        })
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Pago marcado:', result.message);
    } catch (error) {
      console.error('Error marcando pago:', error);
      throw error;
    }
  }

  /**
   * Agregar proveedor a operación
   */
  static async agregarProveedor(
    operacionId: string,
    proveedorData: {
      proveedorNombre: string;
      monto: number;
      moneda: string;
      porcentaje?: number;
    }
  ): Promise<void> {
    try {
      const response = await fetch(`${environment.apiBaseUrl}/integra-co-workflow`, {
        method: 'POST',
        headers: supabaseHeaders,
        body: JSON.stringify({
          operacionId,
          accion: 'agregar_proveedor',
          ...proveedorData
        })
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Proveedor agregado:', result.message);
    } catch (error) {
      console.error('Error agregando proveedor:', error);
      throw error;
    }
  }

  /**
   * Crear evaluación del comité
   */
  static async evaluarComite(
    operacionId: string,
    evaluacionData: {
      tipoEvaluacion: string;
      decision: 'aprobado' | 'rechazado' | 'condicionado';
      puntaje?: number;
      condiciones?: string;
      evaluador: string;
    }
  ): Promise<void> {
    try {
      const response = await fetch(`${environment.apiBaseUrl}/integra-co-workflow`, {
        method: 'POST',
        headers: supabaseHeaders,
        body: JSON.stringify({
          operacionId,
          accion: 'evaluar_comite',
          ...evaluacionData
        })
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Evaluación registrada:', result.message);
    } catch (error) {
      console.error('Error en evaluación del comité:', error);
      throw error;
    }
  }

  /**
   * Obtener definición de pasos del workflow
   */
  static async getPasosWorkflow(): Promise<any> {
    try {
      const response = await fetch(`${environment.apiBaseUrl}/integra-co-workflow`, {
        method: 'GET',
        headers: supabaseHeaders
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error obteniendo pasos del workflow:', error);
      throw error;
    }
  }
}