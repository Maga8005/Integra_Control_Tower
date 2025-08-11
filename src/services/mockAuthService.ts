/**
 * Servicio de autenticación mock para producción
 * Integra Control Tower MVP
 */

import { AdminLoginResponse } from '../types';

// Credenciales de admin demo
const MOCK_ADMIN_CREDENTIALS = {
  email: 'admin@integra.com',
  password: 'admin123'
};

// Simular delay de red
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Login de administrador mock
 */
export const mockAdminLogin = async (email: string, password: string): Promise<AdminLoginResponse> => {
  console.log('🔐 Mock Admin Login - Email:', email);
  
  // Simular delay de red
  await delay(500);
  
  // Validar credenciales
  if (email === MOCK_ADMIN_CREDENTIALS.email && password === MOCK_ADMIN_CREDENTIALS.password) {
    console.log('✅ Mock Admin Login - Credenciales válidas');
    
    return {
      success: true,
      token: 'mock-admin-token-' + Date.now(),
      admin: {
        email,
        name: 'Administrador Demo',
        role: 'administrator'
      }
    };
  }
  
  console.log('❌ Mock Admin Login - Credenciales inválidas');
  return {
    success: false,
    error: 'Credenciales inválidas'
  };
};

/**
 * Mock de respuestas de dashboard para admin
 */
export const mockDashboardData = {
  operations: [],
  validation: {
    validOperations: 0,
    errorCount: 0,
    warningCount: 0
  },
  timestamp: new Date().toISOString()
};

/**
 * Mock de datos CSV para admin
 */
export const mockCSVData = {
  data: [],
  metadata: {
    fileName: 'mock-data.csv',
    fileSize: 0,
    rowCount: 0,
    uploadedAt: new Date().toISOString(),
    lastProcessed: new Date().toISOString()
  }
};

console.log('📦 Mock Auth Service cargado - Credenciales de demo:', {
  email: MOCK_ADMIN_CREDENTIALS.email,
  password: '***'
});