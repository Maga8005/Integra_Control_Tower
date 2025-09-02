import { useState, useMemo } from 'react';
import {
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  EyeOff,
  Download,
  Filter,
  Search,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  FileText
} from 'lucide-react';
import { ReembolsoOperacion, EstadoProceso, Currency } from '../../types/Operation';
import { cn } from '../../utils/cn';

// Configuración de estados para reembolsos
const REIMBURSEMENT_STATUS_CONFIG = {
  [EstadoProceso.PENDIENTE]: {
    label: 'Pendiente',
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: Clock
  },
  [EstadoProceso.EN_PROCESO]: {
    label: 'En Proceso',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: AlertCircle
  },
  [EstadoProceso.COMPLETADO]: {
    label: 'Completado',
    color: 'bg-success-100 text-success-700 border-success-200',
    icon: CheckCircle
  },
  [EstadoProceso.RECHAZADO]: {
    label: 'Rechazado',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: AlertCircle
  }
} as const;

interface FKAdminReimbursementPanelProps {
  reembolsos: ReembolsoOperacion[];
  className?: string;
}

export default function FKAdminReimbursementPanel({
  reembolsos = [],
  className
}: FKAdminReimbursementPanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<EstadoProceso | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar reembolsos
  const filteredReembolsos = useMemo(() => {
    let filtered = [...reembolsos];

    // Filtrar por estado
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(r => r.estado_reembolso === selectedStatus);
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.concepto.toLowerCase().includes(term) ||
        r.id.toLowerCase().includes(term) ||
        r.operacion_id.toLowerCase().includes(term)
      );
    }

    // Ordenar por fecha (más recientes primero)
    return filtered.sort((a, b) => {
      if (!a.fecha_reembolso && !b.fecha_reembolso) return 0;
      if (!a.fecha_reembolso) return 1;
      if (!b.fecha_reembolso) return -1;
      return new Date(b.fecha_reembolso).getTime() - new Date(a.fecha_reembolso).getTime();
    });
  }, [reembolsos, selectedStatus, searchTerm]);

  // Estadísticas de reembolsos
  const reimbursementStats = useMemo(() => {
    const total = reembolsos.length;
    const totalAmount = reembolsos.reduce((sum, r) => sum + r.monto_reembolso, 0);
    const pendientes = reembolsos.filter(r => r.estado_reembolso === EstadoProceso.PENDIENTE).length;
    const completados = reembolsos.filter(r => r.estado_reembolso === EstadoProceso.COMPLETADO).length;
    const completedAmount = reembolsos
      .filter(r => r.estado_reembolso === EstadoProceso.COMPLETADO)
      .reduce((sum, r) => sum + r.monto_reembolso, 0);

    return {
      total,
      totalAmount,
      pendientes,
      completados,
      completedAmount,
      pendingAmount: totalAmount - completedAmount
    };
  }, [reembolsos]);

  if (reembolsos.length === 0) {
    return (
      <div className={cn("bg-white rounded-lg border border-gray-200", className)}>
        <div className="p-6 text-center">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Sin Reembolsos Registrados
          </h3>
          <p className="text-gray-600">
            No hay reembolsos de fideicomiso registrados en el sistema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-white rounded-lg border border-gray-200", className)}>
      {/* Header con toggle de visibilidad */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Reembolsos Fideicomiso
              </h3>
              <p className="text-sm text-gray-600">
                Panel administrativo - {reembolsos.length} reembolso{reembolsos.length !== 1 ? 's' : ''} registrado{reembolsos.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
          >
            {isVisible ? (
              <>
                <EyeOff className="h-4 w-4" />
                Ocultar
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Mostrar ({reembolsos.length})
              </>
            )}
          </button>
        </div>

        {/* Estadísticas rápidas - siempre visible */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 font-medium">Total Reembolsos</p>
            <p className="text-lg font-bold text-gray-900">
              ${reimbursementStats.totalAmount.toLocaleString()}
            </p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3">
            <p className="text-xs text-yellow-700 font-medium">Pendientes</p>
            <p className="text-lg font-bold text-yellow-800">
              {reimbursementStats.pendientes}
            </p>
          </div>
          <div className="bg-success-50 rounded-lg p-3">
            <p className="text-xs text-success-700 font-medium">Completados</p>
            <p className="text-lg font-bold text-success-800">
              {reimbursementStats.completados}
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-3">
            <p className="text-xs text-red-700 font-medium">Monto Pendiente</p>
            <p className="text-lg font-bold text-red-800">
              ${reimbursementStats.pendingAmount.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Contenido detallado - solo visible cuando isVisible es true */}
      {isVisible && (
        <div className="p-6 space-y-6">
          {/* Controles de filtros */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por concepto, ID operación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {/* Filtro por estado */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as EstadoProceso | 'all')}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">Todos los estados</option>
                <option value={EstadoProceso.PENDIENTE}>Pendientes</option>
                <option value={EstadoProceso.EN_PROCESO}>En Proceso</option>
                <option value={EstadoProceso.COMPLETADO}>Completados</option>
                <option value={EstadoProceso.RECHAZADO}>Rechazados</option>
              </select>
              <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Botón de exportar */}
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <Download className="h-4 w-4" />
              Exportar
            </button>
          </div>

          {/* Lista de reembolsos */}
          {filteredReembolsos.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Sin Resultados
              </h4>
              <p className="text-gray-600">
                No hay reembolsos que coincidan con los filtros aplicados.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReembolsos.map((reembolso) => {
                const statusConfig = REIMBURSEMENT_STATUS_CONFIG[reembolso.estado_reembolso];
                const StatusIcon = statusConfig.icon;

                return (
                  <div 
                    key={reembolso.id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center border-2",
                              statusConfig.color
                            )}>
                              <StatusIcon className="h-5 w-5" />
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h5 className="font-semibold text-gray-900 truncate">
                              {reembolso.concepto}
                            </h5>
                            <p className="text-sm text-gray-600 mt-1">
                              Operación: {reembolso.operacion_id}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              {reembolso.fecha_reembolso && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(reembolso.fecha_reembolso).toLocaleDateString('es-ES')}
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <span className="font-medium">ID:</span>
                                <span className="font-mono">{reembolso.id.slice(-8)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 ml-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-600">
                            ${reembolso.monto_reembolso.toLocaleString()} {reembolso.moneda}
                          </p>
                          <div className={cn(
                            "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
                            statusConfig.color
                          )}>
                            {statusConfig.label}
                          </div>
                        </div>

                        <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Resumen final */}
          {filteredReembolsos.length > 0 && (
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-900">
                    Total Filtrado: {filteredReembolsos.length} reembolso{filteredReembolsos.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    Monto total: ${filteredReembolsos.reduce((sum, r) => sum + r.monto_reembolso, 0).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-700">
                    Fideicomiso
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}