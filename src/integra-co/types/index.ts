// =====================================================
// TIPOS PARA SISTEMA DE PAGOS INTEGRA CO
// =====================================================

// Estados de proceso
export type EstadoWorkflow = 'iniciado' | 'en_proceso' | 'pausado' | 'completado';
export type EstadoProveedor = 'pendiente' | 'negociando' | 'aprobado' | 'rechazado' | 'pagando' | 'completado';
export type EstadoPago = 'pendiente' | 'programado' | 'aprobado' | 'procesando' | 'pagado' | 'rechazado' | 'cancelado';
export type DecisionComite = 'aprobado' | 'rechazado' | 'condicionado';

// Proveedor básico
export interface Proveedor {
  id: string;
  nombre: string;
  identificacion?: string;
  pais?: string;
  banco?: string;
  cuentaBancaria?: string;
  swift?: string;
  estado: string;
  createdAt?: Date;
}

// Relación Operación-Proveedor
export interface OperacionProveedor {
  id: string;
  operacionId: string;
  proveedorId?: string;
  proveedorNombre: string;
  montoTotal: number;
  moneda: string;
  porcentajeDelTotal?: number;
  estado: EstadoProveedor;
  createdAt?: Date;
}

// Pago/Giro
export interface Pago {
  id: string;
  operacionProveedorId: string;
  numeroPago: number;
  concepto: string;
  monto: number;
  moneda: string;
  fechaProgramada?: Date;
  fechaPago?: Date;
  estado: EstadoPago;
  referenciaPago?: string;
  createdAt?: Date;
}

// Workflow INTEGRA CO
export interface WorkflowIntegraCO {
  id: string;
  operacionId: string;
  pasoActual: number;
  estadosPasos: Record<string, EstadoPaso>;
  estadoGeneral: EstadoWorkflow;
  fechaInicio: Date;
  fechaActualizacion: Date;
  notas?: string;
}

// Estado de un paso específico
export interface EstadoPaso {
  nombre: string;
  estado: 'pendiente' | 'en_proceso' | 'completado' | 'bloqueado';
  fechaInicio?: Date;
  fechaCompletado?: Date;
}

// Definición de paso (catálogo)
export interface PasoIntegraCO {
  numeroPaso: number;
  nombre: string;
  descripcion?: string;
  equipoResponsable: string;
  duracionEstimadaDias: number;
}

// Evaluación del comité
export interface EvaluacionComite {
  id: string;
  operacionId: string;
  tipoEvaluacion: string;
  decision: DecisionComite;
  puntaje?: number;
  condiciones?: string;
  evaluador: string;
  fechaEvaluacion: Date;
}

// Vista consolidada de pagos
export interface ResumenPagosOperacion {
  operacionId: string;
  numeroOperacion: string;
  clienteNombre: string;
  totalProveedores: number;
  montoTotal: number;
  montoPagado: number;
  porcentajePagado: number;
  pasoActual: number;
  estadoWorkflow: EstadoWorkflow;
  proveedores: ProveedorConPagos[];
}

// Proveedor con sus pagos
export interface ProveedorConPagos {
  proveedor: OperacionProveedor;
  pagos: Pago[];
  totalPagado: number;
  porcentajePagado: number;
}

// Calendario de pagos
export interface ItemCalendarioPagos {
  id: string;
  operacionNumero: string;
  clienteNombre: string;
  proveedorNombre: string;
  numeroPago: number;
  concepto: string;
  monto: number;
  moneda: string;
  fechaProgramada: Date;
  estado: EstadoPago;
  urgencia: 'vencido' | 'hoy' | 'esta_semana' | 'futuro';
}

// Los 16 pasos del proceso INTEGRA CO
export const PASOS_INTEGRA_CO = [
  { numero: 1, nombre: 'Negociación con Cliente', equipo: 'Comercial' },
  { numero: 2, nombre: 'Negociación con Proveedor', equipo: 'Compras' },
  { numero: 3, nombre: 'Evaluación Comité', equipo: 'Comité' },
  { numero: 4, nombre: 'Firma Documentos', equipo: 'Legal' },
  { numero: 5, nombre: 'Financiamiento 80%', equipo: 'Tesorería' },
  { numero: 6, nombre: 'Pago Proveedores 1', equipo: 'Tesorería' },
  { numero: 7, nombre: 'Seguimiento Embarque', equipo: 'Operaciones' },
  { numero: 8, nombre: 'Pago Proveedores 2', equipo: 'Tesorería' },
  { numero: 9, nombre: 'Recepción Documentos', equipo: 'Operaciones' },
  { numero: 10, nombre: 'Pago Proveedores Final', equipo: 'Tesorería' },
  { numero: 11, nombre: 'Liberación Mercancía', equipo: 'Operaciones' },
  { numero: 12, nombre: 'Cobro 20%', equipo: 'Cobranza' },
  { numero: 13, nombre: 'Liquidación Extras', equipo: 'Finanzas' },
  { numero: 14, nombre: 'Pagos Logísticos', equipo: 'Tesorería' },
  { numero: 15, nombre: 'Conciliación', equipo: 'Finanzas' },
  { numero: 16, nombre: 'Cierre Operación', equipo: 'Operaciones' }
];