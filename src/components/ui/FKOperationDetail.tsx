import { useState, useEffect } from 'react';
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
import FKDocumentsTab from './FKDocumentsTab';
import FKFinancialTimeline from './FKFinancialTimeline';


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
              operation.progresoGeneral >= 100 ? 'bg-success-100' :
              operation.progresoGeneral > 0 ? 'bg-primary-100' : 'bg-gray-100'
            )}>
              <Package className={cn(
                "h-5 w-5",
                operation.progresoGeneral >= 100 ? 'text-success-600' :
                operation.progresoGeneral > 0 ? 'text-primary-600' : 'text-gray-600'
              )} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Estado Actual</h3>
              <p className="text-sm text-gray-600">
                {operation.progresoGeneral >= 100 ? 'Completada' :
                 operation.progresoGeneral > 0 ? 'En Progreso' :
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
              {operation.progresoGeneral}%
            </p>
            <p className="text-sm text-gray-600">Completado</p>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-primary-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${operation.progresoGeneral}%` }}
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
            <OverviewTab operation={operation} onStatusUpdate={handleStatusUpdate} />
          )}
          {activeTab === 'timeline' && (
            <TimelineTab operation={operation} />
          )}
          {activeTab === 'financial' && (
            <FinancialTab operation={operation} />
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
}

function OverviewTab({ operation, onStatusUpdate }: OverviewTabProps) {
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
              {operation.ids_paga && (
                <p className="text-xs text-gray-500">
                  <span className="font-medium">IDs Paga:</span> {operation.ids_paga}
                </p>
              )}
            </div>
          </div>
          <div>
            <h5 className="font-medium text-gray-700 mb-2">Proveedor (Beneficiario)</h5>
            <p className="text-lg font-semibold text-gray-900">{operation.proveedorBeneficiario}</p>
            <p className="text-sm text-gray-600">{operation.paisProveedor}</p>
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
            </div>
          </div>
          <div>
            <h5 className="font-medium text-gray-700 mb-2">Progreso General Detallado</h5>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">
                  {operation.progresoGeneral}%
                </span>
                <span className="text-sm text-gray-600">Completado</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${operation.progresoGeneral}%` }}
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
}

