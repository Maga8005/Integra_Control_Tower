import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  Clock, 
  Circle, 
  User, 
  FileText, 
  DollarSign, 
  Truck, 
  Calendar,
  Building,
  ArrowRight,
  Eye,
  Filter,
  Search,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Operation, TimelineEvent, TimelineStatus, OperationStatus } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useDashboardData, BackendOperationCard, TimelineState, Timeline } from '../../hooks/useDashboardData';
import { useAdminDashboardData } from '../../hooks/useAdminDashboardData';
import { cn } from '../../utils/cn';

// Helper functions
function getLastCompletedState(timeline?: Timeline): string {
  if (!timeline || !timeline.states) return 'Sin estados';
  
  const completedStates = timeline.states.filter(state => state.status === 'completed');
  if (completedStates.length === 0) return 'Sin estados completados';
  
  // Get the last completed state (highest id)
  const lastCompleted = completedStates.reduce((latest, current) => 
    current.id > latest.id ? current : latest
  );
  
  return lastCompleted.name;
}

// Timeline step configuration - Updated to match backend 5 states
const TIMELINE_STEPS = {
  1: {
    label: 'Solicitud Enviada',
    description: 'Firma de cotización y confirmación inicial',
    icon: User,
    color: 'coral'
  },
  2: {
    label: 'Documentos y Pago Cuota Operacional',
    description: 'Documentación legal y pago de cuota operacional',
    icon: FileText,
    color: 'primary'
  },
  3: {
    label: 'Procesamiento de Pago',
    description: 'Procesamiento de pagos y términos financieros',
    icon: DollarSign,
    color: 'yellow'
  },
  4: {
    label: 'Envío y Logística',
    description: 'Coordinación de envío y seguimiento de mercancías',
    icon: Truck,
    color: 'blue'
  },
  5: {
    label: 'Operación Completada',
    description: 'Mercancías entregadas y operación finalizada',
    icon: CheckCircle,
    color: 'success'
  }
} as const;

// Status styling configuration
const STATUS_STYLES = {
  completed: {
    icon: CheckCircle,
    iconColor: 'text-success-600',
    bgColor: 'bg-success-100',
    borderColor: 'border-success-300',
    lineColor: 'bg-success-300'
  },
  current: {
    icon: Clock,
    iconColor: 'text-coral-600',
    bgColor: 'bg-coral-100',
    borderColor: 'border-coral-300',
    lineColor: 'bg-gray-300'
  },
  pending: {
    icon: Circle,
    iconColor: 'text-gray-400',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    lineColor: 'bg-gray-200'
  }
} as const;

interface FKTimelineProps {
  className?: string;
  operationId?: string;
  showAllOperations?: boolean;
}

