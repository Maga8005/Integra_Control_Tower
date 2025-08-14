/**
 * Definiciones TypeScript para el sistema de operaciones de importación
 * Integra Control Tower MVP
 */

// Enum para estados de procesos
export enum EstadoProceso {
  PENDIENTE = "pendiente",
  EN_PROCESO = "en_proceso",
  COMPLETADO = "completado",
  RECHAZADO = "rechazado"
}

// Enum para monedas soportadas
export enum Currency {
  USD = "USD",
  EUR = "EUR",
  GBP = "GBP",
  COP = "COP"
}

// Enum para tipos de documentos
export enum TipoDocumento {
  FACTURA = "factura",
  BILL_OF_LADING = "bill_of_lading",
  CERTIFICADO_SEGURO = "certificado_seguro",
  CERTIFICADO_ORIGEN = "certificado_origen",
  PACKING_LIST = "packing_list"
}

// Interface para eventos del timeline
export interface TimelineEvent {
  id: string;
  fase: string;
  descripcion: string;
  estado: EstadoProceso;
  progreso?: number;
  responsable: string;
  fecha: string;
  notas?: string;
}

// Interface para información de giros
export interface GiroInfo {
  valorSolicitado: number;
  numeroGiro: string;
  porcentajeGiro: string;
  fechaVencimiento?: string;
  estado: EstadoProceso;
}

// Interface para liberaciones
export interface Liberacion {
  numero: number;
  capital: number;
  fecha: string;
  estado: EstadoProceso;
  documentosRequeridos?: string[];
}

// Interface para datos bancarios (tabla bancos_proveedores)
export interface DatosBancarios {
  beneficiario: string;
  banco: string;
  direccion: string;
  numeroCuenta: string;
  swift: string;
  paisBanco: string;
}

// Interface para datos bancarios normalizados
export interface BancoProveedor {
  id: string;
  proveedor_id: string;
  nombre_banco: string;
  numero_cuenta: string;
  swift: string;
  iban?: string;
  nombre_beneficiario: string;
  codigo_postal?: string;
  provincia_estado?: string;
  created_at: string;
}

// Interface para pagos a proveedores (tabla pagos_proveedores)
export interface PagoProveedor {
  id: string;
  operacion_id: string;
  valor_total_compra: number;
  numero_pago: string;
  valor_pagado: number;
  porcentaje_pago: string;
  estado: EstadoProceso;
  created_at: string;
}

// Interface para entregas a clientes (tabla entrega_clientes)
export interface EntregaCliente {
  id: string;
  operacion_id: string;
  numero_entrega: number;
  capital: number;
  moneda: Currency;
  fecha_entrega: string;
  estado: EstadoProceso;
  created_at: string;
}

// Interface para clientes (tabla clientes)
export interface Cliente {
  id: string;
  nombre: string;
  nit: string;
  created_at: string;
}

// Interface para proveedores (tabla proveedores)
export interface Proveedor {
  id: string;
  nombre: string;
  created_at: string;
}

// Interface para extracostos
export interface Extracostos {
  comisionBancaria: number;
  gastosLogisticos: number;
  seguroCarga: number;
  totalExtracostos: number;
  detalleGastos?: Array<{
    concepto: string;
    valor: number;
    moneda: Currency;
  }>;
}

// Interface para información parseada del campo crítico
export interface ParsedOperationInfo {
  cliente: string;
  paisImportador: string;
  paisExportador: string;
  valorTotalCompra: number;
  monedaPago: Currency;
  terminosPago: string;
  giros: GiroInfo[];
  liberaciones: Liberacion[];
  incotermCompra: string;
  incotermVenta: string;
  datosBancarios: DatosBancarios;
}

// Interface para estados de los procesos
export interface EstadosProceso {
  cotizacion: EstadoProceso;
  documentosLegales: EstadoProceso;
  cuotaOperacional: EstadoProceso;
  compraInternacional: EstadoProceso;
  giroProveedor: EstadoProceso;
  facturaFinal: EstadoProceso;
}

