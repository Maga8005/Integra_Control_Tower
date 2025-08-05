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

// Interface para datos bancarios
export interface DatosBancarios {
  beneficiario: string;
  banco: string;
  direccion: string;
  numeroCuenta: string;
  swift: string;
  paisBanco: string;
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
  numeroOperacion: string;
  
  // Información Básica
  clienteCompleto: string;
  clienteNit: string; // NUEVO: NIT/RFC del cliente extraído de Docu. Cliente
  tipoEmpresa: string;
  proveedorBeneficiario: string;
  paisProveedor: string;
  valorTotal: number; // Valor de compra de mercancía
  valorOperacion?: number; // NUEVO: Valor total de la operación (incluye comisiones, etc.)
  moneda: Currency;
  progresoGeneral: number;
  personaAsignada: string;
  
  // Geografía y Logística
  paisExportador: string;
  paisImportador: string;
  rutaComercial: string;
  incoterms: string;
  
  // Información Financiera
  montoTotal: number;
  montosLiberados: number;
  montosPendientes: number;
  
  // Extracostos
  extracostos: Extracostos;
  
  // Estados críticos
  estados: EstadosProceso;
  
  // Giros y liberaciones
  giros: GiroInfo[];
  liberaciones: Liberacion[];
  
  // Documentación
  documentos: Documento[];
  
  // Timeline y metadatos
  timeline: TimelineEvent[];
  fechaCreacion: string;
  ultimaActualizacion: string;
  
  // Datos bancarios
  datosBancarios: DatosBancarios;
  
  // Información adicional para MVP
  observaciones?: string;
  alertas?: Array<{
    tipo: 'warning' | 'error' | 'info';
    mensaje: string;
    fecha: string;
  }>;
  
  // Nuevos campos de precisión (opcionales para compatibilidad)
  preciseProgress?: any; // OverallProgress from ProgressCalculator
  validation?: any; // ValidationResult from PhaseValidator  
  dateRanges?: any[]; // DateRange[] from dateUtils
  validationWarnings?: number;
  validationErrors?: number;
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
  fechaVencimiento?: string | null; // Campo opcional para notificaciones con vencimiento
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

// Interface para tarjeta de operación en dashboard
export interface OperationCard {
  id: string;
  clientName: string;
  clientNit: string; // NUEVO: NIT/RFC del cliente
  totalValue: string; // Formateado con moneda
  route: string;
  assignedPerson: string;
  progress: number;
  status: 'draft' | 'in-progress' | 'completed' | 'on-hold';
  createdAt?: string;
  updatedAt?: string;
}

// Interface para respuesta del endpoint dashboard
export interface DashboardResponse {
  success: boolean;
  data: OperationCard[];
  metadata: {
    totalOperations: number;
    lastUpdated: string;
    processingStats?: {
      validOperations: number;
      errorCount: number;
      warningCount: number;
    };
  };
  message?: string;
  errors?: string[];
}