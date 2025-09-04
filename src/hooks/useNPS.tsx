/**
 * Hook para manejar la lógica de NPS contextual
 * Incluye triggers automáticos, envío de respuestas y prevención de spam
 */

import { useState, useEffect, useCallback } from 'react';
import { environment, supabaseHeaders } from '../config/environment';
import { useAuth } from './useAuth';

// Tipos para el sistema NPS
export interface NPSFormData {
  nps_score: number;
  financing_rating?: number;
  supplier_rating?: number;
  communication_rating?: number;
  payment_timing?: string;
  negotiation_support?: string;
  qualitative_feedback?: string;
  improvement_suggestions?: string;
}

export interface NPSTrigger {
  operation_id: string;
  stage: 'inicio' | 'mediados' | 'final';
  progress_percentage: number;
  triggered_at: string;
  responded_at?: string;
}

export interface NPSResponse {
  id: string;
  operation_id: string;
  client_id: string;
  stage: 'inicio' | 'mediados' | 'final';
  progress_percentage: number;
  nps_score: number;
  financing_rating?: number;
  supplier_rating?: number;
  communication_rating?: number;
  payment_timing?: string;
  negotiation_support?: string;
  qualitative_feedback?: string;
  improvement_suggestions?: string;
  country: 'COL' | 'MEX';
  submitted_at: string;
}

export interface UseNPSProps {
  operationId: string;
  clientId: string;
  country: 'COL' | 'MEX';
  currentProgress: number;
}

