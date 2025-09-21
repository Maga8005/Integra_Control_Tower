/**
 * Dashboard de Pagos INTEGRA CO - Vista simplificada para MVP
 * Acceso abierto para todos los equipos
 */

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  Plus,
  TrendingUp,
  Building,
  Calendar,
  CreditCard,
  FileText,
  ChevronRight
} from 'lucide-react';
import { usePayments } from '../hooks/usePayments';
import { PASOS_INTEGRA_CO } from '../types';
import { cn } from '../../utils/cn';

interface OperacionPago {
  id: string;
  numeroOperacion: string;
  cliente: string;
  montoTotal: number;
  montoPagado: number;
  totalProveedores: number;
  pasoActual: number;
  estado: string;
  porcentajePagado: number;
}

export function IntegraCODashboard() {
  const {
    loading,
    error,
    operations,
    selectedOperation,
    stats,
    loadOperaciones,
    loadOperacionDetalle,
    avanzarWorkflow,
    marcarPago
  } = usePayments();

  const [showDetail, setShowDetail] = useState(false);

  // Cargar operaciones al inicializar
  useEffect(() => {
    loadOperaciones();
  }, [loadOperaciones]);

  const handleViewDetail = (operationId: string) => {
    setShowDetail(true);
    loadOperacionDetalle(operationId);
  };

  const handleAdvanceStep = async () => {
    if (selectedOperation) {
      await avanzarWorkflow(selectedOperation.id, selectedOperation.pasoActual);
    }
  };

  const getStepColor = (stepNumber: number, currentStep: number) => {
    if (stepNumber < currentStep) return 'bg-green-500';
    if (stepNumber === currentStep) return 'bg-blue-500';
    return 'bg-gray-300';
  };

  const handleMarcarPagado = async (pagoId: string) => {
    try {
      const referencia = prompt('Ingrese referencia de pago:');
      if (referencia && selectedOperation) {
        await marcarPago(selectedOperation.id, pagoId, referencia);
      }
    } catch (error) {
      console.error('Error marcando pago:', error);
    }
  };

  const getStatusBadge = (estado: string) => {
    const config = {
      'iniciado': { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      'en_proceso': { color: 'bg-blue-100 text-blue-700', icon: ArrowRight },
      'completado': { color: 'bg-green-100 text-green-700', icon: CheckCircle }
    };
    const { color, icon: Icon } = config[estado] || config['iniciado'];

    return (
      <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium", color)}>
        <Icon className="h-3 w-3" />
        {estado.replace('_', ' ')}
      </span>
    );
  };

  if (showDetail && selectedOperation) {

    return (
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={() => setShowDetail(false)}
          className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
        >
          ← Volver a lista
        </button>

        {/* Operation header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedOperation?.numeroOperacion}</h2>
              <p className="text-gray-600 mt-1">{selectedOperation?.cliente}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Progreso de Pago</p>
              <p className="text-2xl font-bold text-primary-600">{selectedOperation?.porcentajePagado || 0}%</p>
            </div>
          </div>
        </div>

        {/* 16 Steps Progress */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Proceso INTEGRA CO - Paso {selectedOperation?.pasoActual || 1} de 16</h3>
            <button
              onClick={handleAdvanceStep}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
              disabled={(selectedOperation?.pasoActual || 1) >= 16}
            >
              Avanzar al Siguiente Paso
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Visual steps */}
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              {PASOS_INTEGRA_CO.map((paso) => (
                <div
                  key={paso.numero}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold",
                    getStepColor(paso.numero, selectedOperation?.pasoActual || 1)
                  )}
                  title={`${paso.numero}. ${paso.nombre} - ${paso.equipo}`}
                >
                  {paso.numero}
                </div>
              ))}
            </div>
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -z-10"></div>
          </div>

          {/* Current step info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-600 font-medium">Paso Actual:</p>
            <p className="text-lg font-semibold text-blue-900">
              {PASOS_INTEGRA_CO[(selectedOperation?.pasoActual || 1) - 1]?.nombre}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Equipo Responsable: {PASOS_INTEGRA_CO[(selectedOperation?.pasoActual || 1) - 1]?.equipo}
            </p>
          </div>
        </div>

        {/* Providers and payments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building className="h-5 w-5 text-gray-600" />
              Proveedores ({selectedOperation?.totalProveedores || 0})
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">Proveedor Internacional A</p>
                <p className="text-sm text-gray-600">$50,000 USD - 3 pagos programados</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">Proveedor Nacional B</p>
                <p className="text-sm text-gray-600">$30,000 USD - 2 pagos programados</p>
              </div>
            </div>
            <button className="w-full mt-4 px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50">
              + Agregar Proveedor
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-600" />
              Próximos Pagos
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex justify-between">
                  <p className="font-medium">Anticipo 30%</p>
                  <span className="text-sm text-yellow-700">Hoy</span>
                </div>
                <p className="text-sm text-gray-600">$45,000 USD - Proveedor A</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between">
                  <p className="font-medium">Pago contra BL</p>
                  <span className="text-sm text-gray-600">15 días</span>
                </div>
                <p className="text-sm text-gray-600">$105,000 USD - Proveedor A</p>
              </div>
            </div>
            <button className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Marcar Pago Realizado
            </button>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Operaciones</p>
              <p className="text-xl font-bold text-gray-900">{stats?.totalOperaciones || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">En Proceso</p>
              <p className="text-xl font-bold text-gray-900">{stats?.enProceso || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completadas</p>
              <p className="text-xl font-bold text-gray-900">{stats?.completadas || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Monto Total</p>
              <p className="text-xl font-bold text-gray-900">
                ${stats?.montoTotal ? (stats.montoTotal / 1000).toFixed(0) : 0}K
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pagado</p>
              <p className="text-xl font-bold text-gray-900">
                {stats?.montoPagado && stats?.montoTotal
                  ? ((stats.montoPagado / stats.montoTotal) * 100).toFixed(0)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Operations Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Operaciones con Pagos INTEGRA CO</h2>
            <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nueva Operación
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Operación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cliente
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Paso Actual
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Proveedores
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Monto Total
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  % Pagado
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {operations.map((operation) => (
                <tr key={operation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-900">{operation.numeroOperacion}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {operation.cliente}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center gap-1">
                      <span className="font-medium">{operation.pasoActual}</span>
                      <span className="text-gray-500">/ 16</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      {operation.totalProveedores}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="font-medium">${operation.montoTotal.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${operation.porcentajePagado}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{operation.porcentajePagado}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {getStatusBadge(operation.estado)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleViewDetail(operation.id)}
                      className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 ml-auto"
                    >
                      Ver Detalle
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}