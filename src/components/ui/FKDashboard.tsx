import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Truck, 
  DollarSign,
  FileText,
  User,
  Building,
  Calendar,
  Database,
  RefreshCw,
  CreditCard
} from 'lucide-react';
import { Operation, OperationStatus, DashboardStats } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useNewUser } from '../../hooks/useNewUser';
import { useDashboardData, BackendOperationCard } from '../../hooks/useDashboardData';
import { cn } from '../../utils/cn';

// Status configuration - Mapeo del backend al frontend
const STATUS_CONFIG = {
  draft: {
    label: 'Borrador',
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: FileText,
    priority: 1
  },
  'in-progress': {
    label: 'En Proceso',
    color: 'bg-primary-100 text-primary-600 border-primary-200',
    icon: Clock,
    priority: 2
  },
  'on-hold': {
    label: 'En Pausa',
    color: 'bg-yellow-100 text-yellow-600 border-yellow-200',
    icon: AlertCircle,
    priority: 3
  },
  completed: {
    label: 'Completado',
    color: 'bg-success-100 text-success-600 border-success-200',
    icon: CheckCircle,
    priority: 4
  }
} as const;

type BackendStatus = 'draft' | 'in-progress' | 'completed' | 'on-hold';

interface FKDashboardProps {
  className?: string;
}