export default function FKTimeline({ 
  className, 
  operationId, 
  showAllOperations = false 
}: FKTimelineProps) {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'draft' | 'in-progress' | 'completed' | 'on-hold' | 'all'>('all');

  // Use real backend data - switch between admin and client data
  const { operations, isLoading, error, refetch } = user?.role === 'administrator' 
    ? useAdminDashboardData() 
    : useDashboardData();
  
  // Filter operations based on user role and permissions
  const availableOperations = useMemo(() => {
    if (!operations || operations.length === 0) {
      return [];
    }
    
    let filteredOps = [...operations];

    // Role-based filtering - FIXED
    if (user?.role === 'client_with_operations' && user?.company) {
      // Clients with operations see their company's operations
      const beforeRoleFilter = filteredOps.length;
      filteredOps = filteredOps.filter(op => 
        op.clientName.toLowerCase().includes(user.company?.toLowerCase() || '') ||
        op.assignedPerson.toLowerCase().includes(user.company?.toLowerCase() || '')
      );
      
      // If no operations match the company filter, show all operations (for demo purposes)
      if (filteredOps.length === 0) {
        filteredOps = [...operations];
      }
    } else if (user?.role === 'client_without_operations') {
      // New clients don't have operations to show
      filteredOps = [];
    }
    // Admin users or other roles see all operations by default

    // Search filtering
    if (searchTerm) {
      filteredOps = filteredOps.filter(op => 
        op.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        op.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        op.assignedPerson.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filtering
    if (statusFilter !== 'all') {
      filteredOps = filteredOps.filter(op => op.status === statusFilter);
    }

    return filteredOps.sort((a, b) => 
      new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
    );
  }, [operations, user, searchTerm, statusFilter]);

  // Get current operation for timeline display
  const currentOperation = useMemo(() => {
    if (operationId) {
      return availableOperations.find(op => op.id === operationId);
    }
    if (selectedOperation && availableOperations.some(op => op.id === selectedOperation)) {
      return availableOperations.find(op => op.id === selectedOperation);
    }
    // Only show the first operation if there are available operations
    return availableOperations.length > 0 ? availableOperations[0] : null;
  }, [operationId, selectedOperation, availableOperations]);

  // Set initial selected operation
  useEffect(() => {
    if (availableOperations.length === 0) {
      // Clear selection when no operations are available
      setSelectedOperation(null);
    } else if (!selectedOperation && !operationId) {
      // Set first operation when operations are available and none is selected
      setSelectedOperation(availableOperations[0].id);
    } else if (selectedOperation && !availableOperations.some(op => op.id === selectedOperation)) {
      // Clear selection if selected operation is not in filtered results
      setSelectedOperation(availableOperations.length > 0 ? availableOperations[0].id : null);
    }
  }, [availableOperations, selectedOperation, operationId]);

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
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("p-6 space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-primary-700">
            Cronograma de Operaciones
          </h1>
          <p className="text-gray-600 mt-1">
            {user?.role === 'client_with_operations' 
              ? 'Selecciona una operación de la lista para ver su cronograma detallado'
              : user?.role === 'client_without_operations'
              ? 'Aquí podrás ver el cronograma de tus operaciones futuras'
              : 'Seguimiento detallado del progreso de operaciones de financiamiento'
            }
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            {availableOperations.length} operación{availableOperations.length !== 1 ? 'es' : ''} disponible{availableOperations.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {showAllOperations && (
        <>
          {/* Filters and Search */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por ID, cliente o proveedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'draft' | 'in-progress' | 'completed' | 'on-hold' | 'all')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="draft">Borrador</option>
                  <option value="in-progress">En Progreso</option>
                  <option value="on-hold">En Pausa</option>
                  <option value="completed">Completada</option>
                </select>
              </div>
            </div>
          </div>

          {/* Operations List */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Seleccionar Operación para Ver Cronograma
              </h3>
            </div>
            <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
              {availableOperations.length > 0 ? (
                availableOperations.map((operation) => (
                  <button
                    key={operation.id}
                    onClick={() => setSelectedOperation(operation.id)}
                    className={cn(
                      "w-full p-4 text-left hover:bg-gray-50 transition-colors",
                      selectedOperation === operation.id && "bg-primary-50 border-r-4 border-primary-500"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {operation.providerName}
                        </h4>
                        <p className="text-sm text-gray-600">{operation.clientName}</p>
                        <p className="text-xs text-gray-500">{operation.id}</p>
                      </div>
                      <div className="text-right">
                        <div className={cn(
                          "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                          getLastCompletedState(operation.timeline) !== 'Sin estados completados' ? 'bg-success-100 text-success-600' :
                          'bg-gray-100 text-gray-600'
                        )}>
                          {getLastCompletedState(operation.timeline)}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{operation.progress}% completado</p>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm">
                    {user?.role === 'client_without_operations'
                      ? 'No tienes operaciones disponibles para mostrar'
                      : 'No se encontraron operaciones que coincidan con los filtros'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Timeline Display */}
      {currentOperation ? (
        <TimelineDisplay 
          operation={currentOperation} 
          canEdit={hasPermission('update_operation_status')}
        />
      ) : (
        <div className="bg-white rounded-lg p-12 border border-gray-200 shadow-sm text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            {user?.role === 'client_without_operations' 
              ? 'No tienes operaciones activas'
              : 'No hay operaciones disponibles'
            }
          </h4>
          <p className="text-gray-600">
            {user?.role === 'client_without_operations'
              ? 'Como cliente nuevo, aún no tienes operaciones de financiamiento para mostrar en el cronograma.'
              : 'No se encontraron operaciones que coincidan con los filtros seleccionados.'
            }
          </p>
        </div>
      )}
    </div>
  );
}

// Timeline Display Component
interface TimelineDisplayProps {
  operation: BackendOperationCard;
  canEdit?: boolean;
}

function TimelineDisplay({ operation, canEdit }: TimelineDisplayProps) {
  // Get timeline data from the operation, or create default empty timeline
  const timeline = operation.timeline;
  
  if (!timeline || !timeline.states) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="text-center text-gray-500">
          <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p>No hay datos de timeline disponibles para esta operación</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Operation Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {operation.providerName}
            </h3>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Building className="h-4 w-4" />
                {operation.clientName}
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {operation.totalValue}
              </div>
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {operation.assignedPerson}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">ID: {operation.id}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{timeline.overallProgress}% Completado</p>
              <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${timeline.overallProgress}%` }}
                />
              </div>
            </div>
            {canEdit && (
              <button className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Gestionar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Timeline Steps */}
      <div className="p-6">
        <div className="relative">
          {timeline.states.map((state, index) => {
            const isLast = index === timeline.states.length - 1;
            const isCurrent = timeline.currentState === state.id;
            
            // Determine status style based on state status
            let statusStyle;
            if (state.status === 'completed') {
              statusStyle = STATUS_STYLES.completed;
            } else if (state.status === 'in-progress' || isCurrent) {
              statusStyle = STATUS_STYLES.current;
            } else {
              statusStyle = STATUS_STYLES.pending;
            }
            
            const StatusIcon = statusStyle.icon;
            const stepConfig = TIMELINE_STEPS[state.id as keyof typeof TIMELINE_STEPS];
            const StepIcon = stepConfig?.icon || Circle;
            
            return (
              <div key={state.id} className="relative flex items-start pb-8">
                {/* Connecting Line */}
                {!isLast && (
                  <div className={cn(
                    "absolute left-6 top-12 w-0.5 h-16",
                    statusStyle.lineColor
                  )} />
                )}
                
                {/* Timeline Node */}
                <div className={cn(
                  "relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2",
                  statusStyle.bgColor,
                  statusStyle.borderColor
                )}>
                  <StepIcon className={cn("h-5 w-5", statusStyle.iconColor)} />
                </div>

                {/* Timeline Content */}
                <div className="ml-6 flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className={cn(
                        "text-base font-semibold",
                        state.status === 'completed' ? 'text-success-700' :
                        state.status === 'in-progress' || isCurrent ? 'text-coral-700' :
                        'text-gray-700'
                      )}>
                        {state.name}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {state.description}
                      </p>
                      {state.notes && (
                        <p className="text-xs text-gray-500 mt-1">
                          {state.notes}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        {state.completedAt && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(state.completedAt).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{state.progress}% completado</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <div className={cn(
                      "ml-4 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1",
                      state.status === 'completed' ? 'bg-success-100 text-success-700' :
                      state.status === 'in-progress' || isCurrent ? 'bg-coral-100 text-coral-700' :
                      state.status === 'blocked' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    )}>
                      {state.status === 'completed' && 'Completado'}
                      {state.status === 'in-progress' && 'En Progreso'}
                      {state.status === 'blocked' && 'Bloqueado'}
                      {state.status === 'pending' && 'Pendiente'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}