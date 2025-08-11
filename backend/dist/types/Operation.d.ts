/**
 * Definiciones TypeScript para el sistema de operaciones de importación
 * Integra Control Tower MVP
 */
export declare enum EstadoProceso {
    PENDIENTE = "pendiente",
    EN_PROCESO = "en_proceso",
    COMPLETADO = "completado",
    RECHAZADO = "rechazado"
}
export declare enum Currency {
    USD = "USD",
    EUR = "EUR",
    GBP = "GBP",
    COP = "COP"
}
export declare enum TipoDocumento {
    FACTURA = "factura",
    BILL_OF_LADING = "bill_of_lading",
    CERTIFICADO_SEGURO = "certificado_seguro",
    CERTIFICADO_ORIGEN = "certificado_origen",
    PACKING_LIST = "packing_list"
}
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
export interface GiroInfo {
    valorSolicitado: number;
    numeroGiro: string;
    porcentajeGiro: string;
    fechaVencimiento?: string;
    estado: EstadoProceso;
}
export interface Liberacion {
    numero: number;
    capital: number;
    fecha: string;
    estado: EstadoProceso;
    documentosRequeridos?: string[];
}
export interface DatosBancarios {
    beneficiario: string;
    banco: string;
    direccion: string;
    numeroCuenta: string;
    swift: string;
    paisBanco: string;
}
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
export interface EstadosProceso {
    cotizacion: EstadoProceso;
    documentosLegales: EstadoProceso;
    cuotaOperacional: EstadoProceso;
    compraInternacional: EstadoProceso;
    giroProveedor: EstadoProceso;
    facturaFinal: EstadoProceso;
}
export interface Documento {
    id: string;
    nombre: string;
    tipo: TipoDocumento;
    url: string;
    fechaSubida: string;
    estado: EstadoProceso;
    observaciones?: string;
}
export interface OperationDetail {
    id: string;
    numeroOperacion: string;
    clienteCompleto: string;
    clienteNit: string;
    tipoEmpresa: string;
    proveedorBeneficiario: string;
    paisProveedor: string;
    valorTotal: number;
    valorOperacion?: number;
    moneda: Currency;
    progresoGeneral: number;
    personaAsignada: string;
    paisExportador: string;
    paisImportador: string;
    rutaComercial: string;
    incoterms: string;
    montoTotal: number;
    montosLiberados: number;
    montosPendientes: number;
    extracostos: Extracostos;
    estados: EstadosProceso;
    giros: GiroInfo[];
    liberaciones: Liberacion[];
    documentos: Documento[];
    timeline: TimelineEvent[];
    fechaCreacion: string;
    ultimaActualizacion: string;
    datosBancarios: DatosBancarios;
    observaciones?: string;
    alertas?: Array<{
        tipo: 'warning' | 'error' | 'info';
        mensaje: string;
        fecha: string;
    }>;
    preciseProgress?: any;
    validation?: any;
    dateRanges?: any[];
    validationWarnings?: number;
    validationErrors?: number;
}
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
export interface UpdateOperationRequest {
    id: string;
    campos: Partial<OperationDetail>;
    usuario: string;
    motivo: string;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: string[];
    timestamp: string;
}
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
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
export type OperationStatus = EstadoProceso;
export type OperationId = string;
export type UserId = string;
export interface Notification {
    id: string;
    operacionId: OperationId;
    tipo: 'documento_pendiente' | 'vencimiento_proximo' | 'estado_actualizado' | 'error_proceso';
    mensaje: string;
    prioridad: 'alta' | 'media' | 'baja';
    leida: boolean;
    fechaCreacion: string;
    usuarioDestino: UserId;
    fechaVencimiento?: string | null;
}
export interface DashboardMetrics {
    totalOperaciones: number;
    operacionesActivas: number;
    valorTotalCartera: number;
    promedioTiempoProceso: number;
    operacionesPorEstado: Record<EstadoProceso, number>;
    alertasPendientes: number;
}
export interface OperationCard {
    id: string;
    clientName: string;
    clientNit: string;
    totalValue: string;
    route: string;
    assignedPerson: string;
    progress: number;
    status: 'draft' | 'in-progress' | 'completed' | 'on-hold';
    createdAt?: string;
    updatedAt?: string;
}
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
//# sourceMappingURL=Operation.d.ts.map