// Interface para documentos
export interface Documento {
  id: string;
  nombre: string;
  tipo: TipoDocumento;
  url: string;
  fechaSubida: string;
  estado: EstadoProceso;
  observaciones?: string;
}

// Interface principal para operación completa
export interface OperationDetail {
  // Identificadores únicos
  id: string;
  operacionId?: string; // ID del CSV
  numeroOperacion: string;
  
  // Información Básica
  clienteCompleto: string;
  clienteNit: string; // NUEVO: NIT/RFC del cliente extraído de Docu. Cliente
  tipoEmpresa: string;
  proveedorBeneficiario: string;
  paisProveedor: string;
  valorTotal: number;
  valorOperacion?: number; // Calculado
  moneda: Currency;
  monedaPago: Currency;
  progresoGeneral: number;
  personaAsignada: string;
  
  // Geografía y Logística
  paisExportador: string;
  paisImportador: string;
  rutaComercial: string;
  incoterms: string;
  incotermCompra?: string;
  incotermVenta?: string;
  terminosPago?: string;
  
  // Información Financiera
  montoTotal: number;
  montosLiberados: number;
  montosPendientes: number;
  
  // Extracostos
  extracostos: Extracostos;
  
  // Estados críticos
  estados: EstadosProceso;
  
  // Giros y liberaciones (legacy)
  giros: GiroInfo[];
  liberaciones: Liberacion[];
  
  // Datos de tablas normalizadas
  pagosProveedores?: PagoProveedor[];
  entregasClientes?: EntregaCliente[];
  bancosProveedores?: BancoProveedor | null;
  
  // Estadísticas calculadas
  totalPagos?: number;
  totalEntregas?: number;
  numeroGiros?: number;
  numeroEntregas?: number;
  
  // Documentación
  documentos: Documento[];
  
  // Timeline y metadatos
  timeline: TimelineEvent[];
  fechaCreacion: string;
  createdAt?: string;
  ultimaActualizacion: string;
  
  // Datos bancarios (legacy)
  datosBancarios: DatosBancarios;
  
  // Información adicional
  inconvenientes?: string;
  descripcionInconvenientes?: string;
  nps?: number;
  observaciones?: string;
  alertas?: Array<{
    tipo: 'warning' | 'error' | 'info';
    mensaje: string;
    fecha: string;
  }>;
}

// Interface para solicitud de creación de operación
export interface CreateOperationRequest {
  cliente: string;
  proveedor: string;
  valorTotal: number;
  moneda: Currency;
  paisOrigen: string;
  paisDestino: string;
  incoterms: string;
  terminosPago: string;
  personaAsignada: string;
  observaciones?: string;
}

// Interface para actualización de operación
export interface UpdateOperationRequest {
  id: string;
  campos: Partial<OperationDetail>;
  usuario: string;
  motivo: string;
}

// Interface para respuesta de API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  timestamp: string;
}

// Interface para paginación
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Interface para filtros de búsqueda
export interface OperationFilters {
  cliente?: string;
  estado?: EstadoProceso;
  fechaDesde?: string;
  fechaHasta?: string;
  moneda?: Currency;
  personaAsignada?: string;
  valorMinimo?: number;
  valorMaximo?: number;
}

// Types auxiliares
export type OperationStatus = EstadoProceso;
export type OperationId = string;
export type UserId = string;

// Interface para notificaciones
export interface Notification {
  id: string;
  operacionId: OperationId;
  tipo: 'documento_pendiente' | 'vencimiento_proximo' | 'estado_actualizado' | 'error_proceso';
  mensaje: string;
  prioridad: 'alta' | 'media' | 'baja';
  leida: boolean;
  fechaCreacion: string;
  usuarioDestino: UserId;
}

// Interface para dashboard metrics
export interface DashboardMetrics {
  totalOperaciones: number;
  operacionesActivas: number;
  valorTotalCartera: number;
  promedioTiempoProceso: number;
  operacionesPorEstado: Record<EstadoProceso, number>;
  alertasPendientes: number;
}