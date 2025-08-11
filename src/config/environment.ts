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

// Detectar el entorno basado en la URL y hostname
const currentUrl = window.location.href;
const hostname = window.location.hostname;
const isDevelopment = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('localhost');
const isProduction = !isDevelopment;

// Para mayor seguridad, también verificar si estamos en Netlify
const isNetlify = hostname.includes('netlify.app') || hostname.includes('netlify.com');

// Configuración del entorno
export const environment: EnvironmentConfig = {
  apiBaseUrl: isDevelopment ? 'http://localhost:3001' : '',
  isDevelopment,
  isProduction: isProduction || isNetlify,
  useMockBackend: isProduction || isNetlify, // Usar mock en producción y Netlify
};

console.log('🌍 Configuración de entorno:', {
  currentUrl,
  hostname,
  isDevelopment: environment.isDevelopment,
  isProduction: environment.isProduction,
  isNetlify,
  useMockBackend: environment.useMockBackend,
  apiBaseUrl: environment.apiBaseUrl
});

// Log adicional para debugging
if (environment.useMockBackend) {
  console.log('📦 USANDO MOCK BACKEND - No se conectará a localhost:3001');
} else {
  console.log('🔗 USANDO BACKEND REAL - Conectará a:', environment.apiBaseUrl);
}