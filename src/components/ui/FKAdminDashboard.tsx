/**
 * Dashboard específico para administradores
 * Muestra todas las operaciones del sistema
 */

import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  Users,
  DollarSign,
  BarChart3,
  ArrowRight,
  Shield,
  Search,
  Filter,
  X,
  Upload,
  FileText,
  CheckCircle2,
  Truck,
  Circle,
  Star,
  MessageSquare
} from 'lucide-react';
import { useAdminDashboardData } from '../../hooks/useAdminDashboardData';
import { useClientDocuments } from '../../hooks/useClientDocuments';
import { getCountryFromOperation } from '../../types/Documents';
import { cn } from '../../utils/cn';
import { useState, useMemo } from 'react';
import { environment, supabaseHeaders } from '../../config/environment';
import FKNPSAnalytics from './FKNPSAnalytics';

// Timeline phases mapping - 5 fases en orden secuencial
const TIMELINE_PHASES = [
  'Solicitud enviada',
  'Estado negociación',
  'Procesamiento de Pago a Proveedor',
  'Entrega de mercancía',
  'Operación Completada'
];

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
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: CheckCircle
  }
} as const;

type DocumentStatusType = keyof typeof DOCUMENT_STATUS_CONFIG;

// Function to calculate document status based on completion percentage
function getDocumentStatus(completionPercentage: number): DocumentStatusType {
  if (completionPercentage === 0) return 'no-iniciado';
  if (completionPercentage > 0 && completionPercentage < 50) return 'iniciado';
  if (completionPercentage >= 50 && completionPercentage < 100) return 'progreso';
  return 'completado';
}

// Helper function to get current phase - muestra la ÚLTIMA fase en proceso
function getCurrentTimelinePhase(operation: any): string {
  // Si la operación tiene datos de timeline, usarlos
  if (operation.timeline && operation.timeline.states && operation.timeline.states.length > 0) {
    // Ordenar timeline por id para asegurar secuencia correcta
    const sortedTimeline = [...operation.timeline.states].sort((a, b) => (a.id || 0) - (b.id || 0));
    
    // Buscar TODAS las fases que están 'in-progress' y devolver la ÚLTIMA (id más alto)
    let ultimaFaseEnProceso = null;
    for (const event of sortedTimeline) {
      if (event.status === 'in-progress') {
        ultimaFaseEnProceso = event;
      }
    }
    
    if (ultimaFaseEnProceso) {
      return ultimaFaseEnProceso.name;
    }
    
    // Si no hay fases en proceso, encontrar la última completada
    let ultimaCompletada = null;
    for (const event of sortedTimeline) {
      if (event.status === 'completed') {
        ultimaCompletada = event;
      }
    }
    
    if (ultimaCompletada) {
      return ultimaCompletada.name;
    }
    
    // Si no hay fases completadas ni en proceso, devolver la primera fase
    return sortedTimeline[0]?.name || TIMELINE_PHASES[0];
  }
  
  // Fallback: estimar fase basada en porcentaje de progreso
  const progress = operation.progress || 0;
  if (progress === 100) return 'Operación Completada';
  if (progress >= 80) return TIMELINE_PHASES[4]; // Completion phase
  if (progress >= 60) return TIMELINE_PHASES[3]; // Delivery phase
  if (progress >= 40) return TIMELINE_PHASES[2]; // Payment processing
  if (progress >= 20) return TIMELINE_PHASES[1]; // Negotiation
  return TIMELINE_PHASES[0]; // Initial phase
}

// Get phase color and icon
function getPhaseConfig(phaseName: string) {
  switch (phaseName) {
    case 'Solicitud enviada':
      return { color: 'bg-blue-100 text-blue-600 border-blue-200', icon: Clock };
    case 'Estado negociación':
      return { color: 'bg-orange-100 text-orange-600 border-orange-200', icon: TrendingUp };
    case 'Procesamiento de Pago a Proveedor':
      return { color: 'bg-purple-100 text-purple-600 border-purple-200', icon: DollarSign };
    case 'Entrega de mercancía':
      return { color: 'bg-indigo-100 text-indigo-600 border-indigo-200', icon: Truck };
    case 'Operación Completada':
      return { color: 'bg-success-100 text-success-600 border-success-200', icon: CheckCircle };
    default:
      return { color: 'bg-gray-100 text-gray-600 border-gray-200', icon: Clock };
  }
}

// Document Status Component for Admin Dashboard
interface DocumentStatusBadgeProps {
  operation: any;
}

