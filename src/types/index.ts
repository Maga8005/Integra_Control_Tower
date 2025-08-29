// User Management Types
export type UserRole = 'client_with_operations' | 'client_without_operations' | 'administrator';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company?: string;
  avatar?: string;
  nit?: string; // NIT/RFC para clientes autenticados por NIT
}

// Import Financing Domain Types
export type Currency = 'USD' | 'EUR' | 'GBP';

export type OperationStatus = 
  | 'onboarding' 
  | 'documents' 
  | 'payment' 
  | 'shipping' 
  | 'completed';

export type TimelineStatus = 'completed' | 'current' | 'pending';

export interface TimelineEvent {
  id: string;
  title: string;
  status: TimelineStatus;
  date: string;
  description?: string;
  responsibleParty?: string;
}

export interface Supplier {
  name: string;
  country: string;
  contact?: string;
}

export interface ImportDetails {
  supplierName: string;
  supplierCountry: string;
  goodsDescription: string;
  estimatedShipping: string;
  paymentTerms: string;
}

export interface Operation {
  id: string;
  clientName: string;
  supplierName: string;
  amount: number;
  currency: Currency;
  status: OperationStatus;
  progress: number; // 0-100%
  timeline: TimelineEvent[];
  importDetails: ImportDetails;
  createdAt: string;
  updatedAt: string;
}

// Form Data Types
export interface LoginFormData {
  email: string;
  role: UserRole;
}

export interface AdminLoginFormData {
  email: string;
  password: string;
}

export interface OnboardingFormData {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  businessType: string;
  expectedVolume: string;
}

// UI State Types
export interface NotificationToast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

export interface DashboardStats {
  totalOperations: number;
  activeOperations: number;
  completedOperations: number;
  totalValue: number;
  currency: Currency;
}

// API Response Types (for future backend integration)
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Admin Authentication Types
export interface AdminLoginResponse {
  success: boolean;
  token?: string;
  admin?: {
    email: string;
    name: string;
    role: string;
  };
  error?: string;
}

// Financial Data Types
export interface PagoCliente {
  id: string;
  operacion_id: string;
  timeline_step_id: number;
  tipo_pago: 'cuota_operacional' | 'primer_anticipo' | 'segundo_anticipo';
  monto: number;
  moneda: string;
  fecha_pago: string | null;
  fecha_programada: string | null;
  estado: 'pendiente' | 'pagado' | 'vencido';
  descripcion: string | null;
  orden: number | null;
  created_at: string;
  updated_at: string;
}

export interface CostoLogistico {
  id: string;
  operacion_id: string;
  tipo_costo: 'flete_internacional' | 'gastos_destino' | 'seguro';
  monto: number;
  moneda: string;
  timeline_step_id: number;
  created_at: string;
  updated_at: string;
}

export interface ExtracostoOperacion {
  id: string;
  operacion_id: string;
  concepto: string;
  monto: number;
  moneda: string;
  fecha_pago: string | null;
  timeline_step_id: number;
  created_at: string;
  updated_at: string;
}

export interface ReembolsoOperacion {
  id: string;
  operacion_id: string;
  monto_reembolso: number;
  fecha_pago_intercompania: string | null;
  fecha_pago_fideicomiso: string | null;
  visible_solo_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface PagoProveedor {
  id: string;
  operacion_id: string;
  valor_total_compra: number;
  numero_pago: string;
  valor_pagado: number;
  porcentaje_pago: string;
  estado: string;
  fecha_solicitud: string | null;
  fecha_pago_realizado: string | null;
  created_at: string;
}

// Extended Operation interface with financial data
export interface BackendOperation {
  id: string;
  operacionId: string;
  clienteCompleto: string;
  clienteNit: string;
  proveedorBeneficiario: string;
  valorTotal: number;
  valorOperacion: number;
  moneda: string;
  monedaPago: string;
  rutaComercial: string;
  paisExportador: string;
  paisImportador: string;
  terminosPago: string;
  incotermCompra: string;
  incotermVenta: string;
  inconvenientes: boolean;
  descripcionInconvenientes: string | null;
  nps: number | null;
  observaciones: string | null;
  personaAsignada: string;
  progresoGeneral: number;
  ultimaActualizacion: string | null;
  createdAt: string;
  status?: 'draft' | 'in-progress' | 'completed' | 'on-hold';
  
  // Related data
  timeline: any[];
  giros: any[];
  pagosProveedores: PagoProveedor[];
  entregasClientes: any[];
  bancosProveedores: any;
  
  // Financial data
  pagosClientes: PagoCliente[];
  costosLogisticos: CostoLogistico[];
  extracostos: ExtracostoOperacion[];
  reembolsos?: ReembolsoOperacion[]; // Optional - only for admin
  
  // Internal IDs
  idIntegra: string | null;
  idsPaga: string[] | null;
  
  // Calculated totals
  totalPagos: number;
  totalEntregas: number;
  totalPagosClientes: number;
  totalCostosLogisticos: number;
  totalExtracostos: number;
  totalReembolsos?: number; // Optional - only for admin
  numeroGiros: number;
  numeroEntregas: number;
}

// Financial summary for timeline display
export interface ResumenFinanciero {
  totalRecaudadoCliente: number;
  totalPendienteCliente: number;
  totalPagadoProveedores: number;
  totalCostosLogisticos: number;
  totalExtracostos: number;
  totalReembolsos?: number; // Only for admin
}