function TimelineTab({ operation }: TimelineTabProps) {
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
          Progreso general: <span className="font-medium text-gray-900">{operation.progresoGeneral}%</span>
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
  // Helper function to get bank information
  const getBankInfo = () => {
    console.log('🏦 DEBUG - Datos de operación completos:', operation);
    console.log('🏦 DEBUG - datosBancarios:', operation.datosBancarios);
    console.log('🏦 DEBUG - bancosProveedores:', (operation as any).bancosProveedores);
    
    // Try to get banking data from multiple sources
    let bankData = null;
    
    // First check datosBancarios (mapped from backend)
    if (operation.datosBancarios && (operation.datosBancarios.banco || operation.datosBancarios.numeroCuenta)) {
      bankData = operation.datosBancarios;
      console.log('🏦 DEBUG - Usando datosBancarios:', bankData);
    }
    // Then check bancosProveedores (direct from backend)
    else if ((operation as any).bancosProveedores) {
      bankData = (operation as any).bancosProveedores;
      console.log('🏦 DEBUG - Usando bancosProveedores:', bankData);
    }
    
    if (bankData) {
      return {
        beneficiario: bankData.nombre_beneficiario || bankData.beneficiario || operation.proveedorBeneficiario || '',
        banco: bankData.nombre_banco || bankData.banco || '',
        numeroCuenta: bankData.numero_cuenta || bankData.numeroCuenta || '',
        swift: bankData.swift || '',
        iban: bankData.iban || '',
        direccion: bankData.direccion || '',
        codigoPostal: bankData.codigo_postal || '',
        provinciaEstado: bankData.provincia_estado || bankData.paisBanco || '',
        pais: bankData.pais || operation.paisProveedor || ''
      };
    }
    
    // Fallback to operation data only
    console.log('🏦 DEBUG - Sin datos bancarios, usando fallback');
    return {
      beneficiario: operation.proveedorBeneficiario || '',
      banco: '',
      numeroCuenta: '',
      swift: '',
      iban: '',
      direccion: '',
      codigoPostal: '',
      provinciaEstado: '',
      pais: operation.paisProveedor || ''
    };
  };

  const bankInfo = getBankInfo();
  const hasCompleteData = bankInfo.banco && bankInfo.numeroCuenta;

  return (
    <div className="space-y-6">
      {/* Provider Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900">Información del Proveedor</h4>
        <div className="text-sm text-gray-500">
          Datos bancarios y contacto
        </div>
      </div>

      {/* Provider Basic Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Building className="h-5 w-5 text-primary-600" />
          Información General del Proveedor
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-gray-700 mb-2">Nombre del Proveedor (Beneficiario)</h5>
            <p className="text-lg font-semibold text-gray-900 break-words">
              {bankInfo.beneficiario || 'No especificado'}
            </p>
            <p className="text-sm text-gray-600 mt-1">Nombre completo del beneficiario de los pagos</p>
          </div>
          
          <div>
            <h5 className="font-medium text-gray-700 mb-2">País del Proveedor</h5>
            <p className="text-lg font-semibold text-gray-900">
              {bankInfo.pais || 'No especificado'}
            </p>
            <p className="text-sm text-gray-600 mt-1">País de origen del proveedor</p>
          </div>

          {bankInfo.direccion && (
            <div className="md:col-span-2">
              <h5 className="font-medium text-gray-700 mb-2">Dirección</h5>
              <p className="text-gray-900 break-words">{bankInfo.direccion}</p>
              <div className="flex gap-4 mt-1 text-sm text-gray-600">
                {bankInfo.codigoPostal && (
                  <span>CP: {bankInfo.codigoPostal}</span>
                )}
                {bankInfo.provinciaEstado && (
                  <span>Estado/Provincia: {bankInfo.provinciaEstado}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Banking Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Landmark className="h-5 w-5 text-blue-600" />
          Información Bancaria
        </h3>

        {hasCompleteData ? (
          <div className="space-y-6">
            {/* Bank Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            {/* Complete Banking Summary */}
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
              <h6 className="font-medium text-gray-900 mb-3">Resumen Completo para Transferencias</h6>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-3 gap-4">
                  <span className="font-medium text-gray-700">Beneficiario:</span>
                  <span className="col-span-2 text-gray-900 break-words">{bankInfo.beneficiario}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="font-medium text-gray-700">Banco:</span>
                  <span className="col-span-2 text-gray-900 break-words">{bankInfo.banco}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="font-medium text-gray-700">Cuenta:</span>
                  <span className="col-span-2 text-gray-900 font-mono break-all">{bankInfo.numeroCuenta}</span>
                </div>
                {bankInfo.swift && (
                  <div className="grid grid-cols-3 gap-4">
                    <span className="font-medium text-gray-700">SWIFT:</span>
                    <span className="col-span-2 text-gray-900 font-mono">{bankInfo.swift}</span>
                  </div>
                )}
                {bankInfo.iban && (
                  <div className="grid grid-cols-3 gap-4">
                    <span className="font-medium text-gray-700">IBAN:</span>
                    <span className="col-span-2 text-gray-900 font-mono break-all">{bankInfo.iban}</span>
                  </div>
                )}
                {bankInfo.pais && (
                  <div className="grid grid-cols-3 gap-4">
                    <span className="font-medium text-gray-700">País:</span>
                    <span className="col-span-2 text-gray-900">{bankInfo.pais}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Landmark className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h5 className="text-lg font-medium text-gray-900 mb-2">
              Sin Información Bancaria Completa
            </h5>
            <p className="text-gray-600 max-w-md mx-auto">
              {bankInfo.beneficiario ? 
                'Los datos bancarios completos no están disponibles para este proveedor. Solo se tiene el nombre del beneficiario.' :
                'No hay información bancaria disponible para este proveedor en los registros actuales.'
              }
            </p>
            {bankInfo.beneficiario && (
              <div className="mt-4 bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Proveedor:</span> {bankInfo.beneficiario}
                </p>
                {bankInfo.pais && (
                  <p className="text-sm text-gray-700 mt-1">
                    <span className="font-medium">País:</span> {bankInfo.pais}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {hasCompleteData && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm">
              <Copy className="h-4 w-4" />
              Copiar Datos Bancarios
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm">
              <ExternalLink className="h-4 w-4" />
              Exportar Información
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm">
              <Share2 className="h-4 w-4" />
              Compartir Detalles
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Financial Tab Component - NUEVO
interface FinancialTabProps {
  operation: BackendOperationDetail;
}

function FinancialTab({ operation }: FinancialTabProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'analyst';
  
  // Preparar datos para el timeline financiero usando datos reales de Supabase
  const prepareFinancialSummary = () => {
    // Agregar costos logísticos desde Supabase
    const costosLogisticosRaw = operation.costosLogisticos || [];
    const costosLogisticos = {
      flete: costosLogisticosRaw.find(c => c.tipo_costo === 'flete')?.monto || 0,
      seguro: costosLogisticosRaw.find(c => c.tipo_costo === 'seguro')?.monto || 0,
      gastosOrigen: costosLogisticosRaw.find(c => c.tipo_costo === 'gastos_origen')?.monto || 0,
      total: costosLogisticosRaw.reduce((sum, c) => sum + (c.monto || 0), 0),
      fechaPago: costosLogisticosRaw.find(c => c.fecha_pago)?.fecha_pago,
      estado: costosLogisticosRaw.length > 0 ? costosLogisticosRaw[0].estado : 'pendiente'
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
      estado: operation.progresoGeneral > 16.67 ? 'completado' : 'pendiente'
    } : undefined;

    // Calcular segundo avance (basado en progreso)
    const avanceSegundo = operation.valorTotal && operation.progresoGeneral > 50 ? {
      monto: Math.round(operation.valorTotal * 0.15), // Estimado 15%
      estado: operation.progresoGeneral > 66.67 ? 'completado' : 'en_proceso'
    } : undefined;

    const totalPagado = (cuotaOperacional?.estado === 'completado' ? cuotaOperacional.monto : 0) +
                       (avanceSegundo?.estado === 'completado' ? avanceSegundo.monto : 0) +
                       (costosLogisticos.estado_pago === 'completado' ? costosLogisticos.total_logisticos : 0) +
                       extracostos.filter(e => e.estado === 'completado').reduce((sum, e) => sum + e.monto, 0);

    const totalPendiente = operation.valorTotal - totalPagado;

    return {
      valorOperacion: operation.valorTotal || 0,
      cuotaOperacional,
      avanceSegundo,
      costosLogisticos: {
        flete: costosLogisticos.flete,
        seguro: costosLogisticos.seguro,
        gastosOrigen: costosLogisticos.gastos_origen,
        total: costosLogisticos.total_logisticos,
        fechaPago: costosLogisticos.fecha_pago,
        estado: costosLogisticos.estado_pago
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
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900">Timeline de Pagos y Financiamiento</h4>
        <div className="text-sm text-gray-500">
          Sistema de seguimiento financiero detallado
        </div>
      </div>

      {/* Información de IDs de seguimiento usando datos reales de Supabase */}
      {(operation.id_integra || operation.ids_paga) && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h5 className="text-sm font-medium text-blue-900 mb-2">🔗 Identificadores de Seguimiento</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {operation.id_integra && (
              <div className="bg-white rounded p-3">
                <p className="text-xs text-blue-600 font-medium">ID Integra</p>
                <p className="text-sm font-mono text-blue-900">{operation.id_integra}</p>
              </div>
            )}
            {operation.ids_paga && (
              <div className="bg-white rounded p-3">
                <p className="text-xs text-blue-600 font-medium">IDs Paga</p>
                <p className="text-sm font-mono text-blue-900">{operation.ids_paga}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timeline financiero integrado con datos reales de Supabase */}
      <FKFinancialTimeline
        operationId={operation.id}
        resumenFinanciero={resumenFinanciero}
        costosLogisticos={operation.costosLogisticos || []}
        extracostosOperacion={operation.extracostosOperacion || []}
        reembolsosOperacion={operation.reembolsosOperacion || []}
        pagosClientes={operation.pagosClientes || []}
        pagosProveedores={operation.pagosProveedores || []}
        giros={operation.giros || []}
        liberaciones={operation.liberaciones || []}
        timeline={operation.timeline || []}
        isAdmin={isAdmin}
      />
    </div>
  );
}

