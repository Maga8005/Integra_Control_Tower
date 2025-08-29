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
  RefreshCw,
  CreditCard,
  Circle
} from 'lucide-react';
import { Operation, OperationStatus, DashboardStats } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useNewUser } from '../../hooks/useNewUser';
import { useDashboardData, BackendOperationCard } from '../../hooks/useDashboardData';
import { useClientDocuments } from '../../hooks/useClientDocuments';
import { getCountryFromOperation } from '../../types/Documents';
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

// Nueva configuración de fases del timeline
const PHASE_CONFIG = {
  'Solicitud enviada': {
    label: 'Solicitud enviada',
    color: 'bg-blue-100 text-blue-600 border-blue-200',
    icon: FileText
  },
  'Estado negociación': {
    label: 'Estado negociación', 
    color: 'bg-orange-100 text-orange-600 border-orange-200',
    icon: User
  },
  'Procesamiento de Pago a Proveedor': {
    label: 'Procesamiento de Pago',
    color: 'bg-green-100 text-green-600 border-green-200', 
    icon: CreditCard
  }
} as const;

// Document status configuration
const DOCUMENT_STATUS_CONFIG = {
  'no-iniciado': {
    label: 'No Iniciado',
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: Circle
  },
  'iniciado': {
    label: 'Iniciado',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: Clock
  },
  'progreso': {
    label: 'En Progreso',
    color: 'bg-blue-100 text-blue-700 border-blue-200', 
    icon: RefreshCw
  },
  'completado': {
    label: 'Completado',
    color: 'bg-success-100 text-success-700 border-success-200',
    icon: CheckCircle
  }
} as const;

type BackendStatus = 'draft' | 'in-progress' | 'completed' | 'on-hold';
type DocumentStatusType = keyof typeof DOCUMENT_STATUS_CONFIG;
type TimelinePhase = keyof typeof PHASE_CONFIG;

// Function to calculate document status based on completion percentage
function getDocumentStatus(completionPercentage: number): DocumentStatusType {
  if (completionPercentage === 0) return 'no-iniciado';
  if (completionPercentage > 0 && completionPercentage < 50) return 'iniciado';
  if (completionPercentage >= 50 && completionPercentage < 100) return 'progreso';
  return 'completado';
}

interface FKDashboardProps {
  className?: string;
}

