import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Building,
  DollarSign,
  Calendar,
  MapPin,
  Truck,
  Edit,
  CheckCircle,
  Clock,
  Circle,
  User,
  Package,
  CreditCard,
  AlertCircle,
  ExternalLink,
  Copy,
  Share2,
  MoreHorizontal,
  RefreshCw,
  Landmark,
  FileCheck
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useOperationNotifications } from '../../hooks/useNotifications';
import { useOperationDetail, BackendOperationDetail } from '../../hooks/useOperationDetail';
import { cn } from '../../utils/cn';
import { formatPagaIds } from '../../utils/filterPagaIds';
import FKDocumentsTab from './FKDocumentsTab';
import FKFinancialTimeline from './FKFinancialTimeline';
import FKNPSModal from './FKNPSModal';
import { useNPS } from '../../hooks/useNPS';


// Status configuration
const STATUS_CONFIG = {
  completed: {
    icon: CheckCircle,
    color: 'text-success-600 bg-success-100',
    label: 'Completado'
  },
  current: {
    icon: Clock,
    color: 'text-coral-600 bg-coral-100',
    label: 'En Progreso'
  },
  pending: {
    icon: Circle,
    color: 'text-gray-500 bg-gray-100',
    label: 'Pendiente'
  }
} as const;

interface FKOperationDetailProps {
  operationId: string;
  onBack?: () => void;
  className?: string;
}

