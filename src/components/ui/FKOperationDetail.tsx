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
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useOperationNotifications } from '../../hooks/useNotifications';
import { useOperationDetail, BackendOperationDetail } from '../../hooks/useOperationDetail';
import { cn } from '../../utils/cn';


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
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline'>('overview');

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
              { id: 'timeline', label: 'Cronograma', icon: Clock }
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
          </div>
          <div>
            <h5 className="font-medium text-gray-700 mb-2">Proveedor (Beneficiario)</h5>
            <p className="text-lg font-semibold text-gray-900">{operation.proveedorBeneficiario}</p>
            <p className="text-sm text-gray-600">{operation.paisProveedor}</p>
          </div>
          <div>
            <h5 className="font-medium text-gray-700 mb-2">Valores Financieros</h5>
            <div className="space-y-2">
              {/* Valor Operación - PRIMERO Y MÁS PROMINENTE */}
              <div>
                <p className="text-2xl font-bold text-primary-600">
                  ${operation.valorOperacion?.toLocaleString()} {operation.moneda}
                </p>
                <p className="text-sm text-gray-600 font-medium">Valor Total Operación</p>
              </div>
              {/* Valor Compra - Segundo */}
              <div>
                <p className="text-lg font-semibold text-gray-700">
                  ${operation.valorTotal?.toLocaleString()} {operation.moneda}
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

      {/* Información Financiera - Full Width */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-success-600" />
          Información Financiera
        </h3>
            
        {/* Executive Summary */}
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-6 mb-6">
          <h6 className="font-semibold text-primary-800 mb-4 text-base">📈 RESUMEN EJECUTIVO</h6>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            <div className="bg-white/80 rounded-lg p-4 shadow-sm">
              <p className="text-2xl font-bold text-primary-700 mb-1">
                ${operation.valorOperacion?.toLocaleString()}
              </p>
              <p className="text-sm text-primary-600 font-medium">Total Operación</p>
            </div>
            
            <div className="bg-white/80 rounded-lg p-4 shadow-sm">
              <p className="text-2xl font-bold text-gray-800 mb-1">
                ${operation.valorTotal?.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 font-medium">Compra Mercancía</p>
            </div>
            
            <div className="bg-white/80 rounded-lg p-4 shadow-sm">
              <p className="text-2xl font-bold text-success-600 mb-1">
                ${operation.montosLiberados?.toLocaleString()}
              </p>
              <p className="text-sm text-success-600 font-medium">Total Liberaciones</p>
            </div>
            
            <div className="bg-white/80 rounded-lg p-4 shadow-sm">
              <p className="text-2xl font-bold text-coral-600 mb-1">
                $0
              </p>
              <p className="text-sm text-coral-600 font-medium">Extracostos</p>
          </div>
              
        </div>

        {/* Detailed Sections */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">
              
          {/* Giros Section */}
          <div className="bg-coral-50 rounded-lg p-6">
            <h6 className="font-semibold text-gray-800 mb-4 text-base flex items-center gap-2">
              📤 GIROS A PROVEEDORES
            </h6>
                
                {operation.giros && operation.giros.length > 0 ? (
                  <>
                    <div className="space-y-2 mb-3">
                      {operation.giros.map((giro, index) => (
                        <div key={index} className="bg-white/80 rounded p-2">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-xs font-medium text-gray-800">{giro.numeroGiro}</p>
                              <p className="text-xs text-gray-600">{giro.porcentajeGiro}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-800 text-sm">
                                ${giro.valorSolicitado.toLocaleString()}
                              </p>
                              <span className={cn(
                                "text-xs px-2 py-1 rounded-full",
                                giro.estado === 'completado' ? 'bg-success-100 text-success-700' : 
                                giro.estado === 'en_proceso' ? 'bg-coral-100 text-coral-700' : 
                                'bg-gray-100 text-gray-600'
                              )}>
                                {giro.estado === 'completado' ? 'Pagado' : 
                                 giro.estado === 'en_proceso' ? 'Proceso' : 'Pendiente'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-gray-700">Total:</span>
                        <span className="font-bold text-gray-800">
                          ${operation.giros?.reduce((sum, giro) => sum + giro.valorSolicitado, 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-gray-700">Pagado:</span>
                        <span className="font-bold text-gray-800">
                          ${operation.giros?.filter(g => g.estado === 'completado').reduce((sum, giro) => sum + giro.valorSolicitado, 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-success-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min(100, (operation.giros?.filter(g => g.estado === 'completado').reduce((sum, giro) => sum + giro.valorSolicitado, 0) / operation.giros?.reduce((sum, giro) => sum + giro.valorSolicitado, 0)) * 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-gray-600 italic text-center py-4">Sin giros programados</p>
                )}
              </div>

          {/* Liberaciones Section */}
          <div className="bg-coral-50 rounded-lg p-6">
            <h6 className="font-semibold text-gray-800 mb-4 text-base flex items-center gap-2">
              📥 LIBERACIONES
            </h6>
                
                {operation.liberaciones && operation.liberaciones.length > 0 ? (
                  <>
                    <div className="space-y-2 mb-3">
                      {operation.liberaciones.map((liberacion, index) => (
                        <div key={liberacion.numero} className="bg-white/80 rounded p-2">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-xs font-medium text-gray-800">Liberación {liberacion.numero}</p>
                              <p className="text-xs text-gray-600">
                                {new Date(liberacion.fecha).toLocaleDateString('es-ES')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-800 text-sm">
                                ${liberacion.capital.toLocaleString()}
                              </p>
                              <span className={cn(
                                "text-xs px-2 py-1 rounded-full",
                                liberacion.estado === 'completado' ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-600'
                              )}>
                                {liberacion.estado === 'completado' ? 'Ejecutada' : 'Programada'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-gray-700">Liberado:</span>
                        <span className="font-bold text-gray-800">
                          ${operation.montosLiberados?.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-success-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min(100, (operation.montosLiberados / operation.montoTotal) * 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-gray-600 italic text-center py-4">Sin liberaciones ejecutadas</p>
                )}
              </div>

          {/* Extracostos Section */}
          <div className="bg-coral-50 rounded-lg p-6">
            <h6 className="font-semibold text-coral-800 mb-4 text-base flex items-center gap-2">
              💸 EXTRACOSTOS
            </h6>
                
                <div className="space-y-2 mb-3">
                  <div className="bg-white/80 rounded p-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-coral-700">Comisión bancaria:</span>
                      <span className="font-medium text-coral-800 text-xs">
                        $0
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-white/80 rounded p-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-coral-700">Gastos logísticos:</span>
                      <span className="font-medium text-coral-800 text-xs">
                        $0
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-white/80 rounded p-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-coral-700">Seguro de carga:</span>
                      <span className="font-medium text-coral-800 text-xs">
                        $0
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-coral-200 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-coral-700">Total:</span>
                    <span className="font-bold text-coral-800">
                      $0
                    </span>
                  </div>
                </div>
              </div>
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