export default function FKDashboard({ className }: FKDashboardProps) {
  const { user, hasPermission } = useAuth();
  const { resetWelcomeState, hasExistingOperations, isNewUser } = useNewUser();
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState<BackendStatus | 'all'>('all');
  const [selectedPhase, setSelectedPhase] = useState<string | 'all'>('all');
  
  // Usar el hook personalizado para obtener datos del backend
  const { operations, isLoading, error, metadata, refetch } = useDashboardData();

  // TODOS LOS HOOKS DEBEN IR ANTES DE CUALQUIER RETURN CONDICIONAL
  // Filter operations based on status and phase
  const filteredOperations = useMemo(() => {
    console.log('🔍 Filtrando operaciones:', {
      operationsCount: operations?.length || 0,
      selectedStatus,
      selectedPhase,
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

    // Phase filtering
    if (selectedPhase !== 'all') {
      const beforeFilter = filtered.length;
      filtered = filtered.filter(op => {
        const lastCompletedPhase = getLastCompletedTimelinePhase(op);
        return lastCompletedPhase === selectedPhase;
      });
      console.log(`🔍 Filtro por fase "${selectedPhase}": ${beforeFilter} → ${filtered.length}`);
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
  }, [operations, selectedStatus, selectedPhase]);

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
      all: operations?.length || 0,
      draft: 0,
      'in-progress': 0,
      'on-hold': 0,
      completed: 0
    };

    if (operations) {
      operations.forEach(op => {
        counts[op.status]++;
      });
    }

    return counts;
  }, [operations]);

  // Función para obtener la última fase completada del timeline
  const getLastCompletedTimelinePhase = (operation: any): string | null => {
    if (!operation.timeline?.states || operation.timeline.states.length === 0) {
      return null;
    }
    
    const completedStates = operation.timeline.states.filter((state: any) => state.status === 'completed');
    if (completedStates.length === 0) {
      return null;
    }
    
    return completedStates[completedStates.length - 1]?.name || null;
  };

  // Get phase counts from backend data
  const phaseCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: operations?.length || 0
    };

    // Initialize phase counts
    Object.keys(PHASE_CONFIG).forEach(phase => {
      counts[phase] = 0;
    });

    if (operations) {
      operations.forEach(op => {
        const lastCompletedPhase = getLastCompletedTimelinePhase(op);
        if (lastCompletedPhase && counts[lastCompletedPhase] !== undefined) {
          counts[lastCompletedPhase]++;
        }
      });
    }

    return counts;
  }, [operations]);

  // AHORA SÍ PUEDEN IR LOS RETURNS CONDICIONALES
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

      {/* Filters */}
      <div className="space-y-4">
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

        {/* Phase Filters */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtrar por Fase</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedPhase('all')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
                selectedPhase === 'all'
                  ? "bg-primary-600 text-white border-primary-600"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              )}
            >
              Todas ({phaseCounts.all})
            </button>
            {(Object.entries(PHASE_CONFIG) as [TimelinePhase, typeof PHASE_CONFIG[TimelinePhase]][]).map(([phase, config]) => {
              const PhaseIcon = config.icon;
              return (
                <button
                  key={phase}
                  onClick={() => setSelectedPhase(phase)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors border flex items-center gap-2",
                    selectedPhase === phase
                      ? "bg-primary-600 text-white border-primary-600"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  )}
                >
                  <PhaseIcon className="h-4 w-4" />
                  {config.label} ({phaseCounts[phase] || 0})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Operations Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Operaciones 
            {selectedStatus !== 'all' && `- ${STATUS_CONFIG[selectedStatus as BackendStatus]?.label}`}
            {selectedPhase !== 'all' && ` - ${PHASE_CONFIG[selectedPhase as TimelinePhase]?.label}`}
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

// Document Status Component
interface DocumentStatusBadgeProps {
  operation: BackendOperationCard;
}

function DocumentStatusBadge({ operation }: DocumentStatusBadgeProps) {
  // Determinar el país basado en la ruta comercial o país importador
  const getCountry = (): 'MX' | 'CO' => {
    const route = operation.route || '';
    const paisImportador = operation.route?.split('→')[1]?.trim().toLowerCase() || '';
    
    if (paisImportador.includes('méxico') || paisImportador.includes('mexico')) {
      return 'MX';
    }
    if (paisImportador.includes('colombia')) {
      return 'CO';
    }
    
    // Fallback: si no se puede determinar, usar Colombia
    return 'CO';
  };

  const country = getCountry();
  
  // Usar datos reales de documentos de la base de datos
  const getDocumentStatus = () => {
    const realPercentage = operation.documentCompletion || 0;
    
    if (realPercentage === 0) {
      return {
        label: 'No Iniciado',
        color: 'bg-gray-100 text-gray-600',
        percentage: 0
      };
    } else if (realPercentage < 30) {
      return {
        label: 'Iniciado',
        color: 'bg-yellow-100 text-yellow-700',
        percentage: realPercentage
      };
    } else if (realPercentage < 100) {
      return {
        label: 'En Progreso',
        color: 'bg-blue-100 text-blue-700',
        percentage: realPercentage
      };
    } else {
      return {
        label: 'Completado',
        color: 'bg-success-100 text-success-700',
        percentage: 100
      };
    }
  };

  const documentStatus = getDocumentStatus();
  const countryName = country === 'MX' ? 'MX' : 'CO';

  return (
    <div 
      className={`text-xs px-2 py-1 rounded border ${documentStatus.color} whitespace-nowrap`}
      title={`${countryName}: ${documentStatus.label} (${documentStatus.percentage}%)`}
    >
      {/* Versión completa para pantallas grandes */}
      <span className="hidden sm:inline">
        {countryName}: {documentStatus.label} ({documentStatus.percentage}%)
      </span>
      {/* Versión compacta para móviles */}
      <span className="sm:hidden">
        {countryName}: {documentStatus.percentage}%
      </span>
    </div>
  );
}

// Backend Operation Card Component
interface DashboardOperationCardProps {
  operation: BackendOperationCard;
  onViewDetails?: () => void;
}

function DashboardOperationCard({ operation, onViewDetails }: DashboardOperationCardProps) {
  console.log('🎯 [DASHBOARD-CARD] Renderizando tarjeta para operación:', operation.id);
  console.log('🎯 [DASHBOARD-CARD] Status de la operación:', operation.status);
  console.log('🎯 [DASHBOARD-CARD] Fase actual del timeline:', operation.currentPhaseName);
  
  // Validar que el status existe en STATUS_CONFIG, sino usar un fallback
  const statusConfig = STATUS_CONFIG[operation.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG['draft'];
  
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
  
  // Priorizar el currentPhaseName (último estado en progreso), sino el último completado, sino el status
  const displayLabel = operation.currentPhaseName || lastCompletedState?.name || statusConfig.label;
  
  // Configuración del badge basada en la fase del timeline o status
  const phaseConfig = lastCompletedState?.name && PHASE_CONFIG[lastCompletedState.name as TimelinePhase] 
    ? PHASE_CONFIG[lastCompletedState.name as TimelinePhase]
    : statusConfig;
    
  const BadgeIcon = phaseConfig.icon;
  
  console.log('🏷️ DisplayLabel final para operación', operation.id, ':', {
    lastCompletedStateName: lastCompletedState?.name,
    currentPhaseName: operation.currentPhaseName,
    statusConfigLabel: statusConfig.label,
    finalDisplayLabel: displayLabel,
    usingPhaseConfig: !!phaseConfig
  });
  
  // Usar el progreso real de la operación del backend
  const timelineProgress = operation.progress || 0;

  return (
    <div 
      onClick={onViewDetails}
      className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-primary-300"
    >
      {/* Card Header - Layout en 3 líneas */}
      <div className="p-3 sm:p-4 border-b border-gray-100 space-y-2">
        
        {/* Línea 1: Nombre del Proveedor */}
        <div className="w-full">
          <h4 
            className="text-base sm:text-lg font-semibold text-primary-700 truncate"
            title={operation.providerName || 'Proveedor'}
          >
            {operation.providerName || 'Proveedor'}
          </h4>
        </div>
        
        {/* Línea 2: Subtítulo */}
        <div className="w-full">
          <p className="text-xs sm:text-sm text-gray-500">
            Proveedor Internacional
          </p>
        </div>
        
        {/* Línea 3: Estado del Proceso */}
        <div className="w-full">
          <div className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border",
            phaseConfig.color
          )}
          title={displayLabel}
          >
            <BadgeIcon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {displayLabel}
            </span>
          </div>
        </div>
        
      </div>

      {/* Card Content - Información Esencial */}
      <div className="p-3 sm:p-4 space-y-3">
        <div className="space-y-3">
          
          {/* Valor Total de la Operación - MÁS PROMINENTE */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-700 font-medium text-xs sm:text-sm flex items-center gap-1">
              💰 <span className="hidden sm:inline">Valor Total:</span><span className="sm:hidden">Total:</span>
            </span>
            <span className="font-bold text-primary-600 text-sm sm:text-lg truncate ml-2">
              {operation.totalValue}
            </span>
          </div>

          {/* Persona Asignada */}
          <div className="flex items-start justify-between gap-2">
            <span className="text-gray-600 flex items-center gap-1 text-xs sm:text-sm flex-shrink-0">
              <Building className="h-3 w-3" />
              <span className="hidden sm:inline">Persona Asignada:</span>
              <span className="sm:hidden">Asignado:</span>
            </span>
            <span 
              className="font-medium text-gray-900 text-xs sm:text-sm text-right truncate max-w-[120px] sm:max-w-[160px]" 
              title={operation.assignedPerson}
            >
              {operation.assignedPerson || 'No asignado'}
            </span>
          </div>

          {/* Estado de Documentos */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-600 flex items-center gap-1 text-xs sm:text-sm flex-shrink-0">
              📋 <span className="hidden sm:inline">Documentos:</span><span className="sm:hidden">Docs:</span>
            </span>
            <div className="flex-shrink-0">
              <DocumentStatusBadge operation={operation} />
            </div>
          </div>
          
        </div>

        {/* Progreso Visual - Responsive */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-xs sm:text-sm">Progreso</span>
            <span className="font-semibold text-gray-900 text-xs sm:text-sm">{timelineProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                timelineProgress === 100 ? "bg-success-500" : "bg-primary-600"
              )}
              style={{ width: `${Math.min(timelineProgress, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}