function DocumentStatusBadge({ operation }: DocumentStatusBadgeProps) {
  console.log('🏷️ [ADMIN-DOCUMENTS-BADGE] Rendering for operation:', operation.id);
  
  try {
    const country = getCountryFromOperation(operation);
    console.log('🌍 [ADMIN-DOCUMENTS-BADGE] Country detected:', country);
    
    // Only show for Mexico operations  
    if (country !== 'MX') {
      console.log('⚠️ [ADMIN-DOCUMENTS-BADGE] Not Mexico operation, showing N/A');
      return (
        <div className="text-xs text-gray-500">
          N/A
        </div>
      );
    }

    const { checklist, isLoading, error } = useClientDocuments(operation.id, operation);
    console.log('📄 [ADMIN-DOCUMENTS-BADGE] useClientDocuments result:', { checklist, isLoading, error });
    
    if (isLoading) {
      return (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Cargando...
        </div>
      );
    }

    if (error) {
      console.error('❌ [ADMIN-DOCUMENTS-BADGE] Error loading documents:', error);
      return (
        <div className="text-xs text-red-500" title={`Error: ${error}`}>
          {error.includes('status:') ? error : `Error: ${error.slice(0, 15)}...`}
        </div>
      );
    }

    const completionPercentage = checklist?.completionPercentage || 0;
    const documentStatus = getDocumentStatus(completionPercentage);
    const statusConfig = DOCUMENT_STATUS_CONFIG[documentStatus];
    const StatusIcon = statusConfig.icon;

    console.log('✅ [ADMIN-DOCUMENTS-BADGE] Final status:', { completionPercentage, documentStatus, statusConfig });

    return (
      <div className={cn(
        "px-2 py-1 rounded text-xs font-medium flex items-center gap-1 border",
        statusConfig.color
      )}>
        <StatusIcon className="h-3 w-3" />
        <span className="hidden sm:inline">{statusConfig.label}</span>
        <span className="sm:hidden">{completionPercentage}%</span>
      </div>
    );
  } catch (error) {
    console.error('💥 [ADMIN-DOCUMENTS-BADGE] Error in component:', error);
    return (
      <div className="text-xs text-red-500">
        Error
      </div>
    );
  }
}