export default function FKOperationDetail({ 
  operationId, 
  onBack, 
  className 
}: FKOperationDetailProps) {
  const { user, hasPermission } = useAuth();
  const { notifyOperationSuccess, notifyOperationError } = useOperationNotifications();
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'financial' | 'provider' | 'documents'>('overview');

  // Use optimized hook for single operation
  const { operation, isLoading, error, refetch } = useOperationDetail(operationId);

  // 📊 OBTENER PROGRESO: Primero del backend, luego calcular del timeline
  const getOperationProgress = (): number => {
    // Primero intentar usar el progreso del backend
    if (operation?.progresoGeneral !== undefined && operation?.progresoGeneral !== null) {
      console.log(`📊 Usando progreso del backend: ${operation.progresoGeneral}%`);
      return operation.progresoGeneral;
    }

    // Si no hay progreso en backend, calcular desde el timeline
    if (operation?.timeline && operation.timeline.length > 0) {
      const completedSteps = operation.timeline.filter(step => step.estado === 'completado').length;
      const totalSteps = operation.timeline.length;
      const calculatedProgress = Math.round((completedSteps / totalSteps) * 100);
      console.log(`📊 Progreso calculado desde timeline: ${calculatedProgress}%`);
      return calculatedProgress;
    }

    return 0;
  };

  // Usar progreso del backend o calculado
  const realProgress = getOperationProgress();

  // 🆕 Sistema NPS integrado
  const nps = useNPS({
    operationId: operationId,
    clientId: operation?.clienteNit || '',
    country: (() => {
      const pais = operation?.paisImportador?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return (pais === 'colombia') ? 'COL' : 'MEX';
    })(),
    currentProgress: realProgress // 🔄 USAR PROGRESO REAL EN LUGAR DEL DEL BACKEND
  });

  // 🔍 Debug para verificar estado del modal
  React.useEffect(() => {
    console.log(`🎭 [MODAL STATE] Modal state changed:`, {
      isModalOpen: nps.isModalOpen,
      currentStage: nps.currentStage,
      operationId
    });
  }, [nps.isModalOpen, nps.currentStage, operationId]);

  // Handle status update
  const handleStatusUpdate = (newStatus: string) => {
    if (!operation) return;
    
    // In a real app, this would make an API call
    notifyOperationSuccess(operationId, `Estado actualizado a ${newStatus}`);
  };

  if (isLoading) {
    return (
      <div className={cn("p-6", className)}>
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
            <div className="flex-1">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && !isLoading) {
    return (
      <div className={cn("p-6", className)}>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error al Cargar la Operación
          </h3>
          <p className="text-gray-600 mb-4">
            {error}
          </p>
          <div className="flex gap-2 justify-center">
            {onBack && (
              <button
                onClick={onBack}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al Panel
              </button>
            )}
            <button
              onClick={refetch}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("p-6 space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Volver"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-primary-700">
              {operation.clienteCompleto}
            </h1>
            {operation.clienteNit && (
              <span className={cn(
                "inline-block text-sm font-mono px-3 py-1 rounded-full mt-1",
                // RFC mexicano (formato alfanumérico)
                (() => {
                  const cleanNit = operation.clienteNit.trim().toUpperCase();
                  const isRFC = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/.test(cleanNit);
                  return isRFC ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700";
                })()
              )}>
                {(() => {
                  const cleanNit = operation.clienteNit.trim().toUpperCase();
                  const isRFC = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/.test(cleanNit);
                  return isRFC ? `RFC: ${operation.clienteNit}` : `NIT: ${operation.clienteNit}`;
                })()}
              </span>
            )}
            <div className="text-gray-600 mt-1">
              <span>Proveedor: {operation.proveedorBeneficiario}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Compartir"
          >
            <Share2 className="h-5 w-5 text-gray-600" />
          </button>
          <div className="relative">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreHorizontal className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Status and Progress */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              realProgress >= 100 ? 'bg-success-100' :
              realProgress > 0 ? 'bg-primary-100' : 'bg-gray-100'
            )}>
              <Package className={cn(
                "h-5 w-5",
                realProgress >= 100 ? 'text-success-600' :
                realProgress > 0 ? 'text-primary-600' : 'text-gray-600'
              )} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Estado Actual</h3>
              <p className="text-sm text-gray-600">
                {realProgress >= 100 ? 'Completada' :
                 realProgress > 0 ? 'En Progreso' :
                 'Borrador'}
              </p>
              {operation.timeline && operation.timeline.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Estado actual: {operation.timeline.find(t => t.estado === 'en_proceso')?.fase || 'N/A'}
                </p>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              {realProgress}%
            </p>
            <p className="text-sm text-gray-600">Completado</p>
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-primary-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${realProgress}%` }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Resumen', icon: Building },
              { id: 'timeline', label: 'Cronograma', icon: Clock },
              { id: 'financial', label: 'Timeline Financiero', icon: DollarSign },
              { id: 'documents', label: 'Documentos', icon: FileCheck },
              { id: 'provider', label: 'Proveedor', icon: Landmark }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                    activeTab === tab.id
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <OverviewTab operation={operation} onStatusUpdate={handleStatusUpdate} realProgress={realProgress} />
          )}
          {activeTab === 'timeline' && (
            <TimelineTab operation={operation} realProgress={realProgress} />
          )}
          {activeTab === 'financial' && (
            <FinancialTab operation={operation} nps={nps} operationId={operationId} realProgress={realProgress} />
          )}
          {activeTab === 'documents' && (
            <FKDocumentsTab operation={operation} />
          )}
          {activeTab === 'provider' && (
            <ProviderTab operation={operation} />
          )}
        </div>
      </div>
    </div>
  );
}

// Overview Tab Component
interface OverviewTabProps {
  operation: BackendOperationDetail;
  onStatusUpdate: (status: string) => void;
  realProgress: number;
}

function OverviewTab({ operation, onStatusUpdate, realProgress }: OverviewTabProps) {
  const { hasPermission } = useAuth();

  // Helper function to get assigned person
  const getAssignedPerson = () => {
    return operation.personaAsignada || 'No asignado';
  };

  // Helper function to parse route
  const parseRoute = () => {
    if (operation.rutaComercial && operation.rutaComercial.includes('→')) {
      const [origin, destination] = operation.rutaComercial.split('→').map(s => s.trim());
      return { origin, destination };
    }
    return { origin: operation.paisExportador || 'Origen', destination: operation.paisImportador || 'Colombia' };
  };

  // Helper function to parse Incoterms
  const parseIncoterms = () => {
    if (operation.incoterms && operation.incoterms.includes(' / ')) {
      const [compra, venta] = operation.incoterms.split(' / ').map(s => s.trim());
      return { compra, venta };
    }
    return { compra: operation.incoterms || 'FOB', venta: 'CIF' };
  };

  return (
    <div className="space-y-6">
      {/* Información Básica */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Building className="h-5 w-5 text-primary-600" />
          Información Básica
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-gray-700 mb-2">Cliente Completo</h5>
            <p className="text-lg font-semibold text-gray-900">{operation.clienteCompleto}</p>
            <span className={cn(
              "inline-block text-sm font-mono px-2 py-1 rounded",
              // RFC mexicano (formato alfanumérico)
              (() => {
                const cleanNit = operation.clienteNit.trim().toUpperCase();
                const isRFC = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/.test(cleanNit);
                return isRFC ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700";
              })()
            )}>
              {(() => {
                const cleanNit = operation.clienteNit.trim().toUpperCase();
                const isRFC = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/.test(cleanNit);
                return isRFC ? `RFC: ${operation.clienteNit}` : `NIT: ${operation.clienteNit}`;
              })()}
            </span>
            <p className="text-xs text-gray-500">Tipo: {operation.tipoEmpresa}</p>
            {/* IDs Integra y Paga usando datos reales de Supabase */}
            <div className="mt-3 space-y-1">
              {operation.id_integra && (
                <p className="text-xs text-gray-500">
                  <span className="font-medium">ID Integra:</span> {operation.id_integra}
                </p>
              )}
              {(() => {
                const filteredPagaIds = formatPagaIds(operation.ids_paga);
                return filteredPagaIds && (
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">IDs Paga:</span> {filteredPagaIds}
                  </p>
                );
              })()}
            </div>
          </div>
          <div>
            <h5 className="font-medium text-gray-700 mb-2">Proveedores</h5>
            {/* Mostrar TODOS los proveedores de la operación */}
            {(() => {
              // 🆕 Usar la lista completa de proveedores si está disponible
              if (operation.proveedores && operation.proveedores.length > 0) {
                return (
                  <div className="space-y-2">
                    {operation.proveedores.map((proveedor, index) => (
                      <div key={proveedor.id || index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-400" />
                          <p className="text-sm font-semibold text-gray-900">{proveedor.nombre}</p>
                          {proveedor.pais && (
                            <span className="text-xs text-gray-600">• {proveedor.pais}</span>
                          )}
                        </div>
                        {/* Indicador si tiene pagos */}
                        {proveedor.tiene_pagos && (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                            Con pagos
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                );
              }

              // Fallback: usar la lógica anterior si no hay lista de proveedores
              const proveedoresMap = new Map<string, string>();

              if (operation.proveedorBeneficiario) {
                proveedoresMap.set(operation.proveedorBeneficiario, operation.paisProveedor || '');
              }

              operation.pagosProveedores?.forEach(pago => {
                if (pago.nombre_proveedor) {
                  proveedoresMap.set(pago.nombre_proveedor, '');
                }
              });

              const proveedoresArray = Array.from(proveedoresMap.entries());

              if (proveedoresArray.length === 0) {
                return <p className="text-sm text-gray-500">No especificado</p>;
              }

              return (
                <div className="space-y-2">
                  {proveedoresArray.map(([proveedor, pais], index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-400" />
                      <p className="text-sm font-semibold text-gray-900">{proveedor}</p>
                      {pais && (
                        <span className="text-xs text-gray-600">• {pais}</span>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
          <div>
            <h5 className="font-medium text-gray-700 mb-2">Valores Financieros</h5>
            <div className="space-y-3">
              {/* Valor Total Operación - PRIMERO Y MÁS PROMINENTE */}
              <div>
                <p className="text-2xl font-bold text-primary-600 break-words">
                  ${operation.valorTotal?.toLocaleString() || '0'} {operation.moneda || 'USD'}
                </p>
                <p className="text-sm text-gray-600 font-medium">Valor Total Operación</p>
              </div>
              {/* Valor Compra Mercancía - Segundo */}
              <div>
                <p className="text-lg font-semibold text-gray-700 break-words">
                  {operation.valorOperacion ? 
                    `$${operation.valorOperacion.toLocaleString()} ${operation.moneda || 'USD'}` : 
                    'No especificado'
                  }
                </p>
                <p className="text-xs text-gray-500">Valor compra mercancía</p>
              </div>
              {/* 🆕 Resumen de Negociación con Proveedores */}
              {operation.pagosProveedores && operation.pagosProveedores.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <h6 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-600" />
                    Resumen de Negociación con Proveedores
                  </h6>
                  <div className="space-y-2">
                    {(() => {
                      // Agrupar pagos por proveedor para mostrar resumen
                      const proveedoresMap = new Map<string, any[]>();

                      operation.pagosProveedores.forEach(pago => {
                        const nombreProveedor = pago.nombre_proveedor || operation.proveedorBeneficiario || 'Proveedor';
                        if (!proveedoresMap.has(nombreProveedor)) {
                          proveedoresMap.set(nombreProveedor, []);
                        }
                        proveedoresMap.get(nombreProveedor)?.push(pago);
                      });

                      return Array.from(proveedoresMap.entries()).map(([proveedor, pagos], idx) => {
                        // Tomar el valor total de compra del primer pago (todos deberían tener el mismo valor para el mismo proveedor)
                        const valorTotalCompra = pagos[0]?.valor_total_compra || 0;
                        const moneda = pagos[0]?.moneda || 'USD';
                        const terminosPago = pagos[0]?.terminos_pago;
                        const otrosTerminosPago = pagos[0]?.otros_terminos_pago;

                        // Calcular el total de pagos solicitados y número de giros
                        const totalPagosRealizados = pagos.reduce((sum, p) => sum + (p.valor_pagado || 0), 0);
                        const numeroPagos = pagos.length;
                        const pagosCompletados = pagos.filter(p => p.estado === 'completado').length;

                        return (
                          <div key={idx} className="bg-gray-50 rounded-md p-3 border-l-4 border-blue-400">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Building className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm font-semibold text-gray-900">
                                    {proveedor}
                                  </span>
                                </div>

                                {/* Valor Total de Compra */}
                                <div className="mb-2">
                                  <p className="text-xs text-gray-600">Valor Total de Compra:</p>
                                  <p className="text-xl font-bold text-primary-700">
                                    ${valorTotalCompra?.toLocaleString() || '0'} {moneda}
                                  </p>
                                </div>

                                {/* Resumen de Pagos */}
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span>
                                    <span className="font-medium">{numeroPagos}</span> giro{numeroPagos !== 1 ? 's' : ''} programado{numeroPagos !== 1 ? 's' : ''}
                                  </span>
                                  <span className="text-gray-400">•</span>
                                  <span>
                                    <span className="font-medium">${totalPagosRealizados.toLocaleString()}</span> {moneda} solicitados
                                  </span>
                                  {pagosCompletados > 0 && (
                                    <>
                                      <span className="text-gray-400">•</span>
                                      <span className="text-green-600">
                                        <span className="font-medium">{pagosCompletados}</span> pago{pagosCompletados !== 1 ? 's' : ''} completado{pagosCompletados !== 1 ? 's' : ''}
                                      </span>
                                    </>
                                  )}
                                </div>

                                {/* Términos de Negociación */}
                                {(terminosPago || otrosTerminosPago) && (
                                  <div className="mt-2 p-2 bg-blue-50 rounded-md">
                                    <p className="text-xs font-semibold text-blue-900 mb-1">
                                      Términos de Negociación:
                                    </p>
                                    {terminosPago && terminosPago !== '-' && (
                                      <p className="text-xs text-blue-800">
                                        <span className="font-medium">Términos:</span> {terminosPago}
                                      </p>
                                    )}
                                    {otrosTerminosPago && otrosTerminosPago !== '-' && (
                                      <p className="text-xs text-blue-800 mt-1">
                                        <span className="font-medium">Otros términos:</span> {otrosTerminosPago}
                                      </p>
                                    )}
                                  </div>
                                )}
                          </div>
                        </div>
                      </div>
                        );
                      });
                    })()}
                  </div>
                  {/* Total por moneda */}
                  <div className="mt-3 pt-2 border-t border-gray-200">
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">Total pagos:</span> {' '}
                      {(() => {
                        const totalPorMoneda = operation.pagosProveedores.reduce((acc, pago) => {
                          const moneda = pago.moneda || 'USD';
                          acc[moneda] = (acc[moneda] || 0) + (pago.valor_pagado || 0);
                          return acc;
                        }, {} as Record<string, number>);

                        return Object.entries(totalPorMoneda).map(([moneda, total]) => 
                          `$${total.toLocaleString()} ${moneda}`
                        ).join(' • ');
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div>
            <h5 className="font-medium text-gray-700 mb-2">Progreso General Detallado</h5>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">
                  {realProgress}%
                </span>
                <span className="text-sm text-gray-600">Completado</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${realProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">
                Persona Asignada: <span className="font-medium">{getAssignedPerson()}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Geografía y Logística */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          Geografía y Logística
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-gray-700 mb-2">País Exportador/Importador</h5>
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <span>{parseRoute().origin.toUpperCase()}</span>
              <ArrowRight className="h-4 w-4 text-gray-500" />
              <span>{parseRoute().destination.toUpperCase()}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">Ruta comercial establecida</p>
          </div>
          <div>
            <h5 className="font-medium text-gray-700 mb-2">Incoterms (Compra/Venta)</h5>
            <p className="text-lg font-semibold text-gray-900">
              {operation.incoterms || 'FOB / CIF'}
            </p>
            <p className="text-sm text-gray-600">Términos comerciales internacionales</p>
            <div className="mt-2 text-xs text-gray-500">
              {parseIncoterms().compra && (
                <div>Compra: <span className="font-medium">{parseIncoterms().compra}</span></div>
              )}
              {parseIncoterms().venta && (
                <div>Venta: <span className="font-medium">{parseIncoterms().venta}</span></div>
              )}
            </div>
          </div>
          <div className="md:col-span-2">
            <h5 className="font-medium text-gray-700 mb-2">Ruta Comercial Completa</h5>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="font-medium">{parseRoute().origin}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
                <div className="flex-1 border-t border-dashed border-gray-300 relative">
                  <Truck className="h-4 w-4 text-gray-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white" />
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-success-500 rounded-full"></div>
                  <span className="font-medium">{parseRoute().destination}</span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-4 text-xs text-gray-600">
                <div>Origen: {operation.proveedorBeneficiario}</div>
                <div className="text-center">Transporte marítimo/aéreo</div>
                <div className="text-right">Destino: {operation.clienteCompleto}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nota: Información financiera movida a la pestaña "Timeline Financiero" */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center gap-3">
          <DollarSign className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              💡 Información Financiera Completa
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Para ver el resumen financiero detallado, cronograma de pagos, costos logísticos, y extracostos, 
              visita la pestaña <span className="font-semibold">"Timeline Financiero"</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Timeline Tab Component
interface TimelineTabProps {
  operation: BackendOperationDetail;
  realProgress: number;
}

function TimelineTab({ operation, realProgress }: TimelineTabProps) {
  // Get timeline from operation, or show empty state
  const timeline = operation.timeline;
  
  if (!timeline || !Array.isArray(timeline) || timeline.length === 0) {
    return (
      <div className="space-y-6">
        <h4 className="font-semibold text-gray-900">Cronograma Detallado</h4>
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h5 className="text-lg font-medium text-gray-900 mb-2">
            Sin Datos de Timeline
          </h5>
          <p className="text-gray-600">
            No hay información de cronograma disponible para esta operación.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900">Cronograma Detallado</h4>
        <div className="text-sm text-gray-500">
          Progreso general: <span className="font-medium text-gray-900">{realProgress}%</span>
        </div>
      </div>
      
      <div className="relative">
        {timeline.map((timelineItem, index) => {
          const isLast = index === timeline.length - 1;
          const isCurrent = timelineItem.estado === 'en_proceso';
          
          // Determine status configuration
          let statusConfig;
          if (timelineItem.estado === 'completado') {
            statusConfig = STATUS_CONFIG.completed;
          } else if (timelineItem.estado === 'en_proceso' || isCurrent) {
            statusConfig = STATUS_CONFIG.current;
          } else {
            statusConfig = STATUS_CONFIG.pending;
          }
          
          const StatusIcon = statusConfig.icon;
          
          return (
            <div key={timelineItem.id} className="relative flex items-start pb-8">
              {!isLast && (
                <div className={cn(
                  "absolute left-6 top-12 w-0.5 h-16",
                  timelineItem.estado === 'completado' ? 'bg-success-300' : 'bg-gray-300'
                )} />
              )}
              
              <div className={cn(
                "relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2",
                statusConfig.color.replace('text-', 'border-').replace('bg-', 'border-'),
                statusConfig.color
              )}>
                <StatusIcon className="h-5 w-5" />
              </div>

              <div className="ml-6 flex-1 min-w-0">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-900">{timelineItem.fase}</h5>
                      <p className="text-sm text-gray-600 mt-1">{timelineItem.descripcion}</p>

                      {/* 🆕 Detalle de pagos por proveedor si es la fase de Procesamiento de Pagos */}
                      {(timelineItem.fase.toLowerCase().includes('procesamiento de pago') &&
                        timelineItem.fase.toLowerCase().includes('proveedor')) &&
                       operation.pagosProveedores && operation.pagosProveedores.length > 0 && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-md">
                          <p className="text-xs font-semibold text-blue-900 mb-2">
                            Detalle de Pagos por Proveedor:
                          </p>
                          {(() => {
                            // Agrupar pagos por proveedor
                            const pagosPorProveedor = new Map<string, any[]>();

                            operation.pagosProveedores.forEach(pago => {
                              const nombreProveedor = pago.nombre_proveedor || operation.proveedorBeneficiario || 'Proveedor';
                              if (!pagosPorProveedor.has(nombreProveedor)) {
                                pagosPorProveedor.set(nombreProveedor, []);
                              }
                              pagosPorProveedor.get(nombreProveedor)?.push(pago);
                            });

                            return Array.from(pagosPorProveedor.entries()).map(([proveedor, pagos], idx) => {
                              const pagosCompletados = pagos.filter(p => p.estado === 'completado').length;
                              const totalPagos = pagos.length;

                              return (
                                <div key={idx} className="text-xs text-blue-800 mb-2 pl-2 border-l-2 border-blue-300">
                                  <p className="font-medium">{proveedor}:</p>
                                  <p className="ml-2">
                                    • {pagosCompletados} pago{pagosCompletados !== 1 ? 's' : ''} completado{pagosCompletados !== 1 ? 's' : ''} de {totalPagos} total{totalPagos !== 1 ? 'es' : ''}
                                  </p>
                                  {pagos.map((pago, pagoIdx) => (
                                    <p key={pagoIdx} className="ml-4 text-blue-700">
                                      - Pago #{pago.numero_pago}: ${pago.valor_pagado?.toLocaleString()} {pago.moneda}
                                      <span className={`ml-1 px-1 rounded ${
                                        pago.estado === 'completado' ? 'bg-green-100 text-green-700' :
                                        pago.estado === 'en_proceso' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-gray-100 text-gray-600'
                                      }`}>
                                        {pago.estado === 'completado' ? '✓' :
                                         pago.estado === 'en_proceso' ? '⏳' : '○'}
                                      </span>
                                    </p>
                                  ))}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      )}

                      {timelineItem.notas && (
                        <p className="text-xs text-gray-500 mt-2 italic">{timelineItem.notas}</p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(timelineItem.fecha).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{timelineItem.progreso}% completado</span>
                        </div>
                        {timelineItem.responsable && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{timelineItem.responsable}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className={cn(
                      "ml-4 px-3 py-1 rounded-full text-xs font-medium",
                      timelineItem.estado === 'completado' ? 'bg-success-100 text-success-700' :
                      timelineItem.estado === 'en_proceso' ? 'bg-coral-100 text-coral-700' :
                      timelineItem.estado === 'bloqueado' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    )}>
                      {timelineItem.estado === 'completado' && 'Completado'}
                      {timelineItem.estado === 'en_proceso' && 'En Progreso'}
                      {timelineItem.estado === 'bloqueado' && 'Bloqueado'}
                      {timelineItem.estado === 'pendiente' && 'Pendiente'}
                      {!['completado', 'en_proceso', 'bloqueado', 'pendiente'].includes(timelineItem.estado) && 'Pendiente'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Provider Tab Component  
interface ProviderTabProps {
  operation: BackendOperationDetail;
}

function ProviderTab({ operation }: ProviderTabProps) {
  // LÓGICA ACTUALIZADA - usar el nuevo campo bancos o el legacy bancosProveedores
  const getProvidersFromPayments = () => {
    const providersMap = new Map<string, any>();
    const bancosMultiples = (operation as any).bancos; // Nuevo campo con múltiples bancos
    const bancosProveedores = (operation as any).bancosProveedores; // Campo legacy

    console.log('🔍 [DEBUG BANCARIO] bancos (múltiples):', bancosMultiples);
    console.log('🔍 [DEBUG BANCARIO] bancosProveedores (legacy):', bancosProveedores);
    console.log('🔍 [DEBUG BANCARIO] Cantidad bancos:', bancosMultiples?.length || bancosProveedores?.length || 0);

    // Priorizar el nuevo campo bancos si está disponible
    if (bancosMultiples && Array.isArray(bancosMultiples) && bancosMultiples.length > 0) {
      bancosMultiples.forEach((banco, index) => {
        const nombreBeneficiario = banco.beneficiario || `Proveedor ${index + 1}`;

        console.log(`📦 Procesando banco múltiple ${index + 1}:`, {
          beneficiario: nombreBeneficiario,
          banco: banco.banco,
          swift: banco.swift
        });

        // Mapear datos del nuevo formato al formato esperado por el componente
        providersMap.set(nombreBeneficiario, {
          nombre: nombreBeneficiario,
          pais: banco.pais_banco || operation.paisProveedor || '',
          datosBancarios: {
            nombre_beneficiario: banco.beneficiario,
            nombre_banco: banco.banco,
            direccion: banco.direccion,
            codigo_postal: banco.codigo_postal,
            provincia_estado: banco.provincia,
            numero_cuenta: banco.numero_cuenta,
            swift: banco.swift,
            banco_intermediario: banco.banco_intermediario,
            swift_intermediario: banco.swift_intermediario,
            pais: banco.pais_banco
          },
          pagos: []
        });
      });
    }
    // Fallback al campo legacy si no hay bancos múltiples
    else if (bancosProveedores && Array.isArray(bancosProveedores)) {
      bancosProveedores.forEach((banco, index) => {
        const nombreBeneficiario = banco.nombre_beneficiario || `Proveedor ${index + 1}`;

        console.log(`🔍 [DEBUG BANCARIO LEGACY] Procesando banco ${index}:`, {
          nombre_beneficiario: nombreBeneficiario,
          nombre_banco: banco.nombre_banco,
          numero_cuenta: banco.numero_cuenta
        });

        // Crear entrada para cada banco/beneficiario
        providersMap.set(nombreBeneficiario, {
          nombre: nombreBeneficiario,
          pais: banco.pais || operation.paisProveedor || '',
          datosBancarios: banco, // Usar directamente los datos del banco
          pagos: [] // Se llenará después
        });
      });
    }

    // Si no hay bancos pero hay proveedor principal, agregarlo
    if (providersMap.size === 0 && operation.proveedorBeneficiario) {
      providersMap.set(operation.proveedorBeneficiario, {
        nombre: operation.proveedorBeneficiario,
        pais: operation.paisProveedor || '',
        datosBancarios: operation.datosBancarios || null,
        pagos: []
      });
    }

    // Ahora asignar pagos a cada proveedor basándose en el nombre
    operation.pagosProveedores?.forEach(pago => {
      const nombreProveedor = pago.nombre_proveedor || operation.proveedorBeneficiario || 'Proveedor';

      // Buscar el proveedor en el map (puede coincidir por nombre exacto o ser el fallback)
      const provider = providersMap.get(nombreProveedor) || Array.from(providersMap.values())[0];

      if (provider) {
        provider.pagos.push(pago);
      }
    });

    return Array.from(providersMap.values());
  };

  // Helper function to get bank information for a specific provider from bancos_proveedores table
  const getBankInfoForProvider = (providerData: any) => {
    console.log('🏦 DEBUG - Datos del proveedor:', providerData);
    console.log('🏦 DEBUG - Datos bancarios específicos:', providerData.datosBancarios);

    let bankData = providerData.datosBancarios;

    if (bankData) {
      // Map fields from bancos_proveedores table structure
      return {
        beneficiario: bankData.nombre_beneficiario || bankData.beneficiario || providerData.nombre || '',
        banco: bankData.nombre_banco || bankData.banco || '',
        numeroCuenta: bankData.numero_cuenta || bankData.numeroCuenta || bankData.cuenta_bancaria || '',
        swift: bankData.swift || bankData.codigo_swift || '',
        iban: bankData.iban || '',
        direccion: bankData.direccion || bankData.direccion_banco || '',
        codigoPostal: bankData.codigo_postal || bankData.cp || '',
        provinciaEstado: bankData.provincia_estado || bankData.estado || bankData.provincia || '',
        pais: bankData.pais || bankData.pais_banco || providerData.pais || '',
        // Additional fields that might be in bancos_proveedores
        ciudadBanco: bankData.ciudad || bankData.ciudad_banco || '',
        codigoABA: bankData.codigo_aba || bankData.aba || '',
        tipoMoneda: bankData.moneda || bankData.tipo_moneda || ''
      };
    }

    // Fallback to provider data only when no banking data is available
    console.log('🏦 DEBUG - Sin datos bancarios específicos para:', providerData.nombre);
    return {
      beneficiario: providerData.nombre || '',
      banco: '',
      numeroCuenta: '',
      swift: '',
      iban: '',
      direccion: '',
      codigoPostal: '',
      provinciaEstado: '',
      pais: providerData.pais || '',
      ciudadBanco: '',
      codigoABA: '',
      tipoMoneda: ''
    };
  };

  const providers = getProvidersFromPayments();

  console.log('🏦 DEBUG - Proveedores encontrados:', providers);
  console.log('📊 [RESUMEN PROVEEDORES] Total de proveedores:', providers.length);
  providers.forEach((provider, index) => {
    const bankInfo = getBankInfoForProvider(provider);
    const hasCompleteData = bankInfo.banco && bankInfo.numeroCuenta;
    console.log(`📊 [PROVEEDOR ${index + 1}] ${provider.nombre}:`, {
      pais: provider.pais,
      cantidadPagos: provider.pagos.length,
      tieneDatosBancarios: !!provider.datosBancarios,
      datosCompletos: hasCompleteData,
      banco: bankInfo.banco,
      cuenta: bankInfo.numeroCuenta ? '***' + bankInfo.numeroCuenta.slice(-4) : 'N/A'
    });
  });

  return (
    <div className="space-y-6">
      {/* Provider Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900">
          Información de Proveedores ({providers.length})
        </h4>
        <div className="text-sm text-gray-500">
          Datos bancarios y contacto por proveedor
        </div>
      </div>

      {providers.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Sin Proveedores Registrados
          </h3>
          <p className="text-gray-600">
            No se encontraron proveedores en esta operación.
          </p>
        </div>
      ) : (
        providers.map((provider, index) => {
          const bankInfo = getBankInfoForProvider(provider);
          const hasCompleteData = bankInfo.banco && bankInfo.numeroCuenta;

          return (
            <div key={index} className="bg-white border border-gray-200 rounded-lg">
              {/* Provider Header */}
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-primary-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {provider.nombre}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {provider.pais || 'País no especificado'} • {provider.pagos.length} pago{provider.pagos.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium",
                    hasCompleteData
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  )}>
                    {hasCompleteData ? 'Datos Completos' : 'Datos Incompletos'}
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Payment Summary for this Provider */}
                {provider.pagos.length > 0 && (
                  <div className="mb-6 bg-blue-50 rounded-lg p-4">
                    <h5 className="font-medium text-blue-900 mb-3">Pagos a este Proveedor</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {provider.pagos.map((pago: any, pagoIndex: number) => (
                        <div key={pagoIndex} className="bg-white rounded p-3 border">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-blue-700 font-medium">
                              {pago.numero_pago || `Pago #${pagoIndex + 1}`}
                            </span>
                            <span className={cn(
                              "text-xs px-2 py-1 rounded-full",
                              (pago.estado === 'completado' || pago.fecha_pago_realizado)
                                ? 'bg-success-100 text-success-700'
                                : 'bg-gray-100 text-gray-600'
                            )}>
                              {(pago.estado === 'completado' || pago.fecha_pago_realizado) ? 'Pagado' : 'Pendiente'}
                            </span>
                          </div>
                          <div className="text-sm font-semibold text-blue-800">
                            ${(pago.valor_pagado || pago.valorSolicitado || 0).toLocaleString()} {operation.moneda || 'USD'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Banking Information */}
                <div className="space-y-4">
                  <h5 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Landmark className="h-5 w-5 text-blue-600" />
                    Información Bancaria
                  </h5>

                  {hasCompleteData ? (
                    <div className="space-y-4">
                      {/* Bank Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h5 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                            <Landmark className="h-4 w-4" />
                            Banco
                          </h5>
                          <p className="text-lg font-semibold text-blue-800 break-words">
                            {bankInfo.banco}
                          </p>
                          <p className="text-sm text-blue-600 mt-1">Institución financiera</p>
                        </div>

                        <div className="bg-green-50 rounded-lg p-4">
                          <h5 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Número de Cuenta
                          </h5>
                          <div className="flex items-center gap-2">
                            <p className="text-lg font-mono font-semibold text-green-800 break-all">
                              {bankInfo.numeroCuenta}
                            </p>
                            <button
                              onClick={() => navigator.clipboard?.writeText(bankInfo.numeroCuenta)}
                              className="p-1 text-green-600 hover:text-green-700 hover:bg-green-100 rounded transition-colors"
                              title="Copiar número de cuenta"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="text-sm text-green-600 mt-1">Cuenta bancaria del beneficiario</p>
                        </div>
                      </div>

                      {/* International Codes */}
                      {(bankInfo.swift || bankInfo.iban) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {bankInfo.swift && (
                            <div className="bg-purple-50 rounded-lg p-4">
                              <h5 className="font-medium text-purple-900 mb-2">Código SWIFT/BIC</h5>
                              <div className="flex items-center gap-2">
                                <p className="text-lg font-mono font-semibold text-purple-800">
                                  {bankInfo.swift}
                                </p>
                                <button
                                  onClick={() => navigator.clipboard?.writeText(bankInfo.swift)}
                                  className="p-1 text-purple-600 hover:text-purple-700 hover:bg-purple-100 rounded transition-colors"
                                  title="Copiar código SWIFT"
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                              </div>
                              <p className="text-sm text-purple-600 mt-1">Código internacional del banco</p>
                            </div>
                          )}

                          {bankInfo.iban && (
                            <div className="bg-orange-50 rounded-lg p-4">
                              <h5 className="font-medium text-orange-900 mb-2">IBAN</h5>
                              <div className="flex items-center gap-2">
                                <p className="text-lg font-mono font-semibold text-orange-800 break-all">
                                  {bankInfo.iban}
                                </p>
                                <button
                                  onClick={() => navigator.clipboard?.writeText(bankInfo.iban)}
                                  className="p-1 text-orange-600 hover:text-orange-700 hover:bg-orange-100 rounded transition-colors"
                                  title="Copiar IBAN"
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                              </div>
                              <p className="text-sm text-orange-600 mt-1">Número de cuenta bancaria internacional</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Landmark className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <h6 className="text-sm font-medium text-gray-900 mb-1">
                        Sin Información Bancaria
                      </h6>
                      <p className="text-xs text-gray-600">
                        {bankInfo.beneficiario ?
                          'Datos bancarios incompletos para este proveedor.' :
                          'No hay información bancaria disponible.'
                        }
                      </p>
                    </div>
                  )}
                </div>

                {/* Quick Actions for this provider */}
                {hasCompleteData && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => navigator.clipboard?.writeText(`${bankInfo.beneficiario}\n${bankInfo.banco}\n${bankInfo.numeroCuenta}`)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded text-xs hover:bg-blue-100 transition-colors"
                      >
                        <Copy className="h-3 w-3" />
                        Copiar Datos
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// Financial Tab Component - NUEVO
interface FinancialTabProps {
  operation: BackendOperationDetail;
  nps: ReturnType<typeof useNPS>;
  operationId: string;
  realProgress: number;
}

function FinancialTab({ operation, nps, operationId, realProgress }: FinancialTabProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'analyst';

  // Preparar datos para el timeline financiero usando datos reales de Supabase
  const prepareFinancialSummary = () => {
    // Agregar costos logísticos desde Supabase
    const costosLogisticosRaw = operation.costosLogisticos || [];

    // 🚚 LÓGICA DE NEGOCIO CENTRAL: Si existe entrega de mercancía, los costos logísticos están pagados
    const tieneEntregaMercancia = operation.timeline?.some(t =>
      t.fase?.toLowerCase().includes('entrega') &&
      t.fase?.toLowerCase().includes('mercancía') &&
      (t.estado === 'completado' || t.estado === 'en_proceso')
    ) || false;

    console.log('🚚 [RESUMEN FINANCIERO] Lógica inteligente aplicada:', {
      tieneEntregaMercancia,
      costosLogisticosCount: costosLogisticosRaw.length,
      timeline: operation.timeline?.map(t => ({ fase: t.fase, estado: t.estado }))
    });

    const costosLogisticos = {
      flete: costosLogisticosRaw.find(c => c.tipo_costo === 'flete')?.monto || 0,
      seguro: costosLogisticosRaw.find(c => c.tipo_costo === 'seguro')?.monto || 0,
      gastosOrigen: costosLogisticosRaw.find(c => c.tipo_costo === 'gastos_origen')?.monto || 0,
      gastosDestino: costosLogisticosRaw.find(c => c.tipo_costo === 'gastos_destino')?.monto || 0,
      total: costosLogisticosRaw.reduce((sum, c) => sum + (c.monto || 0), 0),
      fechaPago: costosLogisticosRaw.find(c => c.fecha_pago)?.fecha_pago,
      // 🆕 ESTADO INTELIGENTE: Si hay entrega de mercancía = costos pagados
      estado: tieneEntregaMercancia ? 'completado' :
              (costosLogisticosRaw.length > 0 ? costosLogisticosRaw[0].estado : 'pendiente')
    };

    // Mapear extracostos desde Supabase
    const extracostos = (operation.extracostosOperacion || []).map((e) => ({
      concepto: e.concepto,
      monto: e.monto,
      fechaPago: e.fecha_pago,
      estado: e.estado
    }));

    // Mapear reembolsos desde Supabase (solo para admin)
    const reembolsos = isAdmin ? (operation.reembolsosOperacion || []).map((r) => ({
      concepto: r.concepto,
      monto: r.monto_reembolso,
      fechaReembolso: r.fecha_reembolso,
      estado: r.estado
    })) : [];

    // Calcular cuota operacional (10% del valor total)
    const cuotaOperacional = operation.valorTotal ? {
      monto: Math.round(operation.valorTotal * 0.1),
      estado: realProgress > 16.67 ? 'completado' : 'pendiente'
    } : undefined;

    // Calcular segundo avance (basado en progreso)
    const avanceSegundo = operation.valorTotal && realProgress > 50 ? {
      monto: Math.round(operation.valorTotal * 0.15), // Estimado 15%
      estado: realProgress > 66.67 ? 'completado' : 'en_proceso'
    } : undefined;

    const totalPagado = (cuotaOperacional?.estado === 'completado' ? cuotaOperacional.monto : 0) +
                       (avanceSegundo?.estado === 'completado' ? avanceSegundo.monto : 0) +
                       (costosLogisticos.estado === 'completado' ? costosLogisticos.total : 0) +
                       extracostos.filter(e => e.estado === 'completado').reduce((sum, e) => sum + e.monto, 0);

    const totalPendiente = operation.valorTotal - totalPagado;

    return {
      valorOperacion: operation.valorTotal || 0,
      cuotaOperacional,
      avanceSegundo,
      costosLogisticos: {
        flete: costosLogisticos.flete,
        seguro: costosLogisticos.seguro,
        gastosOrigen: costosLogisticos.gastosOrigen,
        gastosDestino: costosLogisticos.gastosDestino,
        total: costosLogisticos.total,
        fechaPago: costosLogisticos.fechaPago,
        estado: costosLogisticos.estado
      },
      extracostos,
      reembolsos,
      totalPagado,
      totalPendiente: Math.max(0, totalPendiente)
    };
  };

  const resumenFinanciero = prepareFinancialSummary();

  return (
    <div className="space-y-6">
      {/* 🔗 Identificadores de Seguimiento - Movido desde Resumen */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h5 className="text-sm font-medium text-blue-900 mb-2">🔗 Identificadores de Seguimiento</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white rounded p-3">
            <p className="text-xs text-blue-600 font-medium">ID Integra</p>
            <p className="text-sm font-mono text-blue-900">
              {operation.id_integra || 'No asignado'}
            </p>
          </div>
          <div className="bg-white rounded p-3">
            <p className="text-xs text-blue-600 font-medium">IDs Paga</p>
            <p className="text-sm font-mono text-blue-900 whitespace-pre-line">
              {(() => {
                const filteredIds = formatPagaIds(operation.ids_paga, '\n');
                return filteredIds || 'No asignado';
              })()}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900">Timeline de Pagos y Financiamiento</h4>
        <div className="text-sm text-gray-500">
          Sistema de seguimiento financiero detallado
        </div>
      </div>

      {/* Timeline financiero integrado con datos procesados con lógica inteligente */}
      <FKFinancialTimeline
        operationId={operation.id}
        moneda={operation.moneda || 'USD'}
        proveedorBeneficiario={operation.proveedorBeneficiario}
        resumenFinanciero={resumenFinanciero}
        costosLogisticos={(() => {
          // 🚚 APLICAR LÓGICA INTELIGENTE: Si hay entrega de mercancía, costos están pagados
          const costosRaw = operation.costosLogisticos || [];
          const tieneEntregaMercancia = operation.timeline?.some(t =>
            t.fase?.toLowerCase().includes('entrega') &&
            t.fase?.toLowerCase().includes('mercancía') &&
            (t.estado === 'completado' || t.estado === 'en_proceso')
          ) || false;

          console.log('🚚 [TIMELINE FINANCIERO] Aplicando lógica inteligente:', {
            tieneEntregaMercancia,
            costosOriginales: costosRaw.length,
            timeline: operation.timeline?.map(t => ({ fase: t.fase, estado: t.estado }))
          });

          // Mapear costos aplicando estado inteligente
          return costosRaw.map(costo => ({
            ...costo,
            estado: tieneEntregaMercancia ? 'completado' : (costo.estado || 'pendiente')
          }));
        })()}
        extracostosOperacion={operation.extracostosOperacion || []}
        reembolsosOperacion={operation.reembolsosOperacion || []}
        pagosClientes={operation.pagosClientes || []}
        pagosProveedores={operation.pagosProveedores || []}
        giros={operation.giros || []}
        liberaciones={operation.liberaciones || []}
        timeline={operation.timeline || []}
        isAdmin={isAdmin}
      />

      {/* 🆕 Modal NPS Contextual */}
      {(() => {
        console.log(`🎭 [MODAL DEBUG] Props del modal NPS:`, {
          isOpen: nps.isModalOpen,
          currentStage: nps.currentStage,
          operationId,
          clientId: operation?.clienteNit || '',
          progressPercentage: realProgress,
          country: (() => {
            const pais = operation?.paisImportador?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return (pais === 'colombia') ? 'COL' : 'MEX';
          })()
        });
        return null;
      })()}
      {/* 🎯 Modal NPS - Solo para clientes, NO para administradores */}
      {nps.isNPSEnabled && (
        <FKNPSModal
          isOpen={nps.isModalOpen}
          onClose={nps.closeModal}
          operationId={operationId}
          clientId={operation?.clienteNit || ''}
          stage={nps.currentStage || 'inicio'}
          progressPercentage={realProgress}
          country={(() => {
            const pais = operation?.paisImportador?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return (pais === 'colombia') ? 'COL' : 'MEX';
          })()}
          onSubmit={nps.submitNPSResponse}
        />
      )}
    </div>
  );
}