export const useNPS = ({ operationId, clientId, country, currentProgress }: UseNPSProps) => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStage, setCurrentStage] = useState<'inicio' | 'mediados' | 'final' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [triggers, setTriggers] = useState<NPSTrigger[]>([]);
  const [responses, setResponses] = useState<NPSResponse[]>([]);

  // 🚫 RESTRICCIÓN: Solo activar NPS para clientes, NO para administradores
  const isNPSEnabled = user?.role !== 'administrator';

  // Determinar etapa basada en progreso
  const getStageFromProgress = (progress: number): 'inicio' | 'mediados' | 'final' | null => {
    if (progress >= 16.67 && progress < 50) return 'inicio';
    if (progress >= 50 && progress < 100) return 'mediados';
    if (progress >= 100) return 'final';
    return null;
  };

  // Verificar si ya se envió trigger para esta etapa
  const shouldTriggerNPS = useCallback(async (stage: 'inicio' | 'mediados' | 'final'): Promise<boolean> => {
    try {
      const response = await fetch(`${environment.apiBaseUrl}/nps-manager?action=check-trigger&operation_id=${operationId}&stage=${stage}`, {
        method: 'GET',
        headers: supabaseHeaders
      });

      if (!response.ok) {
        throw new Error('Error verificando triggers NPS');
      }

      const result = await response.json();
      return result.shouldTrigger || false;
    } catch (error) {
      console.error('Error verificando trigger NPS:', error);
      return false;
    }
  }, [operationId]);

  // Crear trigger en la base de datos
  const createTrigger = useCallback(async (stage: 'inicio' | 'mediados' | 'final', progress: number) => {
    try {
      const response = await fetch(`${environment.apiBaseUrl}/nps-manager?action=create-trigger`, {
        method: 'POST',
        headers: supabaseHeaders,
        body: JSON.stringify({
          operation_id: operationId,
          stage,
          progress_percentage: progress
        })
      });

      if (!response.ok) {
        throw new Error('Error creando trigger NPS');
      }

      const result = await response.json();
      if (result.success && result.data) {
        setTriggers(prev => [...prev, result.data]);
        return result.data;
      }
      throw new Error(result.message || 'Error creando trigger');
    } catch (error) {
      console.error('Error creando trigger NPS:', error);
      throw error;
    }
  }, [operationId]);

  // Enviar respuesta NPS
  const submitNPSResponse = useCallback(async (data: NPSFormData): Promise<void> => {
    if (!currentStage) {
      throw new Error('No hay etapa definida para enviar NPS');
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${environment.apiBaseUrl}/nps-manager?action=submit-response`, {
        method: 'POST',
        headers: supabaseHeaders,
        body: JSON.stringify({
          operation_id: operationId,
          client_id: clientId,
          stage: currentStage,
          progress_percentage: currentProgress,
          country,
          ...data
        })
      });

      if (!response.ok) {
        throw new Error('Error enviando respuesta NPS');
      }

      const result = await response.json();
      if (result.success && result.data) {
        setResponses(prev => [...prev, result.data]);
        console.log(`✅ [NPS] Respuesta enviada exitosamente - Etapa: ${currentStage}, Score: ${data.nps_score}`);
      } else {
        throw new Error(result.error || 'Error enviando respuesta');
      }

    } catch (error) {
      console.error('Error enviando respuesta NPS:', error);
      setError('Error enviando tu respuesta. Por favor intenta de nuevo.');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [operationId, clientId, currentStage, currentProgress, country]);

  // Generar alerta para detractores
  const generateDetractorAlert = async (score: number, stage: string) => {
    try {
      // Aquí podrías integrar con un sistema de notificaciones
      console.warn(`🚨 [NPS ALERT] Cliente detractor detectado - Score: ${score}, Etapa: ${stage}, Operación: ${operationId}`);
      
      // Ejemplo de integración futura:
      // await notificationService.sendAlert({
      //   type: 'nps_detractor',
      //   operation_id: operationId,
      //   score,
      //   stage,
      //   priority: 'high'
      // });
    } catch (error) {
      console.error('Error generando alerta detractor:', error);
    }
  };

  // Cargar triggers y respuestas existentes
  const loadNPSData = useCallback(async () => {
    try {
      // Cargar triggers
      const triggersResponse = await fetch(`${environment.apiBaseUrl}/nps-manager?action=get-triggers&operation_id=${operationId}`, {
        method: 'GET',
        headers: supabaseHeaders
      });

      if (triggersResponse.ok) {
        const triggersResult = await triggersResponse.json();
        if (triggersResult.success) {
          setTriggers(triggersResult.data);
        }
      }

      // Cargar respuestas
      const responsesResponse = await fetch(`${environment.apiBaseUrl}/nps-manager?action=get-responses&operation_id=${operationId}`, {
        method: 'GET',
        headers: supabaseHeaders
      });

      if (responsesResponse.ok) {
        const responsesResult = await responsesResponse.json();
        if (responsesResult.success) {
          setResponses(responsesResult.data);
        }
      }
    } catch (error) {
      console.error('Error cargando datos NPS:', error);
    }
  }, [operationId]);

  // Evaluar si se debe mostrar modal NPS
  useEffect(() => {
    const evaluateNPSTrigger = async () => {
      // 🚫 RESTRICCIÓN: No ejecutar NPS para administradores
      if (!isNPSEnabled) {
        console.log(`🚫 [NPS DEBUG] NPS deshabilitado para usuario administrador`);
        return;
      }

      console.log(`🔍 [NPS DEBUG] Evaluando trigger - operationId: ${operationId}, currentProgress: ${currentProgress}`);
      
      const stage = getStageFromProgress(currentProgress);
      console.log(`🔍 [NPS DEBUG] Etapa calculada: ${stage} para progreso ${currentProgress}%`);
      
      if (!stage) {
        console.log(`⚠️ [NPS DEBUG] No hay etapa válida para progreso ${currentProgress}%`);
        return;
      }

      // Verificar si ya se disparó para esta etapa
      console.log(`🔍 [NPS DEBUG] Verificando si debe dispararse trigger para etapa: ${stage}`);
      const shouldTrigger = await shouldTriggerNPS(stage);
      console.log(`🔍 [NPS DEBUG] ¿Debe dispararse? ${shouldTrigger}`);
      
      if (shouldTrigger) {
        try {
          console.log(`🔍 [NPS DEBUG] Creando trigger para etapa: ${stage}`);
          await createTrigger(stage, currentProgress);
          setCurrentStage(stage);
          setIsModalOpen(true);
          
          console.log(`📊 [NPS] Trigger activado - Etapa: ${stage}, Progreso: ${currentProgress}%`);
          console.log(`📊 [NPS DEBUG] Estados después del trigger - isModalOpen: true, currentStage: ${stage}`);
        } catch (error) {
          console.error('❌ [NPS DEBUG] Error activando trigger NPS:', error);
        }
      } else {
        console.log(`ℹ️ [NPS DEBUG] Trigger ya existe para etapa ${stage}, no se mostrará modal`);
      }
    };

    if (operationId && currentProgress > 0) {
      console.log(`🔍 [NPS DEBUG] Condiciones cumplidas - operationId: ${operationId}, currentProgress: ${currentProgress}`);
      evaluateNPSTrigger();
    } else {
      console.log(`⚠️ [NPS DEBUG] Condiciones no cumplidas - operationId: ${operationId}, currentProgress: ${currentProgress}`);
    }
  }, [operationId, currentProgress, shouldTriggerNPS, createTrigger, isNPSEnabled]);

  // Cargar datos al montar el componente
  useEffect(() => {
    if (operationId && isNPSEnabled) {
      loadNPSData();
    }
  }, [operationId, loadNPSData, isNPSEnabled]);

  // Cerrar modal
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setCurrentStage(null);
    setError(null);
  }, []);

  // Obtener estadísticas NPS para esta operación
  const getNPSStats = useCallback(() => {
    const totalResponses = responses.length;
    if (totalResponses === 0) return null;

    const averageScore = responses.reduce((sum, r) => sum + r.nps_score, 0) / totalResponses;
    const promoters = responses.filter(r => r.nps_score >= 9).length;
    const passives = responses.filter(r => r.nps_score >= 7 && r.nps_score <= 8).length;
    const detractors = responses.filter(r => r.nps_score <= 6).length;
    
    const npsScore = totalResponses > 0 ? ((promoters - detractors) / totalResponses) * 100 : 0;

    return {
      totalResponses,
      averageScore: Math.round(averageScore * 10) / 10,
      npsScore: Math.round(npsScore),
      distribution: {
        promoters,
        passives,
        detractors
      }
    };
  }, [responses]);

  return {
    // Estados
    isModalOpen,
    currentStage,
    isSubmitting,
    error,
    triggers,
    responses,
    isNPSEnabled,

    // Funciones
    submitNPSResponse,
    closeModal,
    loadNPSData,
    getNPSStats,

    // Helpers
    getStageFromProgress
  };
};