export default function FKAdminDashboard() {
  const navigate = useNavigate();
  
  // Local state for filters and country selection with persistence (sincronizado globalmente)
  const [selectedCountry, setSelectedCountry] = useState<'CO' | 'MX'>(() => {
    // Recuperar país seleccionado del sessionStorage (clave compartida)
    const savedCountry = sessionStorage.getItem('integra_selectedCountry');
    return (savedCountry === 'MX' || savedCountry === 'CO') ? savedCountry : 'CO';
  });
  
  // Tab state for admin sections
  const [activeTab, setActiveTab] = useState<'operations' | 'nps'>('operations');
  
  const { operations, isLoading, error, metadata, refetch } = useAdminDashboardData(selectedCountry);
  
  // Persistir país seleccionado cuando cambie (sincronizado globalmente)
  const handleCountryChange = (newCountry: 'CO' | 'MX') => {
    setSelectedCountry(newCountry);
    sessionStorage.setItem('integra_selectedCountry', newCountry);
    console.log(`🌍 Admin Dashboard - País cambiado a: ${newCountry}`);
  };
  
  // Local state for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'value' | 'progress' | 'updated'>('updated');
  
  // CSV Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    summary?: any;
  } | null>(null);

  // Filter and sort operations
  const filteredAndSortedOperations = useMemo(() => {
    let filtered = [...operations];
    
    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(op => 
        op.clientName.toLowerCase().includes(term) ||
        op.providerName.toLowerCase().includes(term) ||
        op.clientNit.toLowerCase().includes(term) ||
        op.assignedPerson.toLowerCase().includes(term) ||
        op.id.toLowerCase().includes(term)
      );
    }
    
    // Phase filter - now filtering by current phases instead of generic status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(op => {
        const currentPhase = getCurrentTimelinePhase(op);
        return currentPhase === statusFilter;
      });
    }
    
    // Sort operations
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.clientName.localeCompare(b.clientName);
        case 'value':
          return (b.totalValueNumeric || 0) - (a.totalValueNumeric || 0);
        case 'progress':
          return (b.progress || 0) - (a.progress || 0);
        case 'updated':
        default:
          return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
      }
    });
    
    return filtered;
  }, [operations, searchTerm, statusFilter, sortBy]);

  // Calculate admin statistics
  const stats = {
    totalOperations: operations.length,
    completedOperations: operations.filter(op => op.status === 'completed').length,
    inProgressOperations: operations.filter(op => op.status === 'in-progress').length,
    totalValue: operations.reduce((sum, op) => sum + (op.totalValueNumeric || 0), 0),
    uniqueClients: new Set(operations.map(op => op.clientNit)).size
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSortBy('updated');
  };

  const handleOperationClick = (operationId: string) => {
    console.log('🔍 [ADMIN DASHBOARD] Navegando a operación:', {
      operationId,
      url: `/admin/operation/${operationId}`
    });
    navigate(`/admin/operation/${operationId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'on-hold': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in-progress': return <Clock className="h-4 w-4" />;
      case 'on-hold': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // CSV Upload handler
  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadResult({
        success: false,
        message: 'Por favor selecciona un archivo CSV válido'
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setUploadResult({
        success: false,
        message: 'El archivo es demasiado grande. Máximo 5MB permitidos'
      });
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      // Read file content as text (same as FKCSVDataViewer)
      const csvContent = await file.text();
      
      console.log(`📤 Admin subiendo CSV para ${selectedCountry}:`, file.name);
      console.log(`📄 Contenido CSV: ${csvContent.length} caracteres`);

      // Use Supabase Edge Function with parser
      const response = await fetch(`${environment.apiBaseUrl}/upload-csv-with-parser`, {
        method: 'POST',
        headers: {
          ...supabaseHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          csvContent: csvContent,
          country: selectedCountry,
          fileName: file.name
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Error HTTP ${response.status}: ${errorData}`);
      }

      const result = await response.json();

      if (result.success) {
        const countryName = selectedCountry === 'CO' ? 'Colombia' : 'México';
        const operations = result.data?.operations || [];
        const girosTotales = operations.reduce((sum: number, op: any) => sum + (op.giros_count || 0), 0);
        const liberacionesTotales = operations.reduce((sum: number, op: any) => sum + (op.liberaciones_count || 0), 0);
        const creadas = result.data?.created || 0;
        const actualizadas = result.data?.updated || 0;
        const eliminadas = result.data?.deleted || 0;
        
        setUploadResult({
          success: true,
          message: `✅ Sync completo con parser original (${countryName}):\n` +
                   `📊 ${result.data.processed} operaciones procesadas de ${result.data.total} registros\n` +
                   `➕ ${creadas} operaciones nuevas creadas\n` +
                   `🔄 ${actualizadas} operaciones existentes actualizadas\n` +
                   `🗑️ ${eliminadas} operaciones eliminadas (ya no en CSV)\n` +
                   `💸 ${girosTotales} giros extraídos\n` +
                   `📈 ${liberacionesTotales} liberaciones detectadas`,
          summary: {
            processed: result.data.processed,
            created: creadas,
            updated: actualizadas,
            deleted: eliminadas,
            total: result.data.total,
            giros: girosTotales,
            liberaciones: liberacionesTotales
          }
        });
        
        // Refrescar datos después de upload exitoso
        setTimeout(() => {
          refetch();
        }, 1000);
      } else {
        throw new Error(result.message || 'Error procesando el archivo');
      }
    } catch (error) {
      console.error('Error uploading CSV:', error);
      setUploadResult({
        success: false,
        message: 'Error de conexión al subir el archivo'
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-error-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar datos</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refetch}
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
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('operations')}
              className={cn(
                "py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-2",
                activeTab === 'operations'
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              <Shield className="h-4 w-4" />
              Panel de Operaciones
            </button>
            <button
              onClick={() => setActiveTab('nps')}
              className={cn(
                "py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-2",
                activeTab === 'nps'
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              <Star className="h-4 w-4" />
              Analytics NPS
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'operations' ? (
        <>
          {/* Admin Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Operaciones</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOperations}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Completadas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedOperations}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">En Progreso</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.inProgressOperations}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Clientes Únicos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.uniqueClients}</p>
                </div>
              </div>
            </div>
          </div>

      {/* Operations Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Todas las Operaciones 
                </h2>
                <p className="text-sm text-gray-600">
                  {filteredAndSortedOperations.length} de {operations.length} operaciones
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Country Selector */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">País:</label>
                <select
                  value={selectedCountry}
                  onChange={(e) => {
                    const newCountry = e.target.value as 'CO' | 'MX';
                    handleCountryChange(newCountry);
                  }}
                  disabled={isUploading}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="CO">🇨🇴 Colombia</option>
                  <option value="MX">🇲🇽 México</option>
                </select>
              </div>

              {/* Upload CSV Button */}
              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  disabled={isUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  id="csv-upload-input"
                />
                <label
                  htmlFor="csv-upload-input"
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer",
                    isUploading
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-green-50 text-green-700 hover:bg-green-100"
                  )}
                >
                  <Upload className={cn("h-4 w-4", isUploading && "animate-pulse")} />
                  {isUploading ? `Subiendo ${selectedCountry}...` : `Subir CSV ${selectedCountry}`}
                </label>
              </div>

              {/* Refresh Button */}
              <button
                onClick={refetch}
                disabled={isLoading}
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors",
                  isLoading
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-primary-50 text-primary-700 hover:bg-primary-100"
                )}
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                {isLoading ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>
          </div>
          
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por ID operación, cliente, proveedor, RFC/NIT o persona asignada..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">Todas las fases</option>
                {TIMELINE_PHASES.map((phase) => (
                  <option key={phase} value={phase}>
                    {phase.length > 25 ? phase.substring(0, 25) + '...' : phase}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Sort By */}
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="updated">Recién actualizadas</option>
                <option value="name">Nombre cliente</option>
                <option value="value">Valor (mayor a menor)</option>
                <option value="progress">Progreso (mayor a menor)</option>
              </select>
            </div>
            
            {/* Clear Filters */}
            {(searchTerm || statusFilter !== 'all' || sortBy !== 'updated') && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                title="Limpiar filtros"
              >
                <X className="h-4 w-4" />
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Upload Result Notification */}
        {uploadResult && (
          <div className={cn(
            "mx-6 mb-4 p-4 rounded-lg border",
            uploadResult.success
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          )}>
            <div className="flex items-start gap-3">
              {uploadResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className="font-medium">{uploadResult.message}</p>
                {uploadResult.success && uploadResult.summary && (
                  <div className="mt-2 text-sm space-y-1">
                    <p>• Filas procesadas: {uploadResult.summary.rowsProcessed}</p>
                    <p>• Operaciones anteriores: {uploadResult.summary.previousRows}</p>
                    <p>• Operaciones válidas: {uploadResult.summary.validOperations}</p>
                    {uploadResult.summary.errorCount > 0 && (
                      <p>• Errores encontrados: {uploadResult.summary.errorCount}</p>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => setUploadResult(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando operaciones...</p>
          </div>
        ) : filteredAndSortedOperations.length === 0 ? (
          <div className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {operations.length === 0 ? 'No hay operaciones' : 'No se encontraron operaciones'}
            </h3>
            <p className="text-gray-600">
              {operations.length === 0 
                ? 'No se encontraron operaciones en el sistema.'
                : 'Intenta ajustar los filtros de búsqueda.'}
            </p>
            {(searchTerm || statusFilter !== 'all') && (
              <button
                onClick={clearFilters}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
              >
                <X className="h-4 w-4" />
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                    Cliente / RFC-NIT
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Proveedor
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    Valores
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Fase Actual
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                    Progreso
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                    Documentos
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAndSortedOperations.map((operation) => (
                  <tr key={operation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div>
                          <p className="font-medium text-gray-900">{operation.clientName}</p>
                        </div>
                        <p className="text-sm text-gray-600">
                          {(() => {
                            const cleanNit = operation.clientNit.trim().toUpperCase();
                            const isRFC = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/.test(cleanNit);
                            return isRFC ? `RFC: ${operation.clientNit}` : `NIT: ${operation.clientNit}`;
                          })()}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-gray-900 text-sm truncate" title={operation.providerName}>
                        {operation.providerName}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {/* Valor Total - PRIMERO Y MÁS PROMINENTE */}
                        <div>
                          <p className="font-bold text-primary-600 text-base whitespace-nowrap">
                            {operation.totalValue}
                          </p>
                          <p className="text-xs text-gray-500">Valor Total</p>
                        </div>
                        {/* Valor Compra - Más pequeño */}
                        {operation.operationValue && (
                          <div>
                            <p className="text-sm text-gray-700 whitespace-nowrap">{operation.operationValue}</p>
                            <p className="text-xs text-gray-400">Valor compra</p>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const currentPhase = getCurrentTimelinePhase(operation);
                        const phaseConfig = getPhaseConfig(currentPhase);
                        const PhaseIcon = phaseConfig.icon;
                        
                        // Show different styling for completed operations
                        const isCompleted = currentPhase === 'Operación Completada';
                        
                        return (
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                            phaseConfig.color,
                            isCompleted && "ring-1 ring-success-300"
                          )}>
                            <PhaseIcon className="h-3 w-3" />
                            <span className="max-w-[120px] truncate" title={currentPhase}>
                              {isCompleted 
                                ? 'Completada' 
                                : currentPhase.length > 15 
                                  ? currentPhase.substring(0, 15) + '...' 
                                  : currentPhase
                              }
                            </span>
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${operation.progress}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700 min-w-[3rem]">
                          {operation.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <DocumentStatusBadge operation={operation} />
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleOperationClick(operation.id)}
                        className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        Ver detalles
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Metadata Information */}
      {metadata && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Última actualización: {new Date(metadata.lastUpdated).toLocaleString()}</span>
            <span>
              Operaciones válidas: {metadata.processingStats?.validOperations || 0} | 
              Errores: {metadata.processingStats?.errorCount || 0}
            </span>
          </div>
        </div>
      )}
        </>
      ) : (
        /* NPS Analytics Tab */
        <FKNPSAnalytics />
      )}
    </div>
  );
}