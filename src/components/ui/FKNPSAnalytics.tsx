/**
 * Dashboard de Analytics NPS para administradores
 * Muestra métricas, tendencias y alertas del sistema NPS
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  AlertTriangle, 
  Star,
  MessageSquare,
  Filter,
  Download,
  RefreshCw,
  X,
  Eye
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { environment, supabaseHeaders } from '../../config/environment';

// Tipos para analytics
interface NPSMetrics {
  totalResponses: number;
  npsScore: number;
  averageRating: number;
  responseRate: number;
  promoters: number;
  passives: number;
  detractors: number;
}

interface StageMetrics {
  inicio: NPSMetrics;
  mediados: NPSMetrics;
  final: NPSMetrics;
}

interface CountryMetrics {
  COL: NPSMetrics;
  MEX: NPSMetrics;
}

interface ClienteCompleto {
  id?: string;
  nombre: string;
  nit: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  pais?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any; 
}

interface RecentResponse {
  id: string;
  operation_id: string;
  client_id: string;
  stage: string;
  nps_score: number;
  country: string;
  submitted_at: string;
  qualitative_feedback?: string;
  improvement_suggestions?: string;
  internal_notes?: string;
  operaciones?: {
    id: string;
    cliente_id: string;
    clientes: ClienteCompleto;
  };
}

interface FKNPSAnalyticsProps {
  className?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

// Helper function para extraer datos del cliente
const getClientData = (response: RecentResponse) => {
  // Acceso directo a través de operaciones -> clientes
  const cliente = response.operaciones?.clientes;
  
  // Extraer el NIT y el nombre, proporcionando valores por defecto si no existen
  const nombreValue = cliente?.nombre || 'Cliente sin nombre';
  const nitValue = cliente?.nit;

  // Lógica de validación para el NIT:
  // 1. Si nitValue existe, es una cadena, y no está en blanco (después de trim), lo usamos.
  // 2. Si no, usamos el response.client_id como fallback.
  // 3. Si response.client_id tampoco existe, mostramos 'Sin NIT'.
  const displayNit = nitValue && typeof nitValue === 'string' && nitValue.trim() !== '' && nitValue !== '-' ? nitValue : (response.client_id || 'Sin NIT');
  
  return {
    nombre: nombreValue,
    nit: displayNit
  };
};

const FKNPSAnalytics: React.FC<FKNPSAnalyticsProps> = ({ 
  className,
  dateRange
}) => {
  // Memoizar el rango de fechas por defecto para evitar recreaciones
  const defaultDateRange = useMemo(() => ({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 días atrás
    to: new Date()
  }), []);

  const effectiveDateRange = dateRange || defaultDateRange;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generalMetrics, setGeneralMetrics] = useState<NPSMetrics | null>(null);
  const [stageMetrics, setStageMetrics] = useState<StageMetrics | null>(null);
  const [countryMetrics, setCountryMetrics] = useState<CountryMetrics | null>(null);
  const [recentResponses, setRecentResponses] = useState<RecentResponse[]>([]);
  const [detractorAlerts, setDetractorAlerts] = useState<RecentResponse[]>([]);
  const [selectedResponse, setSelectedResponse] = useState<RecentResponse | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Cargar datos de analytics
  const loadAnalytics = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Construir parámetros para la función Edge
      const fromDate = effectiveDateRange.from.toISOString();
      const toDate = effectiveDateRange.to.toISOString();
      
      let analyticsUrl = `${environment.apiBaseUrl}/nps-manager?action=get-analytics`;
      analyticsUrl += `&date_from=${encodeURIComponent(fromDate)}`;
      analyticsUrl += `&date_to=${encodeURIComponent(toDate)}`;

      // Cargar analytics usando la función Edge
      const response = await fetch(analyticsUrl, {
        method: 'GET',
        headers: supabaseHeaders
      });

      if (!response.ok) {
        throw new Error('Error cargando datos de NPS');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Error en la respuesta del servidor');
      }

      const { analytics, responses } = result.data;
      
      // DEBUG: Ver estructura completa de los datos
      console.log('🔍 [NPS-FRONTEND-DEBUG] Datos completos recibidos:', result.data);
      console.log('🔍 [NPS-FRONTEND-DEBUG] Respuestas recientes:', analytics.recentResponses);
      
      if (analytics.recentResponses && analytics.recentResponses.length > 0) {
        analytics.recentResponses.slice(0, 3).forEach((response, index) => {
          console.log(`🔍 [NPS-FRONTEND-DEBUG] Registro ${index + 1}:`);
          console.log(`- Operation ID: ${response.operation_id}`);
          console.log(`- Client ID: ${response.client_id}`);
          console.log('- operaciones:', response.operaciones);
          
          if (response.operaciones) {
            console.log(`  - operaciones.id: ${response.operaciones.id}`);
            console.log(`  - operaciones.cliente_id: ${response.operaciones.cliente_id}`);
            console.log('  - clientes:', response.operaciones.clientes);
            
            if (response.operaciones.clientes) {
              console.log(`    - clientes.id: ${response.operaciones.clientes.id}`);
              console.log(`    - clientes.nombre: "${response.operaciones.clientes.nombre}"`);
              console.log(`    - clientes.nit: "${response.operaciones.clientes.nit}"`);
            } else {
              console.log('    ❌ NO HAY DATOS DE CLIENTES');
            }
          } else {
            console.log('  ❌ NO HAY DATOS DE OPERACIONES');
          }
          
          // Probar la función helper
          const clientData = getClientData(response);
          console.log(`  - Helper result: nombre="${clientData.nombre}", nit="${clientData.nit}"`);
          console.log('---');
        });
      }
      
      // Establecer datos calculados desde el backend
      setGeneralMetrics(analytics.general);
      setStageMetrics(analytics.byStage);
      setCountryMetrics(analytics.byCountry);
      setRecentResponses(analytics.recentResponses || []);
      setDetractorAlerts(analytics.detractorAlerts || []);

      console.log(`📊 [NPS ANALYTICS] Cargados ${responses?.length || 0} registros del período`);

    } catch (err) {
      console.error('Error cargando analytics NPS:', err);
      setError('Error cargando los datos de analytics');
    } finally {
      setIsLoading(false);
    }
  }, [effectiveDateRange.from, effectiveDateRange.to]);

  // Calcular métricas a partir de respuestas
  const calculateMetrics = (responses: RecentResponse[]): NPSMetrics => {
    if (responses.length === 0) {
      return {
        totalResponses: 0,
        npsScore: 0,
        averageRating: 0,
        responseRate: 0,
        promoters: 0,
        passives: 0,
        detractors: 0
      };
    }

    const promoters = responses.filter(r => r.nps_score >= 9).length;
    const passives = responses.filter(r => r.nps_score >= 7 && r.nps_score <= 8).length;
    const detractors = responses.filter(r => r.nps_score <= 6).length;
    const totalResponses = responses.length;

    const npsScore = totalResponses > 0 ? ((promoters - detractors) / totalResponses) * 100 : 0;
    const averageRating = responses.reduce((sum, r) => sum + r.nps_score, 0) / totalResponses;

    return {
      totalResponses,
      npsScore: Math.round(npsScore),
      averageRating: Math.round(averageRating * 10) / 10,
      responseRate: 85, // TODO: Calcular desde triggers vs responses
      promoters,
      passives,
      detractors
    };
  };

  // Cargar datos al montar y cuando cambia el rango de fechas
  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]); 

  if (isLoading) {
    return (
      <div className={cn("p-6", className)}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("p-6", className)}>
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error de Carga</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadAnalytics}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("p-6 space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics NPS</h2>
          <p className="text-gray-600">
            Período: {effectiveDateRange.from.toLocaleDateString()} - {effectiveDateRange.to.toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadAnalytics}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            <Download className="h-4 w-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Métricas Generales */}
      {generalMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* NPS Score */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">NPS Score</p>
                <p className={cn(
                  "text-2xl font-bold mt-1",
                  generalMetrics.npsScore >= 50 ? "text-green-600" :
                  generalMetrics.npsScore >= 0 ? "text-yellow-600" : "text-red-600"
                )}>
                  {generalMetrics.npsScore}
                </p>
              </div>
              {generalMetrics.npsScore >= 0 ? 
                <TrendingUp className="h-8 w-8 text-green-500" /> : 
                <TrendingDown className="h-8 w-8 text-red-500" />
              }
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {generalMetrics.npsScore >= 50 ? "Excelente" :
                generalMetrics.npsScore >= 0 ? "Bueno" : "Necesita mejora"}
            </p>
          </div>

          {/* Total Respuestas */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Respuestas Totales</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {generalMetrics.totalResponses}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Tasa de respuesta: {generalMetrics.responseRate}%
            </p>
          </div>

          {/* Rating Promedio */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rating Promedio</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {generalMetrics.averageRating}/10
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Calificación general de clientes
            </p>
          </div>

          {/* Detractores Activos */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Detractores</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {generalMetrics.detractors}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Requieren seguimiento inmediato
            </p>
          </div>
        </div>
      )}

      {/* Distribución por Etapas y Países */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Métricas por Etapa */}
        {stageMetrics && (
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas por Etapa</h3>
            <div className="space-y-4">
              {Object.entries(stageMetrics).map(([stage, metrics]) => (
                <div key={stage} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 capitalize">{stage}</p>
                    <p className="text-sm text-gray-600">
                      {metrics.totalResponses} respuestas • NPS: {metrics.npsScore}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{metrics.averageRating}/10</p>
                    <div className="flex space-x-1 text-xs">
                      <span className="text-green-600">P:{metrics.promoters}</span>
                      <span className="text-yellow-600">N:{metrics.passives}</span>
                      <span className="text-red-600">D:{metrics.detractors}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Métricas por País */}
        {countryMetrics && (
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas por País</h3>
            <div className="space-y-4">
              {Object.entries(countryMetrics).map(([country, metrics]) => (
                <div key={country} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {country === 'COL' ? '🇨🇴 Colombia' : '🇲🇽 México'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {metrics.totalResponses} respuestas • NPS: {metrics.npsScore}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{metrics.averageRating}/10</p>
                    <div className="flex space-x-1 text-xs">
                      <span className="text-green-600">P:{metrics.promoters}</span>
                      <span className="text-yellow-600">N:{metrics.passives}</span>
                      <span className="text-red-600">D:{metrics.detractors}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Alertas de Detractores */}
      {detractorAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertas Detractores - Requieren Seguimiento
          </h3>
          <div className="space-y-3">
            {detractorAlerts.map((alert) => (
              <div 
                key={alert.id} 
                className="bg-white p-4 rounded-lg border border-red-200 cursor-pointer hover:bg-red-25 hover:shadow-md transition-all duration-200"
                onClick={() => {
                  setSelectedResponse(alert);
                  setShowModal(true);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {(() => {
                        const clientData = getClientData(alert);
                        return (
                          <>
                            {clientData.nombre}
                            <span className="text-sm text-gray-600 ml-2">
                              • NIT: {clientData.nit}
                            </span>
                          </>
                        );
                      })()}
                    </p>
                    <p className="text-sm text-gray-600 capitalize">
                      Etapa: {alert.stage} • País: {alert.country === 'COL' ? 'Colombia' : 'México'}
                    </p>
                    {alert.qualitative_feedback && (
                      <p className="text-sm text-gray-700 mt-2 italic">
                        "{alert.qualitative_feedback.substring(0, 100)}..."
                      </p>
                    )}
                  </div>
                  <div className="ml-4 text-right flex flex-col items-center">
                    <span className="text-2xl font-bold text-red-600">{alert.nps_score}</span>
                    <p className="text-xs text-gray-500">
                      {new Date(alert.submitted_at).toLocaleDateString()}
                    </p>
                    <Eye className="h-4 w-4 text-gray-400 mt-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Respuestas Recientes */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Respuestas Recientes</h3>
        </div>
        <div className="p-6">
          {recentResponses.length > 0 ? (
            <div className="space-y-4">
              {recentResponses.map((response) => (
                <div key={response.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {(() => {
                        const clientData = getClientData(response);
                        return (
                          <>
                            {clientData.nombre}
                            <span className="text-sm text-gray-600 ml-2">
                              • NIT: {clientData.nit}
                            </span>
                          </>
                        );
                      })()}
                    </p>
                    <p className="text-sm text-gray-600 capitalize">
                      {response.stage} • {response.country === 'COL' ? 'Colombia' : 'México'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "text-2xl font-bold",
                      response.nps_score >= 9 ? "text-green-600" :
                      response.nps_score >= 7 ? "text-yellow-600" : "text-red-600"
                    )}>
                      {response.nps_score}
                    </span>
                    <div className="text-xs text-gray-500 text-right">
                      <p>{new Date(response.submitted_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No hay respuestas en el período seleccionado</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal para mostrar detalles completos de respuesta NPS */}
      {showModal && selectedResponse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Detalles de Respuesta NPS
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedResponse(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 space-y-6">
              {/* Información del Cliente */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Información del Cliente</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Cliente:</span> {(() => {
                    const clientData = getClientData(selectedResponse);
                    return clientData.nombre;
                  })()}</p>
                  <p><span className="font-medium">NIT:</span> {(() => {
                    const clientData = getClientData(selectedResponse);
                    return clientData.nit;
                  })()}</p>
                  <p><span className="font-medium">Etapa:</span> <span className="capitalize">{selectedResponse.stage}</span></p>
                  <p><span className="font-medium">País:</span> {selectedResponse.country === 'COL' ? 'Colombia' : 'México'}</p>
                  <p><span className="font-medium">Fecha:</span> {new Date(selectedResponse.submitted_at).toLocaleDateString('es-CO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                </div>
              </div>

              {/* Puntuación NPS */}
              <div className="bg-red-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Puntuación NPS</h3>
                <div className="flex items-center space-x-4">
                  <span className="text-4xl font-bold text-red-600">{selectedResponse.nps_score}</span>
                  <div>
                    <p className="text-sm text-gray-600">Clasificación:</p>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      {selectedResponse.nps_score <= 6 ? 'Detractor' : 
                       selectedResponse.nps_score <= 8 ? 'Pasivo' : 'Promotor'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Feedback Cualitativo */}
              {selectedResponse.qualitative_feedback && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Comentarios del Cliente</h3>
                  <div className="bg-white rounded border p-4">
                    <p className="text-gray-700 italic">"{selectedResponse.qualitative_feedback}"</p>
                  </div>
                </div>
              )}

              {/* Sugerencias de Mejora del Cliente */}
              {selectedResponse.improvement_suggestions && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Sugerencias de Mejora del Cliente</h3>
                  <div className="bg-white rounded border p-4">
                    <p className="text-gray-700 italic">"{selectedResponse.improvement_suggestions}"</p>
                  </div>
                </div>
              )}

              {/* Sugerencias Internas */}
              {selectedResponse.internal_notes && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Notas Internas / Sugerencias</h3>
                  <div className="bg-white rounded border p-4">
                    <p className="text-gray-700">{selectedResponse.internal_notes}</p>
                  </div>
                </div>
              )}

              {/* Recomendaciones de Acción */}
              {selectedResponse.nps_score <= 6 && (
                <div className="bg-orange-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Acciones Recomendadas</h3>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li className="flex items-start space-x-2">
                      <span className="text-orange-600">•</span>
                      <span>Contactar al cliente dentro de las próximas 24 horas</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-orange-600">•</span>
                      <span>Investigar las causas específicas de insatisfacción</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-orange-600">•</span>
                      <span>Desarrollar plan de mejora personalizado</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-orange-600">•</span>
                      <span>Hacer seguimiento en 1-2 semanas</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedResponse(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FKNPSAnalytics;