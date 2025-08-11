/**
 * Configuración de entorno para la aplicación
 * Integra Control Tower MVP
 */

export interface EnvironmentConfig {
  apiBaseUrl: string;
  isDevelopment: boolean;
  isProduction: boolean;
  useMockBackend: boolean;
}

// Detectar el entorno basado en la URL
const currentUrl = window.location.href;
const isDevelopment = currentUrl.includes('localhost') || currentUrl.includes('127.0.0.1');
const isProduction = !isDevelopment;

// Configuración del entorno
export const environment: EnvironmentConfig = {
  apiBaseUrl: isDevelopment ? 'http://localhost:3001' : '',
  isDevelopment,
  isProduction,
  useMockBackend: isProduction, // Usar mock en producción
};

console.log('🌍 Configuración de entorno:', {
  isDevelopment: environment.isDevelopment,
  isProduction: environment.isProduction,
  useMockBackend: environment.useMockBackend,
  apiBaseUrl: environment.apiBaseUrl
});