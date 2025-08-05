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