export default function FKDashboard({ className }: FKDashboardProps) {
  const { user, hasPermission } = useAuth();
  const { resetWelcomeState, hasExistingOperations, isNewUser } = useNewUser();
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState<BackendStatus | 'all'>('all');
  
  // Usar el hook personalizado para obtener datos del backend
  const { operations, isLoading, error, metadata, refetch } = useDashboardData();

  // Filter operations based on status
  const filteredOperations = useMemo(() => {
    console.log('🔍 Filtrando operaciones:', {
      operationsCount: operations?.length || 0,
      selectedStatus,
      operations: operations?.map(op => ({ id: op.id, status: op.status, client: op.clientName }))
    });
    
    if (!operations || operations.length === 0) {
      console.log('⚠️ No hay operaciones para filtrar');
      return [];
    }

    let filtered = [...operations];

    // Status filtering
    if (selectedStatus !== 'all') {
      const beforeFilter = filtered.length;
      filtered = filtered.filter(op => op.status === selectedStatus);
      console.log(`🔍 Filtro por status "${selectedStatus}": ${beforeFilter} → ${filtered.length}`);
    }

    // Sort by status priority and then by date
    const sorted = filtered.sort((a, b) => {
      const priorityDiff = STATUS_CONFIG[a.status].priority - STATUS_CONFIG[b.status].priority;
      if (priorityDiff !== 0) return priorityDiff;
      
      // Sort by updatedAt if available
      if (a.updatedAt && b.updatedAt) {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      return 0;
    });
    
    console.log('✅ Operaciones filtradas y ordenadas:', sorted.length);
    return sorted;
  }, [operations, selectedStatus]);

  // Calculate dashboard statistics from backend data
  const dashboardStats = useMemo((): DashboardStats => {
    console.log('📊 Recalculando estadísticas con:', { 
      operationsLength: operations?.length || 0,
      isLoading, 
      error 
    });
    
    if (!operations || operations.length === 0) {
      console.log('⚠️ Sin operaciones para calcular estadísticas');
      return {
        totalOperations: 0,
        activeOperations: 0,
        completedOperations: 0,
        totalValue: 0,
        currency: 'USD'
      };
    }

    const activeOperations = operations.filter(op => op.status !== 'completed');
    const completedOperations = operations.filter(op => op.status === 'completed');
    
    // Usar totalValueNumeric directamente del backend
    const totalValue = operations.reduce((sum, op) => {
      const value = op.totalValueNumeric || 0;
      console.log(`💰 Sumando: ${op.clientName} = ${value}`);
      return sum + value;
    }, 0);
    
    const stats = {
      totalOperations: operations.length,
      activeOperations: activeOperations.length,
      completedOperations: completedOperations.length,
      totalValue,
      currency: 'USD' as const
    };
    
    console.log('✅ Estadísticas calculadas:', stats);
    return stats;
  }, [operations, isLoading, error]);

  // Get status counts from backend data
  const statusCounts = useMemo(() => {
    const counts: Record<BackendStatus | 'all', number> = {
      all: operations.length,
      draft: 0,
      'in-progress': 0,
      'on-hold': 0,
      completed: 0
    };

    operations.forEach(op => {
      counts[op.status]++;
    });

    return counts;
  }, [operations]);

  // Show error state if there's an error
  if (error && !isLoading) {
    return (
      <div className={cn("p-6", className)}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error de Conexión</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn("p-6", className)}>
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("p-6 space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-primary-700">
            Panel de Control
          </h1>
          <p className="text-gray-600 mt-1">
            {user?.role === 'client_with_operations' 
              ? 'Gestiona tus operaciones de financiamiento activas'
              : user?.role === 'client_without_operations'
              ? 'Comienza tu primera operación de financiamiento'
              : 'Supervisa todas las operaciones de financiamiento'
            }
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Refresh Button */}
          <button
            onClick={refetch}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
            title="Actualizar datos"
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Actualizar
          </button>
          
          {/* CSV Data Viewer Link */}
          <button
            onClick={() => navigate('/csv-data')}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
            title="Ver datos raw del CSV"
          >
            <Database className="h-4 w-4" />
            Datos CSV
          </button>
          
          <div className="text-sm text-gray-500 text-right">
            <div>Última actualización: {metadata?.lastUpdated ? 
              new Date(metadata.lastUpdated).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : 'Cargando...'
            }</div>
            {metadata?.processingStats && (
              <div className="text-xs mt-1">
                {metadata.processingStats.validOperations} válidas, {metadata.processingStats.errorCount} errores
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Operaciones</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {dashboardStats.totalOperations}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Building className="h-6 w-6 text-primary-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <TrendingUp className="h-4 w-4 text-success-500 mr-1" />
            <span className="text-success-600 font-medium">+12%</span>
            <span className="text-gray-600 ml-1">vs mes anterior</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Operaciones Activas</p>
              <p className="text-3xl font-bold text-coral-600 mt-1">
                {dashboardStats.activeOperations}
              </p>
            </div>
            <div className="w-12 h-12 bg-coral-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-coral-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-gray-600">
              {Math.round((dashboardStats.activeOperations / dashboardStats.totalOperations) * 100)}% del total
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completadas</p>
              <p className="text-3xl font-bold text-success-600 mt-1">
                {dashboardStats.completedOperations}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-success-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-gray-600">
              {Math.round((dashboardStats.completedOperations / dashboardStats.totalOperations) * 100)}% tasa de éxito
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valor Total Portfolio</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {dashboardStats.totalValue >= 1000000 
                  ? `$${(dashboardStats.totalValue / 1000000).toFixed(1)}M`
                  : dashboardStats.totalValue >= 1000
                  ? `$${(dashboardStats.totalValue / 1000).toFixed(0)}K`
                  : `$${dashboardStats.totalValue.toLocaleString()}`
                }
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-primary-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-gray-600">
              Promedio: ${dashboardStats.totalOperations > 0 
                ? (dashboardStats.totalValue / dashboardStats.totalOperations).toLocaleString('en-US', { maximumFractionDigits: 0 })
                : '0'
              } por operación
            </span>
          </div>
        </div>
      </div>

      {/* Status Filters */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtrar por Estado</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setSelectedStatus('all')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
              selectedStatus === 'all'
                ? "bg-primary-600 text-white border-primary-600"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            )}
          >
            Todas ({statusCounts.all})
          </button>
          {(Object.entries(STATUS_CONFIG) as [BackendStatus, typeof STATUS_CONFIG[BackendStatus]][]).map(([status, config]) => {
            return (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
                  selectedStatus === status
                    ? "bg-primary-600 text-white border-primary-600"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                )}
              >
                {config.label} ({statusCounts[status]})
              </button>
            );
          })}
        </div>
      </div>

      {/* Operations Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Operaciones {selectedStatus !== 'all' && `- ${STATUS_CONFIG[selectedStatus as BackendStatus]?.label}`}
          </h3>
          <span className="text-sm text-gray-500">
            {filteredOperations.length} operación{filteredOperations.length !== 1 ? 'es' : ''}
          </span>
        </div>

        {filteredOperations.length === 0 ? (
          <div className="bg-white rounded-lg p-12 border border-gray-200 shadow-sm text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              {user?.role === 'client_without_operations' && selectedStatus === 'all'
                ? 'Bienvenido a Integra Control Tower'
                : 'No hay operaciones'
              }
            </h4>
            <p className="text-gray-600 mb-4">
              {user?.role === 'client_without_operations' && selectedStatus === 'all'
                ? 'Como cliente nuevo, puedes comenzar creando tu primera operación de financiamiento. Nuestro equipo te guiará en todo el proceso.'
                : selectedStatus === 'all' 
                ? 'No tienes operaciones registradas aún.'
                : `No hay operaciones con estado "${STATUS_CONFIG[selectedStatus as OperationStatus]?.label}".`
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredOperations.map((operation) => (
              <DashboardOperationCard 
                key={operation.id} 
                operation={operation}
                onViewDetails={() => navigate(`/operation/${operation.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Backend Operation Card Component
interface DashboardOperationCardProps {
  operation: BackendOperationCard;
  onViewDetails?: () => void;
}

function DashboardOperationCard({ operation, onViewDetails }: DashboardOperationCardProps) {
  const statusConfig = STATUS_CONFIG[operation.status];
  const StatusIcon = statusConfig.icon;
  
  // Función para obtener el último estado completado del timeline
  const getLastCompletedTimelineState = () => {
    console.log('🔍 Verificando timeline para operación:', operation.id, {
      hasTimeline: !!operation.timeline,
      hasStates: !!operation.timeline?.states,
      statesCount: operation.timeline?.states?.length || 0,
      states: operation.timeline?.states
    });
    
    if (!operation.timeline?.states || operation.timeline.states.length === 0) {
      console.log('⚠️ No hay timeline o estados para operación:', operation.id);
      return null;
    }
    
    // Filtrar estados completados y obtener el último
    const completedStates = operation.timeline.states.filter(state => state.status === 'completed');
    console.log('✅ Estados completados encontrados:', completedStates.length, completedStates);
    
    if (completedStates.length === 0) {
      console.log('⚠️ No hay estados completados para operación:', operation.id);
      return null;
    }
    
    // Retornar el último estado completado (el de mayor id o índice)
    const lastCompleted = completedStates[completedStates.length - 1];
    console.log('🎯 Último estado completado:', lastCompleted);
    return lastCompleted;
  };
  
  const lastCompletedState = getLastCompletedTimelineState();
  
  // Usar el último estado completado del timeline, sino currentPhaseName, sino el label del status config
  const displayLabel = lastCompletedState?.name || operation.currentPhaseName || statusConfig.label;
  
  console.log('🏷️ DisplayLabel final para operación', operation.id, ':', {
    lastCompletedStateName: lastCompletedState?.name,
    currentPhaseName: operation.currentPhaseName,
    statusConfigLabel: statusConfig.label,
    finalDisplayLabel: displayLabel
  });

  return (
    <div 
      onClick={onViewDetails}
      className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-primary-300"
    >
      {/* Card Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-gray-900 truncate mb-1">
              {operation.providerName}
            </h4>
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-gray-400" />
              <div className="flex flex-col">
                <span className="text-sm text-gray-600">
                  {operation.clientName}
                </span>
                {operation.clientNit && (() => {
                  const cleanNit = operation.clientNit.trim().toUpperCase();
                  const isRFC = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/.test(cleanNit);
                  
                  return (
                    <span className={cn(
                      "text-xs font-mono px-2 py-1 rounded",
                      isRFC ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                    )}>
                      {isRFC ? `RFC: ${operation.clientNit}` : `NIT: ${operation.clientNit}`}
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>
          <div className={cn(
            "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1",
            statusConfig.color
          )}>
            <StatusIcon className="h-3 w-3" />
            {displayLabel}
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 space-y-3">
        {/* Essential Fields Grid */}
        <div className="space-y-2 text-sm">
          {/* Valor Operación - PRIMERO Y MÁS PROMINENTE */}
          {operation.operationValue && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium">Valor Total:</span>
              <span className="font-bold text-primary-600 text-base">
                {operation.operationValue}
              </span>
            </div>
          )}

          {/* Valor Compra - Segundo */}
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-xs">Valor Compra:</span>
            <span className="text-gray-700 text-xs">
              {operation.totalValue}
            </span>
          </div>

          {/* Ruta Comercial */}
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Ruta Comercial:</span>
            <span className="font-medium text-gray-900 text-right text-xs">
              {operation.route}
            </span>
          </div>

          {/* Persona Asignada */}
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Persona Asignada:</span>
            <span className="font-medium text-gray-900 text-xs truncate max-w-[150px]" title={operation.assignedPerson}>
              {operation.assignedPerson}
            </span>
          </div>

          {/* Fecha de Actualización */}
          {operation.updatedAt && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Última Actualización:</span>
              <span className="font-medium text-gray-900 text-xs">
                {new Date(operation.updatedAt).toLocaleDateString('es-ES')}
              </span>
            </div>
          )}
        </div>

        {/* Progreso Visual */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Progreso</span>
            <span className="font-semibold text-gray-900">{operation.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                operation.progress === 100 ? "bg-success-500" : "bg-primary-600"
              )}
              style={{ width: `${Math.min(operation.progress, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}